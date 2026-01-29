import { NextRequest, NextResponse } from "next/server";

const PERIODS = ["1h", "24h", "7d"] as const;

function generateTrendData(period: string) {
  const points = period === "1h" ? 12 : period === "24h" ? 24 : 7;
  return Array.from({ length: points }, (_, i) => ({
    name: period === "1h" ? `${i * 5}m` : period === "24h" ? `${i}h` : `Day ${i + 1}`,
    orders: Math.floor(20 + Math.random() * 80),
    revenue: Math.floor(500 + Math.random() * 2000),
  }));
}

function topProducts() {
  return [
    { name: "Widget A", sku: "SKU-001", sales: 342, revenue: 34158 },
    { name: "Widget C", sku: "SKU-003", sales: 198, revenue: 19701 },
    { name: "Widget B", sku: "SKU-002", sales: 156, revenue: 14044 },
    { name: "Widget D", sku: "SKU-004", sales: 89, revenue: 8901 },
  ];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "24h") as (typeof PERIODS)[number];
  const validPeriod = PERIODS.includes(period) ? period : "24h";
  const orderTrend = generateTrendData(validPeriod);
  const revenueTrend = generateTrendData(validPeriod);
  const topSelling = topProducts();
  const revenueCurrent = 89432.5;
  const revenuePrevious = 78210;
  const change = ((revenueCurrent - revenuePrevious) / revenuePrevious) * 100;
  return NextResponse.json({
    period: validPeriod,
    orderTrend,
    revenueTrend,
    topSelling,
    revenue: { current: revenueCurrent, previous: revenuePrevious, change },
  });
}
