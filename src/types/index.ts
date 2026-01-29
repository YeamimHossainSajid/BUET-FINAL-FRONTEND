export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: string;
  order_id: string;
  sku: string;
  quantity: number;
  price_cents: number;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  status: OrderStatus;
  total_cents: number;
  idempotency_key: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  // Kept for backward compatibility if needed in UI
  shippingAddress?: string;
}

export interface StockResponse {
  sku: string;
  quantity: number;
  reserved: number;
  updated_at: string;
}

export interface InventoryItem extends StockResponse {
  id: string; // Add id if needed for keys
  name: string; // Add name if needed for UI
  minThreshold: number; // Add for alerts
}

export interface AnalyticsSummary {
  period: string;
  orders_created: number;
  orders_shipped: number;
  total_revenue_cents: number;
  average_order_value_cents: number;
  notifications_sent: number;
  inventory_updates: number;
}

export interface AnalyticsMetric {
  label: string;
  value: number;
  change?: number;
  changeType?: "increase" | "decrease";
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface User {
  id: string;
  customerId: string;
  name: string;
  email?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export type NotificationType = "order_created" | "order_shipped" | "order_timeout" | "inventory_low" | "system_alert";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  metadata?: string;
  created_at: string;
  updated_at: string;
}
