import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || ''
  const customers = await prisma.customer.findMany({
    where: { userId },
    orderBy: [{ store: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(customers)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, name, store, phone } = body
  if (!userId || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const c = await prisma.customer.create({ data: { userId, name, store, phone } })
  return NextResponse.json(c)
}
