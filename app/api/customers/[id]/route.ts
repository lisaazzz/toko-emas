import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { name, store, phone } = body
  const c = await prisma.customer.update({
    where: { id: params.id },
    data: { name, store: store || null, phone: phone || null },
  })
  return NextResponse.json(c)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.customer.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
