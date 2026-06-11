import "server-only"

import sql from "mssql"

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

export async function getAzureSqlPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(getSqlConfig()).catch((error: unknown) => {
      poolPromise = null
      throw error
    })
  }

  return poolPromise
}

export default sql
