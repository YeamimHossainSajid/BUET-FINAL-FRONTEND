"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ShoppingCart, DollarSign, AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

const statusVariant: Record<OrderStatus, "pending" | "processing" | "shipped" | "delivered" | "cancelled"> = {
  pending: "pending",
  processing: "processing",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
};

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get<{
        ordersCount: number;
        revenue: number;
        stockAlerts: number;
        recentOrders: Array<{ id: string; sku: string; quantity: number; status: OrderStatus; total: number; createdAt: string }>;
        lowInventory: Array<{ sku: string; name: string; quantity: number; minThreshold: number }>;
      }>("/api/dashboard");
      return res.data;
    },
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive">Failed to load dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Overview of your e-commerce metrics.</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.ordersCount?.toLocaleString() ?? "—"}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${data?.revenue != null ? data.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                </div>
                <p className="text-xs text-muted-foreground">Current period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stockAlerts ?? "—"}</div>
                <p className="text-xs text-muted-foreground">Low inventory items</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.recentOrders?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground">Last 24h</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders with quick actions.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.recentOrders ?? []).map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">{o.id}</TableCell>
                        <TableCell>{o.sku}</TableCell>
                        <TableCell>{o.quantity}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[o.status]}>{o.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">${o.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Low Inventory Alerts</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Items below threshold.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <ul className="space-y-2 sm:space-y-3" role="list">
                {(data?.lowInventory ?? []).map((item) => (
                  <li
                    key={item.sku}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{item.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono">{item.sku}</p>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2">
                      <p className={cn("font-semibold text-sm sm:text-base", item.quantity <= item.minThreshold && "text-destructive")}>
                        {item.quantity} / {item.minThreshold}
                      </p>
                      <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm shrink-0">
                        <Link href="/inventory">Update</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Order Trends</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Real-time metrics (mock trend).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[300px] w-full">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { name: "Mon", value: 40 },
                    { name: "Tue", value: 65 },
                    { name: "Wed", value: 52 },
                    { name: "Thu", value: 78 },
                    { name: "Fri", value: 90 },
                    { name: "Sat", value: 120 },
                    { name: "Sun", value: 95 },
                  ]}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-[10px] sm:text-xs" />
                  <YAxis className="text-[10px] sm:text-xs" />
                  <Tooltip contentStyle={{ borderRadius: "var(--radius)" }} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
