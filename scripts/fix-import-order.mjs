import fs from "fs";
import path from "path";

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(name)) files.push(p);
  }
  return files;
}

const routesImport =
  /^import \{ ADMIN, PLATFORM, adminPath \} from "@\/lib\/routes";\r?\n(["'])use (client|server)\1;\r?\n/;

for (const file of walk(path.join(process.cwd(), "src"))) {
  let content = fs.readFileSync(file, "utf8");
  if (!routesImport.test(content)) continue;
  content = content.replace(
    routesImport,
    (_, q, kind) => `${q}use ${kind}${q};\n\nimport { ADMIN, PLATFORM, adminPath } from "@/lib/routes";\n`
  );
  fs.writeFileSync(file, content);
  console.log("fixed", path.relative(process.cwd(), file));
}
