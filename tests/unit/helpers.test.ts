import { describe, it, expect } from 'vitest'
import {
  fmtGram,
  fmtRp,
  fmtDate,
  parseNotaNo,
  nextNotaNo,
  getNetAfterRetur,
  getDebtStatus,
  customerDisplayName,
  customerSubName,
  parseNota,
  parsePayment,
  parseRetur,
  sortNotas,
} from '../../lib/helpers'
import type { NotaWithRelations, PaymentWithParsed, ReturWithParsed } from '../../lib/types'

// ── fmtGram ──────────────────────────────────────────────────────────────────

describe('fmtGram', () => {
  it('formats gram to 3 decimal places', () => {
    expect(fmtGram(10)).toBe('10.000 g')
    expect(fmtGram(5.5)).toBe('5.500 g')
    expect(fmtGram(0.001)).toBe('0.001 g')
    expect(fmtGram(0)).toBe('0.000 g')
  })
})

// ── fmtRp ─────────────────────────────────────────────────────────────────────

describe('fmtRp', () => {
  it('formats currency with Indonesian locale prefix', () => {
    const result = fmtRp(1000000)
    expect(result).toMatch(/^Rp /)
    expect(result).toContain('1')
  })

  it('rounds to nearest integer', () => {
    expect(fmtRp(1000.7)).toBe(fmtRp(1001))
  })

  it('handles zero', () => {
    expect(fmtRp(0)).toBe('Rp 0')
  })
})

// ── fmtDate ───────────────────────────────────────────────────────────────────

describe('fmtDate', () => {
  it('returns a non-empty formatted string for a valid date', () => {
    const result = fmtDate('2024-01-15')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

// ── parseNotaNo ───────────────────────────────────────────────────────────────

describe('parseNotaNo', () => {
  it('parses standard nota number', () => {
    expect(parseNotaNo('AA 00001')).toEqual({ prefix: 'AA', num: 1 })
    expect(parseNotaNo('BC 00042')).toEqual({ prefix: 'BC', num: 42 })
  })

  it('returns defaults for invalid format', () => {
    expect(parseNotaNo('invalid')).toEqual({ prefix: 'AA', num: 0 })
    expect(parseNotaNo('')).toEqual({ prefix: 'AA', num: 0 })
  })

  it('handles numbers without leading zeros', () => {
    expect(parseNotaNo('AA 1')).toEqual({ prefix: 'AA', num: 1 })
  })
})

// ── nextNotaNo ────────────────────────────────────────────────────────────────

describe('nextNotaNo', () => {
  it('returns AA 00001 for empty list', () => {
    expect(nextNotaNo([])).toBe('AA 00001')
  })

  it('increments the max number', () => {
    expect(nextNotaNo(['AA 00001'])).toBe('AA 00002')
    expect(nextNotaNo(['AA 00001', 'AA 00002', 'AA 00003'])).toBe('AA 00004')
  })

  it('preserves the prefix from the highest-numbered nota', () => {
    expect(nextNotaNo(['AA 00005', 'BB 00003'])).toBe('AA 00006')
  })

  it('pads number to 5 digits', () => {
    expect(nextNotaNo(['AA 00099'])).toBe('AA 00100')
  })
})

// ── getNetAfterRetur ──────────────────────────────────────────────────────────

describe('getNetAfterRetur', () => {
  const makeRetur = (gross: number, net: number): ReturWithParsed => ({
    id: 1,
    notaId: 'n1',
    userId: 'u1',
    date: '2024-01-01',
    items: [],
    totalGross: gross,
    totalNet: net,
  })

  it('subtracts retur amounts from original', () => {
    const result = getNetAfterRetur([makeRetur(2, 1.9)], 10, 9.5)
    expect(result.gross).toBeCloseTo(8)
    expect(result.net).toBeCloseTo(7.6)
    expect(result.hasRetur).toBe(true)
  })

  it('returns original values when no returs', () => {
    const result = getNetAfterRetur([], 10, 9.5)
    expect(result.gross).toBe(10)
    expect(result.net).toBe(9.5)
    expect(result.hasRetur).toBe(false)
  })

  it('clamps to zero if retur exceeds original', () => {
    const result = getNetAfterRetur([makeRetur(20, 19)], 10, 9.5)
    expect(result.gross).toBe(0)
    expect(result.net).toBe(0)
  })

  it('sums multiple returs', () => {
    const returs = [makeRetur(2, 1.9), makeRetur(1, 0.95)]
    const result = getNetAfterRetur(returs, 10, 9.5)
    expect(result.gross).toBeCloseTo(7)
    expect(result.net).toBeCloseTo(6.65)
  })
})

// ── getDebtStatus ─────────────────────────────────────────────────────────────

const makeNota = (overrides: Partial<NotaWithRelations> = {}): NotaWithRelations => ({
  id: 'nota1',
  userId: 'user1',
  notaNo: 'AA 00001',
  date: '2024-01-01',
  type: 'sale',
  items: [{ gross: 10, pct: 95, net: 9.5 }],
  totalGross: 10,
  totalNet: 9.5,
  payments: [],
  returs: [],
  ...overrides,
})

const makePayment = (overrides: Partial<PaymentWithParsed> = {}): PaymentWithParsed => ({
  id: 1,
  notaId: 'nota1',
  userId: 'user1',
  date: '2024-01-15',
  cucian: [],
  perhiasan: [],
  ...overrides,
})

describe('getDebtStatus', () => {
  it('returns belum status when no payments', () => {
    const status = getDebtStatus(makeNota(), [], [])
    expect(status.status).toBe('belum')
    expect(status.paidGram).toBe(0)
    expect(status.remainingGram).toBeCloseTo(9.5)
    expect(status.totalGram).toBeCloseTo(9.5)
  })

  it('returns lunas status when fully paid', () => {
    const payment = makePayment({
      cucian: [{ totalGram: 9.5, pieces: 5 }],
    })
    const status = getDebtStatus(makeNota(), [payment], [])
    expect(status.status).toBe('lunas')
    expect(status.remainingGram).toBe(0)
  })

  it('returns sebagian when partially paid', () => {
    const payment = makePayment({
      cucian: [{ totalGram: 5, pieces: 3 }],
    })
    const status = getDebtStatus(makeNota(), [payment], [])
    expect(status.status).toBe('sebagian')
    expect(status.paidGram).toBe(5)
    expect(status.remainingGram).toBeCloseTo(4.5)
  })

  it('counts cash_gram toward payment', () => {
    const payment = makePayment({ cash_gram: 9.5 })
    const status = getDebtStatus(makeNota(), [payment], [])
    expect(status.status).toBe('lunas')
  })

  it('counts perhiasan net toward payment', () => {
    const payment = makePayment({
      perhiasan: [{ gross: 10, pct: 95, net: 9.5 }],
    })
    const status = getDebtStatus(makeNota(), [payment], [])
    expect(status.status).toBe('lunas')
  })

  it('applies retur reduction to total before checking debt', () => {
    const nota = makeNota()
    const retur: ReturWithParsed = {
      id: 1,
      notaId: 'nota1',
      userId: 'user1',
      date: '2024-01-10',
      items: [],
      totalGross: 5,
      totalNet: 4.75,
    }
    const payment = makePayment({ cucian: [{ totalGram: 4.75, pieces: 2 }] })
    const status = getDebtStatus(nota, [payment], [retur])
    expect(status.status).toBe('lunas')
  })
})

// ── customerDisplayName / customerSubName ─────────────────────────────────────

describe('customerDisplayName', () => {
  it('returns store name when store is set', () => {
    expect(customerDisplayName({ name: 'Ali', store: 'Toko Makmur' })).toBe('Toko Makmur')
  })

  it('returns name when no store', () => {
    expect(customerDisplayName({ name: 'Ali', store: null })).toBe('Ali')
    expect(customerDisplayName({ name: 'Ali' })).toBe('Ali')
  })
})

describe('customerSubName', () => {
  it('returns name as sub when store is set', () => {
    expect(customerSubName({ name: 'Ali', store: 'Toko Makmur' })).toBe('Ali')
  })

  it('returns null when no store', () => {
    expect(customerSubName({ name: 'Ali', store: null })).toBeNull()
    expect(customerSubName({ name: 'Ali' })).toBeNull()
  })
})

// ── parseNota / parsePayment / parseRetur ─────────────────────────────────────

describe('parseNota', () => {
  it('parses JSON string items', () => {
    const raw = {
      id: '1',
      userId: 'u1',
      notaNo: 'AA 00001',
      date: '2024-01-01',
      type: 'sale',
      items: '[{"gross":10,"pct":95,"net":9.5}]',
      totalGross: 10,
      totalNet: 9.5,
      payments: [],
      returs: [],
    }
    const nota = parseNota(raw)
    expect(Array.isArray(nota.items)).toBe(true)
    expect(nota.items[0].gross).toBe(10)
  })

  it('keeps already-parsed items as-is', () => {
    const items = [{ gross: 10, pct: 95, net: 9.5 }]
    const raw = { items, payments: [], returs: [] }
    const nota = parseNota(raw)
    expect(nota.items).toEqual(items)
  })
})

describe('parsePayment', () => {
  it('parses JSON string cucian and perhiasan', () => {
    const raw = {
      id: 1,
      cucian: '[{"totalGram":5,"pieces":3}]',
      perhiasan: '[]',
    }
    const p = parsePayment(raw)
    expect(Array.isArray(p.cucian)).toBe(true)
    expect(p.cucian[0].totalGram).toBe(5)
    expect(Array.isArray(p.perhiasan)).toBe(true)
  })
})

describe('parseRetur', () => {
  it('parses JSON string items', () => {
    const raw = {
      id: 1,
      items: '[{"gross":2,"pct":95,"net":1.9}]',
      totalGross: 2,
      totalNet: 1.9,
    }
    const r = parseRetur(raw)
    expect(Array.isArray(r.items)).toBe(true)
    expect(r.items[0].net).toBe(1.9)
  })
})

// ── sortNotas ─────────────────────────────────────────────────────────────────

describe('sortNotas', () => {
  const makeSimpleNota = (date: string, notaNo: string): NotaWithRelations =>
    makeNota({ date, notaNo, id: notaNo })

  it('sorts by date descending', () => {
    const notas = [
      makeSimpleNota('2024-01-01', 'AA 00001'),
      makeSimpleNota('2024-03-15', 'AA 00002'),
      makeSimpleNota('2024-02-10', 'AA 00003'),
    ]
    const sorted = sortNotas(notas)
    expect(sorted[0].date).toBe('2024-03-15')
    expect(sorted[1].date).toBe('2024-02-10')
    expect(sorted[2].date).toBe('2024-01-01')
  })

  it('sorts by nota number descending when dates are equal', () => {
    const notas = [
      makeSimpleNota('2024-01-01', 'AA 00001'),
      makeSimpleNota('2024-01-01', 'AA 00003'),
      makeSimpleNota('2024-01-01', 'AA 00002'),
    ]
    const sorted = sortNotas(notas)
    expect(sorted[0].notaNo).toBe('AA 00003')
    expect(sorted[1].notaNo).toBe('AA 00002')
    expect(sorted[2].notaNo).toBe('AA 00001')
  })

  it('does not mutate original array', () => {
    const notas = [makeSimpleNota('2024-01-01', 'AA 00001'), makeSimpleNota('2024-03-01', 'AA 00002')]
    const original = [...notas]
    sortNotas(notas)
    expect(notas).toEqual(original)
  })
})
