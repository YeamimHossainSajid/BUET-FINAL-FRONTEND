import { NextRequest, NextResponse } from "next/server";
import type { InventoryItem } from "@/types";

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "1", sku: "SKU-001", name: "Widget A", quantity: 45, minThreshold: 20, lastUpdated: new Date().toISOString() },
  { id: "2", sku: "SKU-002", name: "Widget B", quantity: 12, minThreshold: 15, lastUpdated: new Date(Date.now() - 3600 * 1000).toISOString() },
  { id: "3", sku: "SKU-003", name: "Widget C", quantity: 8, minThreshold: 10, lastUpdated: new Date(Date.now() - 7200 * 1000).toISOString() },
  { id: "4", sku: "SKU-004", name: "Widget D", quantity: 120, minThreshold: 25, lastUpdated: new Date().toISOString() },
  { id: "5", sku: "SKU-005", name: "Widget E", quantity: 3, minThreshold: 5, lastUpdated: new Date().toISOString() },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get("sku")?.toLowerCase();
  let list = [...MOCK_INVENTORY];
  if (sku) list = list.filter((i) => i.sku.toLowerCase().includes(sku) || i.name.toLowerCase().includes(sku));
  return NextResponse.json({ items: list });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, quantity } = body;
    if (!id || quantity == null) {
      return NextResponse.json({ message: "id and quantity required" }, { status: 400 });
    }
    const item = MOCK_INVENTORY.find((i) => i.id === id);
    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 });
    item.quantity = Number(quantity);
    item.lastUpdated = new Date().toISOString();
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
