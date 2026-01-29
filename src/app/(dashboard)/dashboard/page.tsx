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
import { ShoppingCart, DollarSign, AlertTriangle, ArrowUpRight, Truck } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { OrderStatus, AnalyticsSummary, Order } from "@/types";
import { cn } from "@/lib/utils";

const statusVariant: Record<OrderStatus, "pending" | "processing" | "shipped" | "delivered" | "cancelled"> = {
  pending: "pending",
  confirmed: "processing",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
};

export default function DashboardPage() {
  const { data: analytics, isLoading: isAnalyticsLoading, isError: isAnalyticsError } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await apiClient.get<AnalyticsSummary>("/api/v1/analytics/summary", {
        params: { period: "last_24h" }
      });
      return res.data;
    },
  });

  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const res = await apiClient.get<{ orders: Order[] }>("/api/v1/orders", {
        params: { limit: 5 }
      });
      return res.data;
    },
  });

  const isLoading = isAnalyticsLoading || isOrdersLoading;
  const isError = isAnalyticsError;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive">Failed to load dashboard metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Overview of your e-commerce metrics from Valerix API.</p>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Orders Created</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.orders_created?.toLocaleString() ?? "0"}</div>
                <p className="text-xs text-muted-foreground">Last 24h</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${analytics?.total_revenue_cents != null ? (analytics.total_revenue_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                </div>
                <p className="text-xs text-muted-foreground">Last 24h (Cents to USD)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Orders Shipped</CardTitle>
                <Truck className="h-4 w-4 text-blue-500" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.orders_shipped ?? "0"}</div>
                <p className="text-xs text-muted-foreground">Last 24h</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Updates</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.inventory_updates ?? "0"}</div>
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
              <CardDescription>Latest orders from the API.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isOrdersLoading ? (
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
                      <TableHead>Order ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(ordersData?.orders ?? []).map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">{o.id}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[o.status]}>{o.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">${(o.total_cents / 100).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {(!ordersData?.orders || ordersData.orders.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                          No recent orders found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Average Order Value</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Metrics for the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                ${analytics?.average_order_value_cents != null ? (analytics.average_order_value_cents / 100).toFixed(2) : "0.00"}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Average value per order</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Notifications Sent</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Total alerts processed today.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-end gap-2 px-2">
            {/* Simple mock bar chart using CSS since real trend data isn't in summary */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="bg-primary/20 hover:bg-primary/40 rounded-t w-full transition-all"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground px-2">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
