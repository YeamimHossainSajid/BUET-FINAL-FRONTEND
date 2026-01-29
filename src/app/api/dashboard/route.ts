import { NextResponse } from "next/server";

export async function GET() {
  const ordersCount = 1247;
  const revenue = 89432.5;
  const stockAlerts = 3;
  const recentOrders = [
    { id: "1", sku: "SKU-001", quantity: 2, status: "pending", total: 199.98, createdAt: new Date().toISOString() },
    { id: "2", sku: "SKU-002", quantity: 1, status: "processing", total: 89.99, createdAt: new Date(Date.now() - 3600 * 1000).toISOString() },
    { id: "3", sku: "SKU-003", quantity: 5, status: "shipped", total: 449.95, createdAt: new Date(Date.now() - 7200 * 1000).toISOString() },
  ];
  const lowInventory = [
    { sku: "SKU-002", name: "Widget B", quantity: 12, minThreshold: 15 },
    { sku: "SKU-003", name: "Widget C", quantity: 8, minThreshold: 10 },
    { sku: "SKU-005", name: "Widget E", quantity: 3, minThreshold: 5 },
  ];
  return NextResponse.json({
    ordersCount,
    revenue,
    stockAlerts,
    recentOrders,
    lowInventory,
  });
}
