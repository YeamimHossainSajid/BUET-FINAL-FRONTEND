"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Truck, Search, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { generateIdempotencyKey } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const statusVariant: Record<OrderStatus, "pending" | "processing" | "shipped" | "delivered" | "cancelled"> = {
  pending: "pending",
  confirmed: "processing",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
};

const PAGE_SIZE = 10;

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const customerId = useAuthStore((s) => s.customerId);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [createSku, setCreateSku] = useState("");
  const [createQty, setCreateQty] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        offset: String((page - 1) * PAGE_SIZE),
        limit: String(PAGE_SIZE)
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await apiClient.get<{ orders: Order[]; total: number }>(
        `/api/v1/orders?${params}`
      );
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { customer_id: string; idempotency_key: string; items: { sku: string; quantity: number; price_cents: number }[] }) => {
      const res = await apiClient.post<{ order: Order }>("/api/v1/orders", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setCreateOpen(false);
      setCreateSku("");
      setCreateQty(1);
      toast({ title: "Order created", description: "New order has been created.", variant: "success" });
    },
    onError: (err: unknown) => {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Failed to create order";
      toast({ title: "Error", description: String(message), variant: "destructive" });
    },
  });

  const shipMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/api/v1/orders/${id}/ship`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setDetailOrder(null);
      toast({ title: "Shipped", description: "Order has been marked as shipped.", variant: "success" });
    },
  });

  const handleCreate = () => {
    if (!customerId || !createSku.trim() || createQty < 1) {
      toast({ title: "Invalid input", description: "SKU and quantity required.", variant: "destructive" });
      return;
    }
    // Mock price_cents for now as it's not in the creation UI
    createMutation.mutate({
      customer_id: customerId,
      idempotency_key: generateIdempotencyKey(),
      items: [{ sku: createSku.trim(), quantity: createQty, price_cents: 1000 }]
    });
  };

  const handleShip = (order: Order) => {
    shipMutation.mutate(order.id);
  };

  const handleExport = () => {
    const orders = data?.orders ?? [];
    const csv = ["id,customer_id,status,total_cents,created_at", ...orders.map((o) => `${o.id},${o.customer_id},${o.status},${o.total_cents},${o.created_at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Orders exported as CSV." });
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage and track orders from Valerix API.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} aria-label="Export orders">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setCreateOpen(true)} aria-label="Create order">
            <Plus className="mr-2 h-4 w-4" />
            Create order
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <CardTitle className="text-base sm:text-lg">Order List</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Filter by status and paginate.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as OrderStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="py-4 text-center text-destructive">Failed to load orders.</p>
          )}
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}
          {!isLoading && !isError && data && (
            <>
              <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id.split("-")[0]}…</TableCell>
                        <TableCell className="text-xs">{order.customer_id}</TableCell>
                        <TableCell>{order.items?.length ?? 0} sku(s)</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">${(order.total_cents / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailOrder(order)}
                            aria-label={`View order ${order.id}`}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No orders found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({data.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      aria-label="Previous page"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      aria-label="Next page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Create order</DialogTitle>
            <DialogDescription id="create-order-desc" className="text-xs sm:text-sm">
              Enter SKU and quantity. Item will be added with a default mock price.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-sku">SKU</Label>
              <Input
                id="create-sku"
                placeholder="e.g. WIDGET-001"
                value={createSku}
                onChange={(e) => setCreateSku(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-qty">Quantity</Label>
              <Input
                id="create-qty"
                type="number"
                min={1}
                value={createQty}
                onChange={(e) => setCreateQty(Number(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !createSku.trim() || createQty < 1}
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {detailOrder && (
            <>
              <SheetHeader>
                <SheetTitle>Order Details</SheetTitle>
                <SheetDescription className="font-mono text-xs">{detailOrder.id}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                    <Badge variant={statusVariant[detailOrder.status]} className="mt-1">{detailOrder.status}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                    <p className="font-semibold text-lg">${(detailOrder.total_cents / 100).toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Items</p>
                  <div className="space-y-2">
                    {detailOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                        <div>
                          <p className="font-medium text-sm">{item.sku}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">${(item.price_cents / 100).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Metadata</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Customer:</span> {detailOrder.customer_id}</p>
                    <p><span className="text-muted-foreground">Created:</span> {new Date(detailOrder.created_at).toLocaleString()}</p>
                    <p><span className="text-muted-foreground">Idempotency:</span> {detailOrder.idempotency_key}</p>
                  </div>
                </div>

                {detailOrder.status === "pending" || detailOrder.status === "confirmed" ? (
                  <Button
                    className="w-full"
                    onClick={() => handleShip(detailOrder)}
                    disabled={shipMutation.isPending}
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    {shipMutation.isPending ? "Shipping…" : "Mark as shipped"}
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
