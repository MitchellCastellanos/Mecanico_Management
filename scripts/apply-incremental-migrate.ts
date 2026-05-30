/**
 * Aplica migración incremental en Supabase (usa DIRECT_URL).
 * Uso: npx tsx scripts/apply-incremental-migrate.ts
 */
import "dotenv/config";
import { runIncrementalMigrate } from "../src/lib/incremental-migrate";
import { db } from "../src/lib/db";

async function main() {
  const count = await runIncrementalMigrate();
  console.log(`Migración incremental completada (${count} sentencias).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
