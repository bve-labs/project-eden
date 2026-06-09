import { NextResponse } from "next/server"

import { getTelemetryPayload } from "@/lib/telemetry"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const payload = await getTelemetryPayload()

  return NextResponse.json(payload, {
    status: payload.source === "fallback" && payload.error ? 503 : 200,
  })
}
