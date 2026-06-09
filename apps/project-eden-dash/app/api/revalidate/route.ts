import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

type RevalidatePayload = {
  secret?: unknown
  runId?: unknown
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function parsePayload(request: Request): Promise<RevalidatePayload | null> {
  try {
    return (await request.json()) as RevalidatePayload
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const payload = await parsePayload(request)
  const secret = typeof payload?.secret === "string" ? payload.secret : ""
  const runId = typeof payload?.runId === "string" ? payload.runId : ""
  const expectedSecret = process.env.REVALIDATION_TOKEN

  if (!payload || !runId || !secret) {
    return NextResponse.json(
      { error: "Missing required JSON payload fields: secret and runId." },
      { status: 400 },
    )
  }

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  revalidatePath("/")

  return NextResponse.json({ revalidated: true, runId })
}
