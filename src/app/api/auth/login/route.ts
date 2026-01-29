import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, token } = body;
    if (!customerId || !token) {
      return NextResponse.json(
        { message: "Customer ID and token are required" },
        { status: 400 }
      );
    }
    const expiresAt = Date.now() + 3600 * 1000;
    return NextResponse.json({
      accessToken: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: customerId, exp: Math.floor(expiresAt / 1000) }))}.mock`,
      refreshToken: `refresh_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      expiresAt,
    });
  } catch {
    return NextResponse.json(
      { message: "Invalid request" },
      { status: 400 }
    );
  }
}
