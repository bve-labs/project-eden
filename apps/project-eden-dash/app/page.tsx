import { CommandCenter } from "@/components/command-center"
import { getTelemetryPayload } from "@/lib/telemetry"

export const runtime = "nodejs"
export const revalidate = false

export default async function Page() {
  const telemetry = await getTelemetryPayload()

  return <CommandCenter telemetry={telemetry} />
}
