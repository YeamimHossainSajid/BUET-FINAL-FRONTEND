import { NextRequest, NextResponse } from "next/server";
import type { Order, OrderStatus } from "@/types";

const MOCK_ORDERS: Order[] = [
  { id: "1", customerId: "CUST-001", sku: "SKU-001", quantity: 2, status: "pending", total: 199.98, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "2", customerId: "CUST-001", sku: "SKU-002", quantity: 1, status: "processing", total: 89.99, createdAt: new Date(Date.now() - 86400 * 1000).toISOString(), updatedAt: new Date().toISOString() },
  { id: "3", customerId: "CUST-002", sku: "SKU-003", quantity: 5, status: "shipped", total: 449.95, createdAt: new Date(Date.now() - 86400 * 2 * 1000).toISOString(), updatedAt: new Date().toISOString(), shippingAddress: "123 Main St" },
  { id: "4", customerId: "CUST-001", sku: "SKU-001", quantity: 1, status: "delivered", total: 99.99, createdAt: new Date(Date.now() - 86400 * 3 * 1000).toISOString(), updatedAt: new Date().toISOString() },
  { id: "5", customerId: "CUST-003", sku: "SKU-004", quantity: 3, status: "cancelled", total: 0, createdAt: new Date(Date.now() - 86400 * 4 * 1000).toISOString(), updatedAt: new Date().toISOString() },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as OrderStatus | null;
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  let list = [...MOCK_ORDERS];
  if (status) list = list.filter((o) => o.status === status);
  const total = list.length;
  const items = list.slice((page - 1) * limit, page * limit);
  return NextResponse.json({ items, total, page, limit });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, sku, quantity } = body;
    if (!customerId || !sku || quantity == null) {
      return NextResponse.json({ message: "customerId, sku, quantity required" }, { status: 400 });
    }
    const order: Order = {
      id: String(Date.now()),
      customerId,
      sku,
      quantity: Number(quantity),
      status: "pending",
      total: quantity * 99.99,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
