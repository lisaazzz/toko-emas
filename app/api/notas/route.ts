import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { parseNota, nextNotaNo } from '@/lib/helpers'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || ''
  const notas = await prisma.nota.findMany({
    where: { userId },
    include: { payments: true, returs: true, customer: true },
    orderBy: [{ date: 'desc' }],
  })
  return NextResponse.json(notas.map(parseNota))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, date, type, customerId, customerName, customerStore, items, totalGross, totalNet, catatan } = body

  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  // Auto-generate nota number
  const existing = await prisma.nota.findMany({ where: { userId }, select: { notaNo: true } })
  const notaNo = nextNotaNo(existing.map((n) => n.notaNo))

  const nota = await prisma.nota.create({
    data: {
      userId,
      notaNo,
      date,
      type,
      customerId: customerId || null,
      customerName: customerName || null,
      customerStore: customerStore || null,
      items: JSON.stringify(items),
      totalGross,
      totalNet,
      catatan: catatan || null,
    },
    include: { payments: true, returs: true, customer: true },
  })
  return NextResponse.json(parseNota(nota))
}
