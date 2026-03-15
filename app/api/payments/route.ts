import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { parsePayment } from '@/lib/helpers'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { notaId, userId, date, cucian, perhiasan, cash_rp, cash_gram, cash_method, gold_price } = body

  const payment = await prisma.payment.create({
    data: {
      notaId,
      userId,
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
