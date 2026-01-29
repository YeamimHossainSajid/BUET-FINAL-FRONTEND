import { NextRequest, NextResponse } from "next/server";
import type { Order, OrderStatus } from "@/types";

const MOCK_ORDERS: Order[] = [
  {
    id: "ord-1",
    customer_id: "CUST-001",
    status: "pending",
    total_cents: 19998,
    idempotency_key: "idem_mock_1",
    items: [{ id: "item-1", order_id: "ord-1", sku: "SKU-001", quantity: 2, price_cents: 9999, created_at: new Date().toISOString() }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "ord-2",
    customer_id: "CUST-001",
    status: "confirmed",
    total_cents: 8999,
    idempotency_key: "idem_mock_2",
    items: [{ id: "item-2", order_id: "ord-2", sku: "SKU-002", quantity: 1, price_cents: 8999, created_at: new Date(Date.now() - 86400 * 1000).toISOString() }],
    created_at: new Date(Date.now() - 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "ord-3",
    customer_id: "CUST-002",
    status: "shipped",
    total_cents: 44995,
    idempotency_key: "idem_mock_3",
    items: [{ id: "item-3", order_id: "ord-3", sku: "SKU-003", quantity: 5, price_cents: 8999, created_at: new Date(Date.now() - 86400 * 2 * 1000).toISOString() }],
    created_at: new Date(Date.now() - 86400 * 2 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    shippingAddress: "123 Main St"
  },
  {
    id: "ord-4",
    customer_id: "CUST-001",
    status: "delivered",
    total_cents: 9999,
    idempotency_key: "idem_mock_4",
    items: [{ id: "item-4", order_id: "ord-4", sku: "SKU-001", quantity: 1, price_cents: 9999, created_at: new Date(Date.now() - 86400 * 3 * 1000).toISOString() }],
    created_at: new Date(Date.now() - 86400 * 3 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "ord-5",
    customer_id: "CUST-003",
    status: "cancelled",
    total_cents: 0,
    idempotency_key: "idem_mock_5",
    items: [{ id: "item-5", order_id: "ord-5", sku: "SKU-004", quantity: 3, price_cents: 0, created_at: new Date(Date.now() - 86400 * 4 * 1000).toISOString() }],
    created_at: new Date(Date.now() - 86400 * 4 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as OrderStatus | null;
  const limit = Number(searchParams.get("limit") ?? 10);
  const offset = Number(searchParams.get("offset") ?? 0);

  let list = [...MOCK_ORDERS];
  if (status) list = list.filter((o) => o.status === status);

  const total = list.length;
  const orders = list.slice(offset, offset + limit);
  return NextResponse.json({ orders, total });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, items, idempotency_key } = body;

    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "customer_id and items required" }, { status: 400 });
    }

    const total_cents = items.reduce((sum: number, item: any) => sum + (item.price_cents * item.quantity), 0);
    const orderId = `ord-${Date.now()}`;

    const order: Order = {
      id: orderId,
      customer_id,
      status: "pending",
      total_cents,
      idempotency_key: idempotency_key || `idem_${Date.now()}`,
      items: items.map((item: any, idx: number) => ({
        id: `item-${orderId}-${idx}`,
        order_id: orderId,
        sku: item.sku,
        quantity: item.quantity,
        price_cents: item.price_cents,
        created_at: new Date().toISOString()
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
