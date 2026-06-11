import "server-only"

import { getAzureSqlPool } from "@/lib/azure-sql"

export type SwarmStatus = "RUNNING" | "SUCCESS" | "KILLED_EARLY" | "CRASHED"

export type SwarmHyperparameters = Record<string, string | number | boolean | null>

export type BestRun = {
  runId: string
  agentId: string
  finalLoss: number
  finalValBpb: number
  maxIters: number
  hyperparameters: SwarmHyperparameters
  status: SwarmStatus
  lastCreatedAt: string
}

export type SwarmPoint = {
  step: number
  loss: number
  valBpb: number
  stepTime: number
  status: SwarmStatus
  createdAt: string
}

export type SwarmRunSeries = {
  runId: string
  agentId: string
  hyperparameters: SwarmHyperparameters
  status: SwarmStatus
  lastCreatedAt: string
  points: SwarmPoint[]
}

export type SwarmTelemetryPayload = {
  ok: boolean
  source: "azure-sql" | "fallback"
  bestRuns: BestRun[]
  runs: SwarmRunSeries[]
  error: string | null
}

type SwarmSummaryRow = {
  run_id: string
  agent_id: string
  final_loss: number
  final_val_bpb: number
  max_iters: number
  hyperparameters: string
  status: string
  last_created_at: Date | string
}

type SwarmAuditRow = {
  run_id: string
  agent_id: string
  step: number
  loss: number
  val_bpb: number
  step_time: number
  hyperparameters: string
  status: string
  created_at: Date | string
  last_created_at: Date | string
}

const fallbackSwarmTelemetry: SwarmTelemetryPayload = {
  ok: false,
  source: "fallback",
  bestRuns: [
    {
      runId: "7d68697de8e1",
      agentId: "Swarm_Alpha_Biologist",
      finalLoss: 1.7766,
      finalValBpb: 2.5631,
      maxIters: 1000,
      hyperparameters: {
        decay_penalty: 0.014514,
        growth_reward: 0.050322,
        max_iters: 1000,
      },
      status: "RUNNING",
      lastCreatedAt: new Date(0).toISOString(),
    },
  ],
  runs: [
    {
      runId: "7d68697de8e1",
      agentId: "Swarm_Alpha_Biologist",
      hyperparameters: {
        decay_penalty: 0.014514,
        growth_reward: 0.050322,
        max_iters: 1000,
      },
      status: "RUNNING",
      lastCreatedAt: new Date(0).toISOString(),
      points: [
        { step: 0, loss: 4.8, valBpb: 5.1, stepTime: 1.42, status: "RUNNING", createdAt: new Date(0).toISOString() },
        { step: 200, loss: 3.6, valBpb: 4.3, stepTime: 1.31, status: "RUNNING", createdAt: new Date(0).toISOString() },
        { step: 400, loss: 2.9, valBpb: 3.7, stepTime: 1.24, status: "RUNNING", createdAt: new Date(0).toISOString() },
        { step: 600, loss: 2.4, valBpb: 3.3, stepTime: 1.18, status: "RUNNING", createdAt: new Date(0).toISOString() },
        { step: 800, loss: 2.05, valBpb: 3.05, stepTime: 1.13, status: "RUNNING", createdAt: new Date(0).toISOString() },
        { step: 999, loss: 1.7766, valBpb: 2.5631, stepTime: 1.1, status: "RUNNING", createdAt: new Date(0).toISOString() },
      ],
    },
  ],
  error: null,
}

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function toIsoString(value: Date | string | null | undefined) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === "string") {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString()
  }

  return new Date(0).toISOString()
}

function toStatus(value: unknown): SwarmStatus {
  if (
    value === "RUNNING" ||
    value === "SUCCESS" ||
    value === "KILLED_EARLY" ||
    value === "CRASHED"
  ) {
    return value
  }

  return "RUNNING"
}

function parseHyperparameters(value: unknown): SwarmHyperparameters {
  if (typeof value !== "string") {
    return {}
  }

  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([, entry]) => {
        return (
          typeof entry === "string" ||
          typeof entry === "number" ||
          typeof entry === "boolean" ||
          entry === null
        )
      }),
    ) as SwarmHyperparameters
  } catch {
    return {}
  }
}

function toFallback(error: unknown): SwarmTelemetryPayload {
  const message = error instanceof Error ? error.message : "Unknown swarm telemetry error."

  return {
    ...fallbackSwarmTelemetry,
    error: message,
  }
}

export async function getSwarmTelemetryPayload(): Promise<SwarmTelemetryPayload> {
  try {
    const pool = await getAzureSqlPool()

    const bestRunsResult = await pool.request().query<SwarmSummaryRow>(`
      SELECT TOP (3)
          run_id,
          agent_id,
          final_loss,
          final_val_bpb,
          max_iters,
          hyperparameters,
          status,
          last_created_at
      FROM dbo.vw_swarm_run_summaries
      ORDER BY final_loss ASC;
    `)

    const runHistoryResult = await pool.request().query<SwarmAuditRow>(`
      WITH last_runs AS (
          SELECT TOP (5)
              run_id,
              MAX(created_at) AS last_created_at
          FROM dbo.swarm_audit_log
          GROUP BY run_id
          ORDER BY MAX(created_at) DESC
      )
      SELECT
          a.run_id,
          a.agent_id,
          a.step,
          a.loss,
          a.val_bpb,
          a.step_time,
          a.hyperparameters,
          a.status,
          a.created_at,
          l.last_created_at
      FROM dbo.swarm_audit_log AS a
      INNER JOIN last_runs AS l
          ON l.run_id = a.run_id
      ORDER BY l.last_created_at DESC, a.step ASC, a.created_at ASC, a.log_id ASC;
    `)

    const runsById = new Map<string, SwarmRunSeries>()
    for (const row of runHistoryResult.recordset) {
      const runId = String(row.run_id)
      const existing = runsById.get(runId)
      const status = toStatus(row.status)
      const point: SwarmPoint = {
        step: toNumber(row.step),
        loss: toNumber(row.loss),
        valBpb: toNumber(row.val_bpb),
        stepTime: toNumber(row.step_time),
        status,
        createdAt: toIsoString(row.created_at),
      }

      if (existing) {
        existing.status = status
        existing.points.push(point)
        continue
      }

      runsById.set(runId, {
        runId,
        agentId: String(row.agent_id),
        hyperparameters: parseHyperparameters(row.hyperparameters),
        status,
        lastCreatedAt: toIsoString(row.last_created_at),
        points: [point],
      })
    }

    return {
      ok: true,
      source: "azure-sql",
      bestRuns: bestRunsResult.recordset.map((row) => ({
        runId: String(row.run_id),
        agentId: String(row.agent_id),
        finalLoss: toNumber(row.final_loss),
        finalValBpb: toNumber(row.final_val_bpb),
        maxIters: toNumber(row.max_iters),
        hyperparameters: parseHyperparameters(row.hyperparameters),
        status: toStatus(row.status),
        lastCreatedAt: toIsoString(row.last_created_at),
      })),
      runs: Array.from(runsById.values()),
      error: null,
    }
  } catch (error) {
    return toFallback(error)
  }
}
