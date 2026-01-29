"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Package, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import type { InventoryItem } from "@/types";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [skuSearch, setSkuSearch] = useState("");
  const [updateItem, setUpdateItem] = useState<InventoryItem | null>(null);
  const [updateQty, setUpdateQty] = useState(0);
  const [bulkUpdates, setBulkUpdates] = useState<Record<string, number>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["inventory", skuSearch],
    queryFn: async () => {
      const params = skuSearch ? new URLSearchParams({ sku: skuSearch }) : "";
      const res = await apiClient.get<{ items: InventoryItem[] }>(`/api/inventory${params ? `?${params}` : ""}`);
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const res = await apiClient.patch<InventoryItem>("/api/inventory", { id, quantity });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setUpdateItem(null);
      toast({ title: "Stock updated", description: "Inventory level has been updated.", variant: "success" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update stock.", variant: "destructive" });
    },
  });

  const handleUpdate = () => {
    if (!updateItem) return;
    const qty = updateQty ?? updateItem.quantity;
    if (qty < 0) {
      toast({ title: "Invalid quantity", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id: updateItem.id, quantity: qty });
  };

  const handleBulkUpdate = () => {
    const entries = Object.entries(bulkUpdates).filter(([, v]) => v !== undefined && v >= 0);
    if (entries.length === 0) {
      toast({ title: "No changes", description: "Set quantities in the table first.", variant: "warning" });
      return;
    }
    entries.forEach(([id, quantity]) => {
      updateMutation.mutate({ id, quantity });
    });
    setBulkUpdates({});
    toast({ title: "Bulk update", description: `${entries.length} item(s) updated.`, variant: "success" });
  };

  const handleExport = () => {
    const items = data?.items ?? [];
    const csv = ["sku,name,quantity,minThreshold,lastUpdated", ...items.map((i) => `${i.sku},${i.name},${i.quantity},${i.minThreshold},${i.lastUpdated}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Inventory exported as CSV." });
  };

  const items = data?.items ?? [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm sm:text-base text-muted-foreground">SKU search and stock levels.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} aria-label="Export inventory">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkUpdate} aria-label="Apply bulk update">
            Bulk update
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <CardTitle className="text-base sm:text-lg">Stock levels</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Search by SKU and update quantities.</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search SKU or name..."
              value={skuSearch}
              onChange={(e) => setSkuSearch(e.target.value)}
              className="pl-9"
              aria-label="Search inventory"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="py-4 text-center text-destructive">Failed to load inventory.</p>
          )}
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          )}
          {!isLoading && !isError && (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const isLow = item.quantity <= item.minThreshold;
                const bulkQty = bulkUpdates[item.id] ?? item.quantity;
                return (
                  <Card key={item.id} className={cn("overflow-hidden", isLow && "border-amber-500/50")}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{item.name}</CardTitle>
                          <CardDescription className="font-mono text-xs">{item.sku}</CardDescription>
                        </div>
                        <Package className={cn("h-5 w-5 shrink-0", isLow ? "text-amber-500" : "text-muted-foreground")} aria-hidden="true" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">Quantity</span>
                        <span className={cn("font-semibold text-xs sm:text-sm", isLow && "text-destructive")}>
                          {item.quantity} / {item.minThreshold}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={bulkQty}
                          onChange={(e) =>
                            setBulkUpdates((prev) => ({
                              ...prev,
                              [item.id]: Number(e.target.value) || 0,
                            }))
                          }
                          className="h-8 text-xs sm:text-sm flex-1"
                          aria-label={`Update quantity for ${item.sku}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 text-xs sm:text-sm"
                          onClick={() => {
                            setUpdateItem(item);
                            setUpdateQty(item.quantity);
                          }}
                          aria-label={`Open update modal for ${item.sku}`}
                        >
                          Update
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!updateItem} onOpenChange={(open) => !open && setUpdateItem(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg" aria-describedby="update-stock-desc">
          {updateItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Update stock</DialogTitle>
                <DialogDescription id="update-stock-desc" className="text-xs sm:text-sm">
                  Change quantity for {updateItem.sku} ({updateItem.name}).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="update-qty">New quantity</Label>
                  <Input
                    id="update-qty"
                    type="number"
                    min={0}
                    value={updateQty}
                    onChange={(e) => setUpdateQty(Number(e.target.value) ?? 0)}
                    aria-describedby="update-stock-desc"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUpdateItem(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending || updateQty < 0}
                >
                  {updateMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
