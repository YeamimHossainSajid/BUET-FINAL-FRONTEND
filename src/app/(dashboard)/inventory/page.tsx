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

  // We'll only fetch if there's a search term
  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: ["inventory", skuSearch],
    queryFn: async () => {
      if (!skuSearch) return null;
      const res = await apiClient.get<InventoryItem>(`/api/v1/inventory/${skuSearch}`);
      return res.data;
    },
    enabled: !!skuSearch,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ sku, quantity }: { sku: string; quantity: number }) => {
      const res = await apiClient.put<InventoryItem>(`/api/v1/inventory/${sku}`, { quantity });
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["inventory", updated.sku], updated);
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setUpdateItem(null);
      toast({ title: "Stock updated", description: `Inventory for ${updated.sku} has been updated.`, variant: "success" });
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || "Failed to update stock.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const handleUpdate = () => {
    if (!updateItem) return;
    updateMutation.mutate({ sku: updateItem.sku, quantity: updateQty });
  };

  const handleExport = () => {
    if (!item) {
      toast({ title: "Nothing to export", description: "Search for a SKU first.", variant: "warning" });
      return;
    }
    const csv = ["sku,quantity,reserved,updated_at", `${item.sku},${item.quantity},${item.reserved},${item.updated_at}`].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${item.sku}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "SKU data exported as CSV." });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Search and manage stock by SKU.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} aria-label="Export inventory" disabled={!item}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Search SKU</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Enter a SKU code to view and update stock levels.</CardDescription>
          <div className="relative w-full sm:w-96 mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="e.g. WIDGET-001"
              value={skuSearch}
              onChange={(e) => setSkuSearch(e.target.value)}
              className="pl-9"
              aria-label="Search SKU"
            />
          </div>
        </CardHeader>
        <CardContent>
          {!skuSearch && (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Enter a SKU to begin.</p>
            </div>
          )}

          {skuSearch && (
            <>
              {isLoading && (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
              )}

              {isError && (
                <div className="py-12 text-center text-destructive">
                  <p>Item not found or error fetching data.</p>
                </div>
              )}

              {item && !isLoading && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className={cn("overflow-hidden border-2 border-primary/20 bg-primary/5")}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">Product Information</CardTitle>
                          <CardDescription className="font-mono text-sm font-bold text-primary">{item.sku}</CardDescription>
                        </div>
                        <Package className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Available</p>
                          <p className="text-2xl font-bold">{item.quantity}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Reserved</p>
                          <p className="text-2xl font-bold">{item.reserved}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t text-xs text-muted-foreground">
                        Last updated: {new Date(item.updated_at).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Update Stock</CardTitle>
                      <CardDescription>Adjust the available quantity in the warehouse.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="inventory-qty">New Quantity</Label>
                        <Input
                          id="inventory-qty"
                          type="number"
                          min={0}
                          defaultValue={item.quantity}
                          onChange={(e) => setUpdateQty(Number(e.target.value))}
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          setUpdateItem(item);
                          handleUpdate();
                        }}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? "Updating..." : "Update Stock"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
