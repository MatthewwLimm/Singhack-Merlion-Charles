import "dotenv/config"
import postgres from "postgres"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

// `dotenv/config` only loads `.env` by default; Next.js convention is
// `.env.local`, so load that explicitly (without overriding real env vars
// that may already be set, e.g. in CI).
const envLocalPath = resolve(process.cwd(), ".env.local")
if (existsSync(envLocalPath)) {
  for (const line of readFileSync(envLocalPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2]
    }
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local (see .env.example) — " +
      "use the Supabase 'Session pooler' connection string if your network " +
      "cannot reach the IPv6-only direct connection host.",
  )
}

export const sql = postgres(process.env.DATABASE_URL, {
  max: 5,
  onnotice: () => {}, // suppress NOTICE spam from IF EXISTS / IF NOT EXISTS
})
