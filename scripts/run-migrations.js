import { Pool } from "@neondatabase/serverless"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Add it to .env.local")
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const schemaPath = join(__dirname, "schema.sql")
  const schema = readFileSync(schemaPath, "utf-8")

  console.log("Running schema.sql against database...\n")

  try {
    await pool.query(schema)
    console.log("✅ Schema applied successfully!")

    // Verify tables
    const { rows } = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    )
    console.log("Tables:", rows.map((r) => r.tablename).join(", "))

    const { rows: skills } = await pool.query("SELECT count(*) as c FROM skills")
    console.log("Skills seeded:", skills[0].c)
  } catch (err) {
    console.error("❌ Migration failed:", err)
    throw err
  } finally {
    await pool.end()
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
