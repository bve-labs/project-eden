"use client"

import { useState } from "react"
import type { ComponentType } from "react"
import {
  Search,
  HelpCircle,
  Settings,
  Maximize2,
  Cpu,
  Activity,
  Dna,
  Network,
  Layers,
} from "lucide-react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

import type { TelemetryPayload } from "@/lib/telemetry"

const LAYERS = [
  { number: "1", label: "Layer 01 · Embed", value: 78, color: "#4f6ef7" },
  { number: "2", label: "Layer 02 · Attn", value: 57, color: "#7c9cff" },
  { number: "3", label: "Layer 03 · MoE", value: 46, color: "#a78bfa" },
  { number: "4", label: "Layer 04 · Gate", value: 72, color: "#4f6ef7" },
  { number: "5", label: "Layer 05 · Attn", value: 62, color: "#7c9cff" },
  { number: "6", label: "Layer 06 · MoE", value: 88, color: "#34d0b6" },
  { number: "7", label: "Layer 07 · Norm", value: 81, color: "#4f6ef7" },
  { number: "8", label: "Layer 08 · Head", value: 69, color: "#7c9cff" },
]

const RADAR_DATA = LAYERS.map((layer) => ({
  layer: `L${layer.number}`,
  expression: layer.value,
}))

const CONVERGENCE_TABS = [
  { key: "loss", label: "Cross-Entropy Loss" },
  { key: "valBpb", label: "Bits-Per-Byte (val_bpb)" },
  { key: "stepTime", label: "Step Latency" },
] as const

type ConvergenceTab = (typeof CONVERGENCE_TABS)[number]["key"]

type CommandCenterProps = {
  telemetry: TelemetryPayload
}

const formatMetric = (value: number, digits = 4) => value.toFixed(digits)

export function CommandCenter({ telemetry }: CommandCenterProps) {
  const [activeTab, setActiveTab] = useState<ConvergenceTab>("loss")
  const activeSeries = telemetry.series[activeTab]
  const stepTimeAvg =
    telemetry.series.stepTime.length > 0
      ? telemetry.series.stepTime.reduce((sum, point) => sum + point.value, 0) /
        telemetry.series.stepTime.length
      : telemetry.latest.stepTime

  return (
    <div
      className="min-h-screen p-3 sm:p-4 lg:p-6 font-sans"
      style={{
        background: "linear-gradient(135deg, #cdd4f0 0%, #d8dff5 40%, #dde3f8 70%, #d0d8f2 100%)",
      }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-40"
          style={{
            background: "radial-gradient(circle, rgba(160,180,255,0.55) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute top-1/2 -right-40 h-[420px] w-[420px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(180,200,255,0.5) 0%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(140,160,240,0.4) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1400px]">
        <header className="glass-card mb-4 lg:mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #4f6ef7 0%, #7c9cff 100%)",
                boxShadow: "0 2px 12px rgba(79,110,247,0.4)",
              }}
            >
              <Dna className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm sm:text-base font-semibold text-[#1a1c2e] tracking-tight">
              Project EDEN <span className="text-[#4f6ef7]">// Command</span>
            </span>
          </div>

          <nav className="flex items-center gap-1 flex-wrap">
            <button
              className="rounded-full px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #4f6ef7 0%, #7c9cff 100%)",
                boxShadow: "0 2px 10px rgba(79,110,247,0.35)",
              }}
            >
              Live Matrix
            </button>
            {["Amoeba Sandbox", "Swarm Telemetry", "Artifact Vault"].map((label) => (
              <button
                key={label}
                className="rounded-full px-4 py-1.5 text-[11px] sm:text-xs font-medium text-[#3c4268] transition-all hover:bg-white/40"
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {[Search, HelpCircle].map((Icon, index) => (
              <button
                key={index}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-white/50"
              >
                <Icon className="h-4 w-4 text-[#3c4268]" />
              </button>
            ))}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, #4f6ef7 0%, #34d0b6 100%)",
                boxShadow: "0 2px 10px rgba(79,110,247,0.35)",
              }}
            >
              <Cpu className="h-4 w-4 text-white" />
            </div>
          </div>
        </header>

        <div className="mb-4 lg:mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card rounded-2xl px-5 py-4 flex flex-col gap-1">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[#6b72a8]">
              Model Loss
            </div>
            <div className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1a1c2e]">
              {formatMetric(telemetry.latest.loss)}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg, #4f6ef7 0%, #7c9cff 100%)",
                  boxShadow: "0 2px 8px rgba(79,110,247,0.3)",
                }}
              >
                Cross-Entropy
              </span>
              <span className="text-[11px] text-[#6b72a8]">Step {telemetry.latest.step}</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl px-5 py-4 flex flex-col gap-1">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[#6b72a8]">
              val_bpb
            </div>
            <div className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1a1c2e]">
              {formatMetric(telemetry.latest.valBpb)}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg, #34d0b6 0%, #4f6ef7 100%)",
                  boxShadow: "0 2px 8px rgba(52,208,182,0.3)",
                }}
              >
                Bits-Per-Byte
              </span>
              <span className="text-[11px] text-[#6b72a8]">Validation</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl px-5 py-4 flex flex-col gap-1">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[#6b72a8]">
              Time
            </div>
            <div className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1a1c2e]">
              {telemetry.latest.stepTime.toFixed(2)}
              <span className="text-2xl sm:text-3xl font-semibold text-[#6b72a8]">s</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg, #fbbf24 0%, #f87171 100%)",
                  boxShadow: "0 2px 8px rgba(251,191,36,0.3)",
                }}
              >
                Step Latency
              </span>
              <span className="text-[11px] text-[#6b72a8]">latest sample</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          <div className="lg:col-span-4 space-y-3 sm:space-y-4">
            <div className="glass-card rounded-2xl p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-semibold text-[#1a1c2e]">
                  Epigenetic Expression Profile
                </h2>
                <button className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/50 transition-all hover:bg-white/70">
                  <Settings className="h-3.5 w-3.5 text-[#6b72a8]" />
                </button>
              </div>

              <div className="mb-4 h-44 sm:h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={RADAR_DATA} outerRadius="72%">
                    <PolarGrid stroke="rgba(79,110,247,0.15)" />
                    <PolarAngleAxis
                      dataKey="layer"
                      tick={{ fill: "#6b72a8", fontSize: 10, fontWeight: 500 }}
                    />
                    <Radar
                      dataKey="expression"
                      stroke="#4f6ef7"
                      fill="#4f6ef7"
                      fillOpacity={0.14}
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#4f6ef7", strokeWidth: 0 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {LAYERS.map((layer) => (
                  <LayerRow key={layer.number} {...layer} />
                ))}
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-2xl p-5 text-white"
              style={{
                background: "linear-gradient(135deg, #4f6ef7 0%, #7c9cff 60%, #34d0b6 100%)",
                boxShadow: "0 8px 32px rgba(79,110,247,0.32), 0 1.5px 4px rgba(79,110,247,0.18)",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl opacity-25"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
                }}
              />
              <div className="relative z-10">
                <div className="mb-3 flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  <h3 className="text-base sm:text-lg font-bold tracking-tight">Node Telemetry</h3>
                </div>
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
                  </span>
                  <div>
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-wider opacity-75">
                      Active Cluster
                    </div>
                    <div className="text-xs sm:text-sm font-semibold">
                      {telemetry.source === "azure-sql" ? "Azure SQL Live" : "Fallback Snapshot"}
                    </div>
                  </div>
                </div>
                <div
                  className="rounded-xl px-3 py-2 font-mono text-[10px] sm:text-xs"
                  style={{ background: "rgba(0,0,0,0.18)", backdropFilter: "blur(8px)" }}
                >
                  <span className="opacity-70">Run ID: </span>
                  <span className="font-semibold">{telemetry.latest.runId}</span>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-15">
                <Dna className="h-32 w-32" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3 sm:space-y-4">
            <div className="glass-card rounded-2xl p-4 sm:p-5">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm sm:text-base font-semibold text-[#1a1c2e]">
                    Model Convergence Sequence
                  </h2>
                  <button className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/50 transition-all hover:bg-white/70">
                    <Maximize2 className="h-3.5 w-3.5 text-[#6b72a8]" />
                  </button>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {CONVERGENCE_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className="rounded-full px-3 py-1.5 text-[10px] sm:text-[11px] font-medium transition-all"
                      style={
                        activeTab === tab.key
                          ? {
                              background: "linear-gradient(135deg, #4f6ef7 0%, #7c9cff 100%)",
                              color: "#fff",
                              boxShadow: "0 2px 8px rgba(79,110,247,0.3)",
                            }
                          : {
                              background: "rgba(255,255,255,0.45)",
                              color: "#3c4268",
                              border: "1px solid rgba(180,190,240,0.5)",
                            }
                      }
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="relative h-[280px] sm:h-[340px] rounded-xl p-2 sm:p-4"
                style={{
                  background: "rgba(255,255,255,0.45)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(180,190,240,0.4)",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={activeSeries}
                    margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
                  >
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
                      width={36}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(180,190,240,0.5)",
                        background: "rgba(255,255,255,0.85)",
                        backdropFilter: "blur(16px)",
                        boxShadow: "0 4px 20px rgba(79,90,180,0.15)",
                        fontSize: 12,
                        color: "#1a1c2e",
                      }}
                      labelFormatter={(value) => `Step ${value}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#4f6ef7"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: "#4f6ef7", strokeWidth: 2, stroke: "#fff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-semibold text-[#1a1c2e]">
                  Biological Engine Status
                </h2>
                <button className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/50 transition-all hover:bg-white/70">
                  <Activity className="h-3.5 w-3.5 text-[#6b72a8]" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <ProgressRing value={84} label="Active Expert Folds" color="#4f6ef7" Icon={Layers} />
                <ProgressRing value={61} label="Synaptic Pruning Rate" color="#7c9cff" Icon={Network} />
                <ProgressRing value={92} label="Myelination Index" color="#34d0b6" Icon={Dna} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            <div className="glass-card rounded-2xl p-4 sm:p-5">
              <div className="mb-1 text-[11px] font-medium text-[#6b72a8] uppercase tracking-wider">
                Model Compression Floor
              </div>
              <div className="mb-3 text-3xl sm:text-4xl font-bold text-[#1a1c2e]">
                {telemetry.latest.valBpb.toFixed(2)} BPB
              </div>
              <span
                className="inline-block rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg, #34d0b6 0%, #4f6ef7 100%)",
                  boxShadow: "0 2px 8px rgba(52,208,182,0.35)",
                }}
              >
                EFFICIENT
              </span>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5">
              <div className="mb-1 text-[11px] font-medium text-[#6b72a8] uppercase tracking-wider">
                Tensor Core Cadence
              </div>
              <div className="mb-3 text-2xl sm:text-3xl font-bold text-[#1a1c2e]">
                {stepTimeAvg.toFixed(2)}s / 10-steps
              </div>
              <span
                className="inline-block rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg, #fbbf24 0%, #f87171 100%)",
                  boxShadow: "0 2px 8px rgba(251,191,36,0.35)",
                }}
              >
                MAX CAPACITY
              </span>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-semibold text-[#1a1c2e]">
                  Synaptic Footprint
                </h2>
                <button className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/50 transition-all hover:bg-white/70">
                  <Layers className="h-3.5 w-3.5 text-[#6b72a8]" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="mb-0.5 text-[10px] text-[#6b72a8]">Active</div>
                  <div className="text-lg sm:text-2xl font-bold text-[#4f6ef7]">58%</div>
                </div>
                <div>
                  <div className="mb-0.5 text-[10px] text-[#6b72a8]">Decaying</div>
                  <div className="text-lg sm:text-2xl font-bold text-[#fbbf24]">27%</div>
                </div>
                <div>
                  <div className="mb-0.5 text-[10px] text-[#6b72a8]">Pruned</div>
                  <div className="text-lg sm:text-2xl font-bold text-[#f87171]">15%</div>
                </div>
              </div>

              <div
                className="mt-4 flex h-2.5 overflow-hidden rounded-full"
                style={{ background: "rgba(180,190,240,0.25)" }}
              >
                <div className="h-full w-[58%]" style={{ background: "#4f6ef7" }} />
                <div className="h-full w-[27%]" style={{ background: "#fbbf24" }} />
                <div className="h-full w-[15%]" style={{ background: "#f87171" }} />
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#6b72a8]">
                <span>Parameter state distribution</span>
                <span className="font-mono">404B params</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LayerRow({
  number,
  label,
  value,
  color,
}: {
  number: string
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 text-[10px] font-medium text-[#6b72a8]">{number}</span>
      <span className="flex-1 text-[10px] sm:text-xs text-[#1a1c2e]">{label}</span>
      <div className="flex items-center gap-1.5">
        <div
          className="h-1.5 w-12 sm:w-14 overflow-hidden rounded-full"
          style={{ background: "rgba(180,190,240,0.35)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${value}%`, background: color }}
          />
        </div>
        <span className="w-8 text-right text-[10px] font-semibold text-[#1a1c2e]">
          {value}%
        </span>
      </div>
    </div>
  )
}

function ProgressRing({
  value,
  label,
  color,
  Icon,
}: {
  value: number
  label: string
  color: string
  Icon: ComponentType<{ className?: string }>
}) {
  const circumference = 2 * Math.PI * 44
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="text-center">
      <div className="relative mx-auto mb-2 flex h-[72px] w-[72px] sm:h-20 sm:w-20 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(180,190,240,0.35)"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div
          className="relative z-10 flex h-10 w-10 flex-col items-center justify-center rounded-full"
          style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold text-[#1a1c2e]">{value}%</span>
        </div>
      </div>
      <div className="text-[9px] sm:text-[10px] font-medium leading-tight text-[#3c4268] text-balance">
        {label}
      </div>
    </div>
  )
}
