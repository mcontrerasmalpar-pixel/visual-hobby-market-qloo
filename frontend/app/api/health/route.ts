import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "SYSTEM_ONLINE",
    qloo_base_url:
      process.env.QLOO_BASE_URL || "https://hackathon.api.qloo.com",
    qloo_api_key_configured: Boolean(process.env.QLOO_API_KEY),
  });
}
