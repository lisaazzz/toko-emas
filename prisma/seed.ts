import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.user.findFirst()
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 10)
    await prisma.user.create({
      data: {
        name: 'Admin',
        username: 'admin',
        password: hash,
      },
    })
    console.log('Default user created: admin / admin123')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
