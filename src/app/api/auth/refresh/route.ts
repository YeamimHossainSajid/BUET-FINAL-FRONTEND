import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;
    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token required" }, { status: 400 });
    }
    const expiresAt = Date.now() + 3600 * 1000;
    return NextResponse.json({
      accessToken: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: "user", exp: Math.floor(expiresAt / 1000) }))}.mock`,
      expiresAt,
    });
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
