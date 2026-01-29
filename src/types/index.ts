export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  customerId: string;
  sku: string;
  quantity: number;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  minThreshold: number;
  lastUpdated: string;
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

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}
