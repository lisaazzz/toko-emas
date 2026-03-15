import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { parsePayment } from '@/lib/helpers'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { date, cucian, perhiasan, cash_rp, cash_gram, cash_method, gold_price } = body
  const payment = await prisma.payment.update({
    where: { id: parseInt(params.id) },
    data: {
      date,
      cucian: JSON.stringify(cucian || []),
      perhiasan: JSON.stringify(perhiasan || []),
      cash_rp: cash_rp || null,
      cash_gram: cash_gram || null,
      cash_method: cash_method || null,
      gold_price: gold_price || null,
    },
  })
  return NextResponse.json(parsePayment(payment))
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.payment.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
