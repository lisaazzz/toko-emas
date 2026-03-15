import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { parseNota, getDebtStatus, getNetAfterRetur, todayStr } from '@/lib/helpers'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || ''
  const today = todayStr()

  const [notas, payments, returs] = await Promise.all([
    prisma.nota.findMany({ where: { userId } }),
    prisma.payment.findMany({ where: { userId } }),
    prisma.retur.findMany({ where: { userId } }),
  ])

  const parsedNotas = notas.map(parseNota)

  const stockIn = parsedNotas.filter((n) => n.type === 'stock_in')
  const stockReturn = parsedNotas.filter((n) => n.type === 'stock_return')
  const sales = parsedNotas.filter((n) => n.type === 'sale')

  const totalMasukGross = stockIn.reduce((s, n) => s + n.totalGross, 0)
  const totalMasukNet = stockIn.reduce((s, n) => s + n.totalNet, 0)
  const totalReturKantorGross = stockReturn.reduce((s, n) => s + n.totalGross, 0)
  const totalReturKantorNet = stockReturn.reduce((s, n) => s + n.totalNet, 0)

  // Sales after retur customer
  let totalJualGross = 0
  let totalJualNet = 0
  let notasWithRetur = 0
  let totalPiutang = 0
  let jualHariIniGross = 0

  for (const n of sales) {
    const notaReturs = returs.filter((r) => r.notaId === n.id).map((r) => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
    }))
    const notaPayments = payments.filter((p) => p.notaId === n.id).map((p) => ({
      ...p,
      cucian: typeof p.cucian === 'string' ? JSON.parse(p.cucian) : p.cucian,
      perhiasan: typeof p.perhiasan === 'string' ? JSON.parse(p.perhiasan) : p.perhiasan,
    }))

    const after = getNetAfterRetur(notaReturs, n.totalGross, n.totalNet)
    totalJualGross += after.gross
    totalJualNet += after.net
    if (notaReturs.length > 0) notasWithRetur++

    const debt = getDebtStatus(n, notaPayments, notaReturs)
    if (debt.status !== 'lunas') totalPiutang += debt.effectiveRemaining

    if (n.date === today) jualHariIniGross += after.gross
  }

  // Sisa stok = stockIn - jualNet - stockReturnNet
  const sisaGross = totalMasukGross - totalJualGross - totalReturKantorGross
  const sisaNet = totalMasukNet - totalJualNet - totalReturKantorNet

  // 5 nota terbaru
  const latestNotas = parsedNotas
    .sort((a, b) => {
      const d = b.date.localeCompare(a.date)
      if (d !== 0) return d
      return b.notaNo.localeCompare(a.notaNo)
    })
    .slice(0, 5)
    .map((n) => ({
      id: n.id,
      notaNo: n.notaNo,
      date: n.date,
      type: n.type,
      customerName: n.customerName,
      customerStore: n.customerStore,
      totalGross: n.totalGross,
      totalNet: n.totalNet,
    }))

  return NextResponse.json({
    inventaris: {
      totalMasukGross,
      totalMasukNet,
      totalReturKantorGross,
      totalReturKantorNet,
      sisaGross: Math.max(0, sisaGross),
      sisaNet: Math.max(0, sisaNet),
    },
    penjualan: {
      totalNota: sales.length,
      notasWithRetur,
      totalJualGross,
      totalJualNet,
      totalPiutang,
      jualHariIniGross,
    },
    latestNotas,
  })
}
