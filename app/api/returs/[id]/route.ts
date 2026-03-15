import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.retur.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
