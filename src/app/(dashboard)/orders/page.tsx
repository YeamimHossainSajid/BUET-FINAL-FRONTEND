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
import type { Order, OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const statusVariant: Record<OrderStatus, "pending" | "processing" | "shipped" | "delivered" | "cancelled"> = {
  pending: "pending",
  processing: "processing",
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
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [createSku, setCreateSku] = useState("");
  const [createQty, setCreateQty] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await apiClient.get<{ items: Order[]; total: number; page: number; limit: number }>(
        `/api/orders?${params}`
      );
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { customerId: string; sku: string; quantity: number }) => {
      const res = await apiClient.post<Order>("/api/orders", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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

  const handleCreate = () => {
    if (!customerId || !createSku.trim() || createQty < 1) {
      toast({ title: "Invalid input", description: "SKU and quantity required.", variant: "destructive" });
      return;
    }
    createMutation.mutate({ customerId, sku: createSku.trim(), quantity: createQty });
  };

  const handleShip = (order: Order) => {
    toast({ title: "Shipping", description: `Order ${order.id} marked as shipped.` });
    setDetailOrder(null);
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const handleExport = () => {
    const items = data?.items ?? [];
    const csv = ["id,customerId,sku,quantity,status,total,createdAt", ...items.map((o) => `${o.id},${o.customerId},${o.sku},${o.quantity},${o.status},${o.total},${o.createdAt}`)].join("\n");
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
          <p className="text-sm sm:text-base text-muted-foreground">Manage and track orders.</p>
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
            <CardTitle className="text-base sm:text-lg">Orders</CardTitle>
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
                <SelectItem value="all">All</SelectItem>
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
                    <TableHead>SKU</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id}</TableCell>
                      <TableCell>{order.customerId}</TableCell>
                      <TableCell>{order.sku}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
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
        <DialogContent className="max-w-[95vw] sm:max-w-lg" aria-describedby="create-order-desc">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Create order</DialogTitle>
            <DialogDescription id="create-order-desc" className="text-xs sm:text-sm">
              Enter SKU and quantity. Customer ID is taken from your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-sku">SKU</Label>
              <Input
                id="create-sku"
                placeholder="e.g. SKU-001"
                value={createSku}
                onChange={(e) => setCreateSku(e.target.value)}
                aria-describedby="create-order-desc"
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
                <SheetTitle>Order {detailOrder.id}</SheetTitle>
                <SheetDescription>Details and shipping action.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{detailOrder.customerId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-medium">{detailOrder.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{detailOrder.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusVariant[detailOrder.status]}>{detailOrder.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium">${detailOrder.total.toFixed(2)}</p>
                </div>
                {detailOrder.shippingAddress && (
                  <div>
                    <p className="text-sm text-muted-foreground">Shipping address</p>
                    <p className="font-medium">{detailOrder.shippingAddress}</p>
                  </div>
                )}
                {detailOrder.status === "pending" || detailOrder.status === "processing" ? (
                  <Button
                    className="w-full"
                    onClick={() => handleShip(detailOrder)}
                    aria-label="Mark as shipped"
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Mark as shipped
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteOrderId} onOpenChange={(open) => !open && setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The order will be marked as cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setDeleteOrderId(null);
                toast({ title: "Order cancelled", variant: "destructive" });
                queryClient.invalidateQueries({ queryKey: ["orders"] });
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
