import { NextResponse } from "next/server"

import { getSwarmTelemetryPayload } from "@/lib/swarm-telemetry"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const payload = await getSwarmTelemetryPayload()

  return NextResponse.json(payload, {
    status: payload.source === "fallback" && payload.error ? 503 : 200,
  })
}
