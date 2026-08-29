// Non-destructive: adds the fixed kid profiles to an existing database.
// This is retained as an idempotent convenience command. Normal deployments
// should use `pnpm db:migrate`, which applies the same reconciliation safely.

import { Pool } from "@neondatabase/serverless"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

async function seedProfiles() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Add it to .env.local")
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const sql = readFileSync(join(__dirname, "020_seed_kid_profiles.sql"), "utf-8")

  try {
    await pool.query(sql)
    const { rows } = await pool.query(
      "SELECT name, grade FROM students WHERE is_active = true ORDER BY name",
    )
    console.log("✅ Profiles ready:", rows.map((r) => `${r.name} (Grade ${r.grade})`).join(", "))
  } catch (err) {
    console.error("❌ Seed failed:", err)
    throw err
  } finally {
    await pool.end()
  }
}

seedProfiles()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
