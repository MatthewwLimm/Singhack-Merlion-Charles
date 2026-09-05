// Applies every *.sql file in supabase/migrations, in filename order, that
// hasn't been applied yet (tracked in a `_migrations` table). Safe to re-run.
import { readdirSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { sql } from "./db"

const MIGRATIONS_DIR = resolve(process.cwd(), "supabase/migrations")

async function main() {
  await sql`
    create table if not exists _migrations (
      filename    text primary key,
      applied_at  timestamptz not null default now()
    )
  `

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()

  const applied = new Set(
    (await sql<{ filename: string }[]>`select filename from _migrations`).map((r) => r.filename),
  )

  let ran = 0
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  skip   ${file} (already applied)`)
      continue
    }

    const contents = readFileSync(resolve(MIGRATIONS_DIR, file), "utf8")
    console.log(`  apply  ${file}`)

    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(contents)
        await tx`insert into _migrations (filename) values (${file})`
      })
      ran++
    } catch (err) {
      console.error(`\n✗ Migration failed: ${file}`)
      console.error(err instanceof Error ? err.message : err)
      process.exitCode = 1
      break
    }
  }

  if (!process.exitCode) {
    console.log(`\n✓ Migrations up to date. ${ran} applied this run, ${files.length} total.`)
  }

  await sql.end()
}

main()
