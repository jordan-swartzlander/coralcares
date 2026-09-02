import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_STAFF_EMAIL;
  const password = process.env.SEED_STAFF_PASSWORD;
  const name = process.env.SEED_STAFF_NAME ?? "Staff Admin";

  if (!email || !password) {
    throw new Error(
      "Set SEED_STAFF_EMAIL and SEED_STAFF_PASSWORD env vars before running the seed."
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.staff.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });

  console.log(`Staff account ready: ${email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
