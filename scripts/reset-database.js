import { Pool } from "@neondatabase/serverless"
import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const scriptsDir = dirname(fileURLToPath(import.meta.url))

async function resetDatabase() {
  if (process.env.ALLOW_DB_RESET !== "1") {
    throw new Error("Refusing destructive reset. Set ALLOW_DB_RESET=1 to continue")
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local")
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const schema = readFileSync(join(scriptsDir, "schema.sql"), "utf8")
    await pool.query(schema)
    console.log("Database reset complete")
  } finally {
    await pool.end()
  }
}

resetDatabase().catch((error) => {
  console.error("Database reset failed:", error)
  process.exit(1)
})
