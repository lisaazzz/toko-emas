import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || ''
  const [user, customers, notas, payments, returs, timbang] = await Promise.all([
    prisma.user.findFirst({ where: { id: userId } }),
    prisma.customer.findMany({ where: { userId } }),
    prisma.nota.findMany({ where: { userId } }),
    prisma.payment.findMany({ where: { userId } }),
    prisma.retur.findMany({ where: { userId } }),
    prisma.timbang.findMany({ where: { userId } }),
  ])
  const backup = { exportedAt: new Date().toISOString(), user, customers, notas, payments, returs, timbang }
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="toko-emas-backup-${new Date().toISOString().slice(0,10)}.json"`,
    },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, customers, notas, payments, returs, timbang } = body
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  // Clear existing data for this user
  await prisma.payment.deleteMany({ where: { userId } })
  await prisma.retur.deleteMany({ where: { userId } })
  await prisma.nota.deleteMany({ where: { userId } })
  await prisma.customer.deleteMany({ where: { userId } })
  await prisma.timbang.deleteMany({ where: { userId } })

  // Restore
  if (customers?.length) {
    for (const c of customers) {
      await prisma.customer.create({ data: { ...c, userId } })
    }
  }
  if (notas?.length) {
    for (const n of notas) {
      await prisma.nota.create({
        data: {
          ...n,
          userId,
          items: typeof n.items === 'string' ? n.items : JSON.stringify(n.items),
        },
      })
    }
  }
  if (payments?.length) {
    for (const p of payments) {
      await prisma.payment.create({
        data: {
          ...p,
          userId,
          id: undefined,
          cucian: typeof p.cucian === 'string' ? p.cucian : JSON.stringify(p.cucian),
          perhiasan: typeof p.perhiasan === 'string' ? p.perhiasan : JSON.stringify(p.perhiasan),
        },
      })
    }
  }
  if (returs?.length) {
    for (const r of returs) {
      await prisma.retur.create({
        data: {
          ...r,
          userId,
          id: undefined,
          items: typeof r.items === 'string' ? r.items : JSON.stringify(r.items),
        },
      })
    }
  }
  if (timbang?.length) {
    for (const t of timbang) {
      await prisma.timbang.upsert({
        where: { date: t.date },
        create: {
          ...t,
          userId,
          id: undefined,
          go: typeof t.go === 'string' ? t.go : JSON.stringify(t.go),
          back: typeof t.back === 'string' ? t.back : JSON.stringify(t.back),
        },
        update: {
          go: typeof t.go === 'string' ? t.go : JSON.stringify(t.go),
          back: typeof t.back === 'string' ? t.back : JSON.stringify(t.back),
          selisih: t.selisih,
          selisihFisik: t.selisihFisik,
        },
      })
    }
  }

  return NextResponse.json({
    ok: true,
    counts: {
      customers: customers?.length || 0,
      notas: notas?.length || 0,
      payments: payments?.length || 0,
      returs: returs?.length || 0,
      timbang: timbang?.length || 0,
    },
  })
}
