import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding minimal...")

  const passwordHash = await bcrypt.hash("admin123", 10)

  await prisma.user.upsert({
    where: { email: "admin@edu-admin.io" },
    update: {},
    create: {
      email: "admin@edu-admin.io",
      passwordHash,
      name: "Admin",
      role: UserRole.SUPER_ADMIN,
    },
  })

  console.log("✅ Admin créé : admin@edu-admin.io / admin123")
}

main()
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })