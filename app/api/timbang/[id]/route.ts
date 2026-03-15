import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

function parseTimbang(t: any) {
  return {
    ...t,
    go: typeof t.go === 'string' ? JSON.parse(t.go) : t.go,
    back: typeof t.back === 'string' ? JSON.parse(t.back) : t.back,
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { go, back, selisih, selisihFisik } = body
  const t = await prisma.timbang.update({
    where: { id: parseInt(params.id) },
    data: {
      go: JSON.stringify(go),
      back: JSON.stringify(back),
      selisih,
      selisihFisik,
    },
  })
  return NextResponse.json(parseTimbang(t))
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.timbang.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
