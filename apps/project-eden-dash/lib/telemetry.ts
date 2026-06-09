import "server-only"

import sql from "mssql"

export type TelemetryPoint = {
  step: number
  value: number
}

export type TelemetryLatest = {
  runId: string
  step: number
  loss: number
  valBpb: number
  stepTime: number
}

export type TelemetryPayload = {
  ok: boolean
  source: "azure-sql" | "fallback"
  latest: TelemetryLatest
  series: {
    loss: TelemetryPoint[]
    valBpb: TelemetryPoint[]
    stepTime: TelemetryPoint[]
  }
  error: string | null
}

type TrainingLogRow = {
  run_id: string
  step: number
  loss: number
  val_bpb: number
  step_time?: number | null
}

type TrainingHistoryRow = {
  step: number
  loss: number
  val_bpb: number
  step_time?: number | null
}

const FALLBACK_SERIES = {
  loss: [
    { step: 0, value: 4.8 },
    { step: 200, value: 3.6 },
    { step: 400, value: 2.9 },
    { step: 600, value: 2.4 },
    { step: 800, value: 2.05 },
    { step: 1000, value: 1.82 },
    { step: 1200, value: 1.64 },
    { step: 1400, value: 1.51 },
    { step: 1600, value: 1.43 },
  ],
  valBpb: [
    { step: 0, value: 5.1 },
    { step: 200, value: 4.3 },
    { step: 400, value: 3.7 },
    { step: 600, value: 3.3 },
    { step: 800, value: 3.05 },
    { step: 1000, value: 2.88 },
    { step: 1200, value: 2.78 },
    { step: 1400, value: 2.71 },
    { step: 1600, value: 2.68 },
  ],
  stepTime: [
    { step: 0, value: 1.42 },
    { step: 200, value: 1.31 },
    { step: 400, value: 1.24 },
    { step: 600, value: 1.18 },
    { step: 800, value: 1.13 },
    { step: 1000, value: 1.1 },
    { step: 1200, value: 1.08 },
    { step: 1400, value: 1.06 },
    { step: 1600, value: 1.05 },
  ],
} satisfies TelemetryPayload["series"]

export const fallbackTelemetry: TelemetryPayload = {
  ok: false,
  source: "fallback",
  latest: {
    runId: "7d68697de8e1",
    step: 1600,
    loss: 1.7766,
    valBpb: 2.5631,
    stepTime: 10.52,
  },
  series: FALLBACK_SERIES,
  error: null,
}

let poolPromise: Promise<sql.ConnectionPool> | null = null

function getSqlConfig(): string | sql.config {
  const connectionString = process.env.AZURE_SQL_CONNECTION_STRING
  if (connectionString) {
    return connectionString
  }

  const server = process.env.AZURE_SQL_SERVER
  const database = process.env.AZURE_SQL_DATABASE
  const user = process.env.AZURE_SQL_USERNAME
  const password = process.env.AZURE_SQL_PASSWORD

  if (!server || !database || !user || !password) {
    throw new Error("Azure SQL environment variables are not configured.")
  }

  return {
    server,
    database,
    user,
    password,
    port: Number(process.env.AZURE_SQL_PORT ?? 1433),
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30_000,
    },
    connectionTimeout: 30_000,
    requestTimeout: 30_000,
  }
}

async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(getSqlConfig()).catch((error: unknown) => {
      poolPromise = null
      throw error
    })
  }

  return poolPromise
}

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function toFallback(error: unknown): TelemetryPayload {
  const message = error instanceof Error ? error.message : "Unknown telemetry error."

  return {
    ...fallbackTelemetry,
    error: message,
  }
}

export async function getTelemetryPayload(): Promise<TelemetryPayload> {
  try {
    const pool = await getPool()
    const latestResult = await pool.request().query<TrainingLogRow>(`
      SELECT TOP 1 *
      FROM training_logs
      ORDER BY step DESC
    `)
    const latestRow = latestResult.recordset[0]

    if (!latestRow) {
      return toFallback(new Error("No rows found in training_logs."))
    }

    const currentRunId = String(latestRow.run_id)
    const historyResult = await pool
      .request()
      .input("currentRunId", sql.VarChar, currentRunId)
      .query<TrainingHistoryRow>(`
        SELECT step, loss, val_bpb, step_time
        FROM training_logs
        WHERE run_id = @currentRunId
        ORDER BY step ASC
      `)

    const history = historyResult.recordset

    return {
      ok: true,
      source: "azure-sql",
      latest: {
        runId: currentRunId,
        step: toNumber(latestRow.step),
        loss: toNumber(latestRow.loss),
        valBpb: toNumber(latestRow.val_bpb),
        stepTime: toNumber(latestRow.step_time),
      },
      series: {
        loss: history.map((row) => ({
          step: toNumber(row.step),
          value: toNumber(row.loss),
        })),
        valBpb: history.map((row) => ({
          step: toNumber(row.step),
          value: toNumber(row.val_bpb),
        })),
        stepTime: history
          .filter((row) => row.step_time !== null && row.step_time !== undefined)
          .map((row) => ({
            step: toNumber(row.step),
            value: toNumber(row.step_time),
          })),
      },
      error: null,
    }
  } catch (error) {
    return toFallback(error)
  }
}
