import { Pool } from "@neondatabase/serverless"
import { createHash } from "crypto"
import { readdirSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const scriptsDir = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(scriptsDir, "migrations")
const lockName = "math-practice-app-schema-migrations"

function checksum(sql) {
  return createHash("sha256").update(sql).digest("hex")
}

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local")
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()

  try {
    await client.query("SELECT pg_advisory_lock(hashtext($1))", [lockName])
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const files = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort()
    const { rows } = await client.query(
      "SELECT filename, checksum FROM schema_migrations ORDER BY filename",
    )
    const applied = new Map(rows.map((row) => [row.filename, row.checksum]))
    let appliedCount = 0

    for (const filename of files) {
      const sql = readFileSync(join(migrationsDir, filename), "utf8")
      const digest = checksum(sql)
      const appliedChecksum = applied.get(filename)

      if (appliedChecksum) {
        if (appliedChecksum !== digest) {
          throw new Error(`Applied migration ${filename} has been modified`)
        }
        continue
      }

      await client.query("BEGIN")
      try {
        await client.query(sql)
        await client.query(
          "INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)",
          [filename, digest],
        )
        await client.query("COMMIT")
        appliedCount += 1
        console.log(`Applied ${filename}`)
      } catch (error) {
        await client.query("ROLLBACK")
        throw error
      }
    }

    console.log(appliedCount === 0 ? "Database is up to date" : "Migrations complete")
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext($1))", [lockName]).catch(() => undefined)
    client.release()
    await pool.end()
  }
}

runMigrations().catch((error) => {
  console.error("Migration failed:", error)
  process.exit(1)
})
