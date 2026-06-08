import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { validateEnvironment } from "@/lib/env"
import * as schema from "./schema"

function createDatabaseConnection() {
  validateEnvironment()
  const databaseUrl = process.env.DATABASE_URL!
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
