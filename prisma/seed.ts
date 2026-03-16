import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const defaultThreadPlatforms = [
  { name: "email", slug: "email" },
  { name: "x", slug: "x" },
  { name: "linkedin", slug: "linkedin" },
  { name: "telegram", slug: "telegram" },
  { name: "discord", slug: "discord" },
];

const defaultStatuses = [
  {
    name: "Draft",
    slug: "draft",
    bucket: "open",
    color: "#dde7fb",
    position: 10,
    isDefault: true,
  },
  {
    name: "Sent",
    slug: "sent",
    bucket: "open",
    color: "#2f68ff",
    position: 20,
  },
  {
    name: "Replied",
    slug: "replied",
    bucket: "open",
    color: "#3ed8ff",
    position: 30,
  },
  {
    name: "Follow-up due",
    slug: "follow-up-due",
    bucket: "open",
    color: "#ffb357",
    position: 40,
  },
  {
    name: "Closed",
    slug: "closed",
    bucket: "closed",
    color: "#94a3b8",
    position: 90,
  },
  {
    name: "Won",
    slug: "won",
    bucket: "won",
    color: "#bde640",
    position: 100,
  },
  {
    name: "Lost",
    slug: "lost",
    bucket: "lost",
    color: "#ff4fc7",
    position: 110,
  },
];

async function main() {
  for (const platform of defaultThreadPlatforms) {
    await prisma.threadPlatform.upsert({
      where: { slug: platform.slug },
      update: {
        name: platform.name,
      },
      create: platform,
    });
  }

  for (const status of defaultStatuses) {
    await prisma.status.upsert({
      where: { slug: status.slug },
      update: {
        name: status.name,
        bucket: status.bucket,
        color: status.color,
        position: status.position,
        isDefault: Boolean(status.isDefault),
      },
      create: {
        name: status.name,
        slug: status.slug,
        bucket: status.bucket,
        color: status.color,
        position: status.position,
        isDefault: Boolean(status.isDefault),
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
