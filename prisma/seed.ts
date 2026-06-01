import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { BRAND } from "../src/config/brand";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

const SHOP_DEFAULTS = {
  name: BRAND.shopName,
  address: "Montréal, QC",
  phone: "",
  email: BRAND.emails.contact,
  billingEmail: BRAND.emails.billing,
  infoEmail: BRAND.emails.info,
  providersEmail: BRAND.emails.providers,
  newsletterEmail: BRAND.emails.newsletter,
  slug: BRAND.bookingSlug,
  taxId: "",
  currency: "CAD",
} as const;

async function main() {
  console.log("🌱 Iniciando seed...");

  const shop = await prisma.shop.upsert({
    where: { id: BRAND.shopId },
    update: SHOP_DEFAULTS,
    create: {
      id: BRAND.shopId,
      ...SHOP_DEFAULTS,
    },
  });

  // ── Usuario dueño ────────────────────────────────────────
  const passwordHash = await bcrypt.hash("demo123", 12);

  const owner = await prisma.user.upsert({
    where: { email: "demo@mecanico.com" },
    update: {},
    create: {
      shopId: shop.id,
      name: "Carlos Rodríguez",
      email: "demo@mecanico.com",
      passwordHash,
      role: "OWNER",
    },
  });

  console.log(`✅ Shop: ${shop.name}`);
  console.log(`✅ Usuario: ${owner.email} / demo123`);

  // ── Clientes con vehículos ───────────────────────────────
  const clientsData = [
    {
      firstName: "Jean-François",
      lastName: "Tremblay",
      email: "jf.tremblay@gmail.com",
      phone: "514-555-0101",
      address: "456 Rue Sherbrooke O, Montréal, QC",
      vehicles: [
        { make: "Honda", model: "Civic", year: 2019, licensePlate: "JFT 2845", color: "Azul", mileageUnit: "KM" as const },
        { make: "Toyota", model: "RAV4", year: 2022, licensePlate: "JFT 9912", color: "Blanco", mileageUnit: "KM" as const },
      ],
    },
    {
      firstName: "Marie",
      lastName: "Gagnon",
      email: "marie.gagnon@hotmail.com",
      phone: "514-555-0102",
      address: "789 Av. du Mont-Royal, Montréal, QC",
      vehicles: [
        { make: "Hyundai", model: "Elantra", year: 2020, licensePlate: "MGN 5521", color: "Gris", mileageUnit: "KM" as const },
      ],
    },
    {
      firstName: "Roberto",
      lastName: "Vasquez",
      email: "roberto.v@outlook.com",
      phone: "438-555-0103",
      address: "321 Rue Beaubien, Montréal, QC",
      vehicles: [
        { make: "Ford", model: "F-150", year: 2018, licensePlate: "RVZ 7734", color: "Negro", mileageUnit: "KM" as const },
        { make: "Chevrolet", model: "Equinox", year: 2021, licensePlate: "RVZ 1102", color: "Rojo", mileageUnit: "KM" as const },
      ],
    },
    {
      firstName: "Sylvie",
      lastName: "Côté",
      email: "sylvie.cote@videotron.ca",
      phone: "450-555-0104",
      vehicles: [
        { make: "Nissan", model: "Rogue", year: 2021, licensePlate: "SCT 4481", color: "Plata", mileageUnit: "KM" as const },
      ],
    },
    {
      firstName: "Ahmed",
      lastName: "Bouazizi",
      email: "a.bouazizi@gmail.com",
      phone: "514-555-0105",
      address: "55 Rue Jean-Talon E, Montréal, QC",
      vehicles: [
        { make: "Kia", model: "Sorento", year: 2023, licensePlate: "ABZ 3310", color: "Azul marino", mileageUnit: "KM" as const },
        { make: "Toyota", model: "Camry", year: 2017, licensePlate: "ABZ 8875", color: "Champagne", mileageUnit: "KM" as const },
      ],
    },
    {
      firstName: "Isabelle",
      lastName: "Lefebvre",
      email: "isabelle.lef@bell.net",
      phone: "514-555-0106",
      vehicles: [
        { make: "Mazda", model: "CX-5", year: 2022, licensePlate: "ILF 6643", color: "Rojo", mileageUnit: "KM" as const },
      ],
    },
    {
      firstName: "Pierre-Luc",
      lastName: "Beauchamp",
      email: "pl.beauchamp@gmail.com",
      phone: "438-555-0107",
      address: "88 Blvd. Décarie, Montréal, QC",
      vehicles: [
        { make: "Subaru", model: "Outback", year: 2020, licensePlate: "PLB 9921", color: "Verde", mileageUnit: "KM" as const },
        { make: "Dodge", model: "Charger", year: 2016, licensePlate: "PLB 4456", color: "Negro", mileageUnit: "KM" as const },
        { make: "Volkswagen", model: "Tiguan", year: 2024, licensePlate: "PLB 0077", color: "Blanco", mileageUnit: "KM" as const },
      ],
    },
    {
      firstName: "Nadia",
      lastName: "Morin",
      email: "nadia.morin@yahoo.ca",
      phone: "514-555-0108",
      vehicles: [
        { make: "Toyota", model: "Corolla", year: 2015, licensePlate: "NMR 2267", color: "Plateado", mileageUnit: "KM" as const },
      ],
    },
  ];

  let clientCount = 0;
  let vehicleCount = 0;

  for (const clientData of clientsData) {
    const { vehicles, ...data } = clientData;

    const client = await prisma.client.upsert({
      where: {
        // Para el seed usamos email como clave única si existe, si no creamos siempre
        id: `seed-${data.firstName.toLowerCase()}-${data.lastName.toLowerCase()}`,
      },
      update: {},
      create: {
        id: `seed-${data.firstName.toLowerCase()}-${data.lastName.toLowerCase()}`,
        shopId: shop.id,
        ...data,
      },
    });

    clientCount++;

    for (const vData of vehicles) {
      await prisma.vehicle.upsert({
        where: {
          id: `seed-${vData.licensePlate.replace(/\s/g, "")}`,
        },
        update: {},
        create: {
          id: `seed-${vData.licensePlate.replace(/\s/g, "")}`,
          clientId: client.id,
          ...vData,
        },
      });
      vehicleCount++;
    }
  }

  console.log(`✅ ${clientCount} clientes creados`);
  console.log(`✅ ${vehicleCount} vehículos creados`);

  // ── Recordatorios de ejemplo ─────────────────────────────
  // (se crean sobre vehículos existentes para demo)
  const firstVehicle = await prisma.vehicle.findFirst({
    where: { id: "seed-JFT2845" },
  });

  if (firstVehicle) {
    await prisma.serviceReminder.upsert({
      where: { id: "seed-reminder-1" },
      update: {},
      create: {
        id: "seed-reminder-1",
        shopId: shop.id,
        vehicleId: firstVehicle.id,
        serviceType: "Cambio de aceite",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        dueMileage: 80000,
        status: "PENDING",
      },
    });
    console.log("✅ Recordatorio de demo creado");
  }

  console.log("\n🎉 Seed completado exitosamente");
  console.log("   URL: http://localhost:3000");
  console.log("   Usuario: demo@mecanico.com");
  console.log("   Password: demo123");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
