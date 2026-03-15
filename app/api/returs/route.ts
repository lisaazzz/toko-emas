import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { parseRetur } from '@/lib/helpers'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { notaId, userId, date, note, items, totalGross, totalNet } = body
  const retur = await prisma.retur.create({
    data: {
      notaId,
      userId,
      date,
      note: note || null,
      items: JSON.stringify(items || []),
      totalGross,
      totalNet,
    },
  })
  return NextResponse.json(parseRetur(retur))
}
