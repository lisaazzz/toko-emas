import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { parseNota } from '@/lib/helpers'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const nota = await prisma.nota.findUnique({
    where: { id: params.id },
    include: { payments: true, returs: true, customer: true },
  })
  if (!nota) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(parseNota(nota))
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { date, type, customerId, customerName, customerStore, items, totalGross, totalNet, catatan } = body
  const nota = await prisma.nota.update({
    where: { id: params.id },
    data: {
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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  // Delete related payments and returs first
  await prisma.payment.deleteMany({ where: { notaId: params.id } })
  await prisma.retur.deleteMany({ where: { notaId: params.id } })
  await prisma.nota.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
