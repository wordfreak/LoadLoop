import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

function createDatabaseConnection() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set")
  }
  const sql = neon(databaseUrl)
  return drizzle(sql, { schema })
}

let dbInstance: ReturnType<typeof createDatabaseConnection>

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = createDatabaseConnection()
  }
  return dbInstance
}

export { schema }
