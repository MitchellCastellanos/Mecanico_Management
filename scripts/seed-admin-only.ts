import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.env.PLATFORM_ADMIN_EMAIL ?? "mitchell.castellanos@hotmail.com").toLowerCase();
  const password = process.env.PLATFORM_ADMIN_PASSWORD;
  if (!password) throw new Error("Falta PLATFORM_ADMIN_PASSWORD");

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { name: "Mitchell Castellanos", passwordHash: hash, role: "SUPER_ADMIN", shopId: null },
    create: { name: "Mitchell Castellanos", email, passwordHash: hash, role: "SUPER_ADMIN", shopId: null },
  });
  await prisma.shop.upsert({
    where: { id: "shop-carlos-mtl" },
    update: {},
    create: { id: "shop-carlos-mtl", name: "Garage Carlos MTL", currency: "CAD" },
  });
  console.log("OK:", email, "SUPER_ADMIN + taller Carlos");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
