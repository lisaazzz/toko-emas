import type { NotaWithRelations, PaymentWithParsed, ReturWithParsed, DebtStatus } from './types'

// ── Format helpers ──────────────────────────────────────────────────────────

export function fmtGram(g: number): string {
  return g.toFixed(3) + ' g'
}

export function fmtRp(rp: number): string {
  return 'Rp ' + Math.round(rp).toLocaleString('id-ID')
}

export function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Nota number generation ──────────────────────────────────────────────────

export function parseNotaNo(notaNo: string): { prefix: string; num: number } {
  const match = notaNo.match(/^([A-Z]+)\s*(\d+)$/)
  if (!match) return { prefix: 'AA', num: 0 }
  return { prefix: match[1], num: parseInt(match[2]) }
}

export function nextNotaNo(existingNos: string[]): string {
  if (!existingNos.length) return 'AA 00001'
  const parsed = existingNos.map(parseNotaNo)
  const maxNum = Math.max(...parsed.map((p) => p.num))
  const prefix = parsed.find((p) => p.num === maxNum)?.prefix ?? 'AA'
  const nextNum = maxNum + 1
  return `${prefix} ${String(nextNum).padStart(5, '0')}`
}

// ── Retur calculation ───────────────────────────────────────────────────────

export function getNetAfterRetur(
  returs: ReturWithParsed[],
  originalGross: number,
  originalNet: number
) {
  const returGross = returs.reduce((s, r) => s + r.totalGross, 0)
  const returNet = returs.reduce((s, r) => s + r.totalNet, 0)
  return {
    gross: Math.max(0, originalGross - returGross),
    net: Math.max(0, originalNet - returNet),
    hasRetur: returs.length > 0,
  }
}

// ── Debt status calculation ─────────────────────────────────────────────────

export function getDebtStatus(
  nota: NotaWithRelations,
  payments: PaymentWithParsed[],
  returs: ReturWithParsed[]
): DebtStatus {
  const final = getNetAfterRetur(returs, nota.totalGross, nota.totalNet)
  const totalGram = final.net

  let paidGram = 0
  payments.forEach((p) => {
    ;(p.cucian || []).forEach((c) => { paidGram += c.totalGram })
    ;(p.perhiasan || []).forEach((h) => { paidGram += h.net || 0 })
    if (p.cash_gram) paidGram += p.cash_gram
  })

  const remainingGram = Math.max(0, totalGram - paidGram)

  // Denda
  const dueDate = new Date(nota.date + 'T00:00:00')
  dueDate.setMonth(dueDate.getMonth() + 1)
  const diffDays = (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  let denda = 0
  let dendaLabel = ''
  if (diffDays > 90) {
    denda = nota.totalGross * 0.02
    dendaLabel = '+2% (lewat 3 bln)'
  } else if (diffDays > 60) {
    denda = nota.totalGross * 0.01
    dendaLabel = '+1% (lewat 2 bln)'
  }

  const effectiveRemaining = Math.max(0, remainingGram + denda)
  const status: 'lunas' | 'sebagian' | 'belum' =
    remainingGram <= 0.0001 ? 'lunas' : paidGram > 0 ? 'sebagian' : 'belum'

  return {
    totalGram,
    paidGram,
    remainingGram,
    effectiveRemaining,
    denda,
    dendaLabel,
    status,
    dueDate,
    diffDays,
  }
}

// ── Nota sorting ────────────────────────────────────────────────────────────

export function sortNotas(notas: NotaWithRelations[]): NotaWithRelations[] {
  return [...notas].sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date)
    if (dateDiff !== 0) return dateDiff
    const an = parseNotaNo(a.notaNo).num
    const bn = parseNotaNo(b.notaNo).num
    return bn - an
  })
}

// ── Customer display name ───────────────────────────────────────────────────

export function customerDisplayName(c: { name: string; store?: string | null }): string {
  return c.store ? c.store : c.name
}

export function customerSubName(c: { name: string; store?: string | null }): string | null {
  return c.store ? c.name : null
}

// ── Parse JSON fields from DB ───────────────────────────────────────────────

export function parseNota(raw: any): NotaWithRelations {
  return {
    ...raw,
    items: typeof raw.items === 'string' ? JSON.parse(raw.items) : raw.items,
    payments: (raw.payments || []).map(parsePayment),
    returs: (raw.returs || []).map(parseRetur),
  }
}

export function parsePayment(raw: any): PaymentWithParsed {
  return {
    ...raw,
    cucian: typeof raw.cucian === 'string' ? JSON.parse(raw.cucian) : raw.cucian,
    perhiasan: typeof raw.perhiasan === 'string' ? JSON.parse(raw.perhiasan) : raw.perhiasan,
  }
}

export function parseRetur(raw: any): ReturWithParsed {
  return {
    ...raw,
    items: typeof raw.items === 'string' ? JSON.parse(raw.items) : raw.items,
  }
}
