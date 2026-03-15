import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

function parseTimbang(t: any) {
  return {
    ...t,
    go: typeof t.go === 'string' ? JSON.parse(t.go) : t.go,
    back: typeof t.back === 'string' ? JSON.parse(t.back) : t.back,
  }
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || ''
  const list = await prisma.timbang.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(list.map(parseTimbang))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, date, go, back, selisih, selisihFisik } = body
  const t = await prisma.timbang.upsert({
    where: { date },
    create: {
      userId,
      date,
      go: JSON.stringify(go),
      back: JSON.stringify(back),
      selisih,
      selisihFisik,
    },
    update: {
      go: JSON.stringify(go),
      back: JSON.stringify(back),
      selisih,
      selisihFisik,
    },
  })
  return NextResponse.json(parseTimbang(t))
}
