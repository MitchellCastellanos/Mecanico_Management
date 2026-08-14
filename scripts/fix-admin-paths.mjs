import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "src");

const skip = new Set([
  "src/app/api/auth/login/route.ts",
  "src/lib/routes.ts",
  "src/proxy.ts",
]);

const pairs = [
  ['redirect("/login")', 'redirect(ADMIN.login)'],
  ['redirect("/dashboard")', 'redirect(ADMIN.dashboard)'],
  ['redirect("/clients")', 'redirect(ADMIN.clients)'],
  ['redirect("/invoices")', 'redirect(ADMIN.invoices)'],
  ['redirect("/quotes")', 'redirect(ADMIN.quotes)'],
  ['redirect("/appointments")', 'redirect(ADMIN.appointments)'],
  ['redirect("/reminders")', 'redirect(ADMIN.reminders)'],
  ['revalidatePath("/dashboard")', 'revalidatePath(ADMIN.dashboard)'],
  ['revalidatePath("/clients")', 'revalidatePath(ADMIN.clients)'],
  ['revalidatePath("/invoices")', 'revalidatePath(ADMIN.invoices)'],
  ['revalidatePath("/quotes")', 'revalidatePath(ADMIN.quotes)'],
  ['revalidatePath("/appointments")', 'revalidatePath(ADMIN.appointments)'],
  ['revalidatePath("/reminders")', 'revalidatePath(ADMIN.reminders)'],
  ['revalidatePath("/settings")', 'revalidatePath(ADMIN.settings)'],
  ['revalidatePath("/accounting")', 'revalidatePath(ADMIN.accounting)'],
  ['href="/clients"', 'href={ADMIN.clients}'],
  ['href="/invoices"', 'href={ADMIN.invoices}'],
  ['href="/quotes"', 'href={ADMIN.quotes}'],
  ['href="/appointments"', 'href={ADMIN.appointments}'],
  ['href="/reminders"', 'href={ADMIN.reminders}'],
  ['redirect("/clients/new', 'redirect(`${ADMIN.clients}/new'],
  ['redirect(`/clients/', 'redirect(`${ADMIN.clients}/'],
  ['redirect(`/invoices/', 'redirect(`${ADMIN.invoices}/'],
  ['redirect(`/quotes/', 'redirect(`${ADMIN.quotes}/'],
  ['redirect(`/appointments', 'redirect(`${ADMIN.appointments'],
  ['signOut({ callbackUrl: "/login" })', 'signOut({ callbackUrl: ADMIN.login })'],
  ['signOut({ redirectTo: "/login" })', 'signOut({ redirectTo: ADMIN.login })'],
  ['callbackUrl ?? "/dashboard"', 'callbackUrl ?? ADMIN.dashboard'],
  ['revalidatePath("/admin")', 'revalidatePath(PLATFORM.home)'],
  ['redirect("/admin")', 'redirect(PLATFORM.home)'],
  ['href="/admin"', 'href={PLATFORM.home}'],
  ['href={`/admin/shops/', 'href={`${PLATFORM.shop('],
  ['revalidatePath(`/admin/shops/', 'revalidatePath(PLATFORM.shop('],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(name)) files.push(p);
  }
  return files;
}

let count = 0;
for (const file of walk(root)) {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, "/");
  if (skip.has(rel)) continue;
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  if (!content.includes('from "@/lib/routes"') && !content.includes("ADMIN.")) {
    if (
      pairs.some(([from]) => content.includes(from.replace("ADMIN.", "").split("(")[0])) ||
      content.includes('href="/clients') ||
      content.includes('redirect("/')
    ) {
      content = `import { ADMIN, PLATFORM, adminPath } from "@/lib/routes";\n` + content;
    }
  }
  for (const [from, to] of pairs) {
    content = content.split(from).join(to);
  }
  if (content !== original) {
    fs.writeFileSync(file, content);
    count++;
    console.log("updated", rel);
  }
}

console.log(`Done. ${count} files updated.`);
