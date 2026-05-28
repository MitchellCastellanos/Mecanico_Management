import "dotenv/config";
import pg from "pg";

const line = process.env.DATABASE_URL ?? "";
const pw = line.match(/postgres:([^@]+)@/)?.[1] ?? "";
const ref = "iiiekxgjltnwpeyjfpjs";
const regions = [
  "us-east-1", "us-west-1", "us-west-2", "us-east-2",
  "eu-west-1", "eu-west-2", "eu-central-1", "eu-central-2",
  "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2",
  "sa-east-1", "ca-central-1", "ap-south-1",
];
const prefixes = ["aws-0", "aws-1"];

for (const p of prefixes) {
  for (const r of regions) {
    const url = `postgresql://postgres.${ref}:${pw}@${p}-${r}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
    const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
    try {
      await c.connect();
      await c.query("SELECT 1");
      console.log("OK", `${p}-${r}`);
      console.log(url.replace(pw, "***"));
      await c.end();
      process.exit(0);
    } catch {
      /* try next */
    }
  }
}
console.log("none found");
