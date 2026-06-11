"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, AlertTriangle, GitBranch, Trophy } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SwarmStatus = "RUNNING" | "SUCCESS" | "KILLED_EARLY" | "CRASHED"
type SwarmHyperparameters = Record<string, string | number | boolean | null>

type BestRun = {
  runId: string
  agentId: string
  finalLoss: number
  finalValBpb: number
  maxIters: number
  hyperparameters: SwarmHyperparameters
  status: SwarmStatus
  lastCreatedAt: string
}

type SwarmPoint = {
  step: number
  loss: number
  valBpb: number
  stepTime: number
  status: SwarmStatus
  createdAt: string
}

type SwarmRunSeries = {
  runId: string
  agentId: string
  hyperparameters: SwarmHyperparameters
  status: SwarmStatus
  lastCreatedAt: string
  points: SwarmPoint[]
}

type SwarmTelemetryPayload = {
  ok: boolean
  source: "azure-sql" | "fallback"
  bestRuns: BestRun[]
  runs: SwarmRunSeries[]
  error: string | null
}

const HIGHLIGHT_SLOTS = [0, 1, 2]

function formatMetric(value: number, digits = 4) {
  return Number.isFinite(value) ? value.toFixed(digits) : "0.0000"
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return "awaiting live data"
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getHyperparameterLabel(hyperparameters: SwarmHyperparameters, key: string) {
  const value = hyperparameters[key]

  if (typeof value === "number") {
    return value.toPrecision(4)
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return String(value)
  }

  return "n/a"
}

function statusColor(status: SwarmStatus) {
  switch (status) {
    case "SUCCESS":
      return "#34d0b6"
    case "KILLED_EARLY":
      return "#fbbf24"
    case "CRASHED":
      return "#f87171"
    case "RUNNING":
    default:
      return "#4f6ef7"
  }
}

export function SwarmTelemetry() {
  const [payload, setPayload] = useState<SwarmTelemetryPayload | null>(null)
  const [selectedRunId, setSelectedRunId] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadSwarmTelemetry() {
      try {
        const response = await fetch("/api/swarm", { cache: "no-store" })
        const nextPayload = (await response.json()) as SwarmTelemetryPayload

        if (cancelled) {
          return
        }

        setPayload(nextPayload)
        setError(nextPayload.error)
        setSelectedRunId((current) => current || nextPayload.runs[0]?.runId || "")
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load swarm telemetry.")
        }
      }
    }

    loadSwarmTelemetry()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedRun = useMemo(() => {
    return payload?.runs.find((run) => run.runId === selectedRunId) ?? payload?.runs[0] ?? null
  }, [payload, selectedRunId])

  const chartData = useMemo(() => {
    return (
      selectedRun?.points.map((point) => ({
        step: point.step,
        loss: point.loss,
        valBpb: point.valBpb,
      })) ?? []
    )
  }, [selectedRun])

  if (!payload) {
    return (
      <div className="glass-card rounded-2xl p-8 text-[#1a1c2e]">
        <div className="mb-2 text-sm font-semibold">Loading swarm telemetry</div>
        <div className="text-xs text-[#6b72a8]">Querying Azure SQL audit rows...</div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {error ? (
        <div className="glass-card flex items-start gap-3 rounded-2xl p-4 text-[#3c4268]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#fbbf24]" />
          <div>
            <div className="text-sm font-semibold text-[#1a1c2e]">Swarm telemetry fallback active</div>
            <div className="text-xs text-[#6b72a8]">{error}</div>
          </div>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {HIGHLIGHT_SLOTS.map((slot) => (
          <BestRunCard key={slot} run={payload.bestRuns[slot]} rank={slot + 1} />
        ))}
      </section>

      <section className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#4f6ef7]" />
              <h2 className="text-sm font-semibold text-[#1a1c2e] sm:text-base">
                Swarm Loss Curve
              </h2>
            </div>
            <p className="text-xs text-[#6b72a8]">
              Last 5 audit-log runs, plotted from step-level `swarm_audit_log` samples.
            </p>
          </div>

          {payload.runs.length > 0 ? (
            <Select value={selectedRun?.runId ?? ""} onValueChange={setSelectedRunId}>
              <SelectTrigger className="h-10 w-full border-[rgba(180,190,240,0.55)] bg-white/50 text-[#1a1c2e] shadow-none sm:w-[260px]">
                <SelectValue placeholder="Select a swarm run" />
              </SelectTrigger>
              <SelectContent className="border-[rgba(180,190,240,0.55)] bg-white/90 text-[#1a1c2e] backdrop-blur-xl">
                {payload.runs.map((run) => (
                  <SelectItem key={run.runId} value={run.runId}>
                    {run.runId} - {run.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        {selectedRun ? (
          <>
            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <RunMeta label="Agent" value={selectedRun.agentId} Icon={GitBranch} />
              <RunMeta label="Status" value={selectedRun.status} color={statusColor(selectedRun.status)} />
              <RunMeta label="Updated" value={formatDate(selectedRun.lastCreatedAt)} />
            </div>

            <div
              className="relative h-[360px] rounded-xl p-2 sm:p-4"
              style={{
                background: "rgba(255,255,255,0.45)",
                backdropFilter: "var(--glass-blur)",
                border: "1px solid rgba(180,190,240,0.4)",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(79,110,247,0.1)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="step"
                    tick={{ fill: "#6b72a8", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6b72a8", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={42}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(180,190,240,0.5)",
                      background: "rgba(255,255,255,0.88)",
                      backdropFilter: "blur(16px)",
                      boxShadow: "0 4px 20px rgba(79,90,180,0.15)",
                      fontSize: 12,
                      color: "#1a1c2e",
                    }}
                    formatter={(value, name) => [
                      typeof value === "number" ? formatMetric(value) : value,
                      name === "loss" ? "Loss" : "val_bpb",
                    ]}
                    labelFormatter={(value) => `Step ${value}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="loss"
                    stroke="#4f6ef7"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: "#4f6ef7", strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-white/45 p-8 text-center text-sm text-[#6b72a8]">
            No swarm audit rows found yet.
          </div>
        )}
      </section>
    </div>
  )
}

function BestRunCard({ run, rank }: { run?: BestRun; rank: number }) {
  if (!run) {
    return (
      <div className="glass-card rounded-2xl px-5 py-4">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#6b72a8]">
          Best Run #{rank}
        </div>
        <div className="text-2xl font-bold text-[#1a1c2e]">Awaiting data</div>
        <div className="mt-2 text-xs text-[#6b72a8]">No completed audit rows available.</div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[11px] font-medium uppercase tracking-wider text-[#6b72a8]">
          Best Run #{rank}
        </div>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white"
          style={{ background: statusColor(run.status) }}
        >
          <Trophy className="h-3 w-3" />
          {run.status}
        </span>
      </div>
      <div className="mb-1 font-mono text-xs font-semibold text-[#4f6ef7]">{run.runId}</div>
      <div className="text-4xl font-bold tracking-tight text-[#1a1c2e]">
        {formatMetric(run.finalLoss)}
      </div>
      <div className="text-xs text-[#6b72a8]">val_bpb {formatMetric(run.finalValBpb)}</div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["max_iters", "decay_penalty", "growth_reward"].map((key) => (
          <span
            key={key}
            className="rounded-full border border-[rgba(180,190,240,0.55)] bg-white/45 px-2 py-1 text-[10px] font-medium text-[#3c4268]"
          >
            {key}: {key === "max_iters" ? run.maxIters : getHyperparameterLabel(run.hyperparameters, key)}
          </span>
        ))}
      </div>
    </div>
  )
}

function RunMeta({
  label,
  value,
  color,
  Icon,
}: {
  label: string
  value: string
  color?: string
  Icon?: typeof GitBranch
}) {
  return (
    <div className="rounded-xl border border-[rgba(180,190,240,0.4)] bg-white/45 px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#6b72a8]">
        {Icon ? <Icon className="h-3 w-3" /> : null}
        {label}
      </div>
      <div className="truncate text-xs font-semibold text-[#1a1c2e]" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  )
}
