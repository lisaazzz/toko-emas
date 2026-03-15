import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET /api/init — returns the first user (single-user mode)
export async function GET() {
  try {
    let user = await prisma.user.findFirst()
    if (!user) {
      const hash = await bcrypt.hash('admin123', 10)
      user = await prisma.user.create({
        data: { name: 'Admin Toko', username: 'admin', password: hash },
      })
    }
    return NextResponse.json({ id: user.id, name: user.name, username: user.username })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
