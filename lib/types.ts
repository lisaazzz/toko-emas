export interface NotaItem {
  gross: number
  pct: number
  net: number
}

export interface CucianItem {
  totalGram: number
  pieces: number
}

export interface PerhiasanItem {
  gross: number
  pct: number
  net: number
}

export interface TimbangGo {
  rol: number
  kotak: number
  packing: number
  total: number
}

export interface TimbangBack {
  rol: number
  kotak: number
  packing: number
  plastikAmbil: number
  plastikBawa: number
  total: number
}

export interface NotaWithRelations {
  id: string
  userId: string
  notaNo: string
  date: string
  type: 'sale' | 'stock_in' | 'stock_return'
  customerId?: string | null
  customerName?: string | null
  customerStore?: string | null
  items: NotaItem[]
  totalGross: number
  totalNet: number
  catatan?: string | null
  payments?: PaymentWithParsed[]
  returs?: ReturWithParsed[]
  customer?: CustomerType | null
}

export interface CustomerType {
  id: string
  userId: string
  name: string
  store?: string | null
  phone?: string | null
}

export interface PaymentWithParsed {
  id: number
  notaId: string
  userId: string
  date: string
  cucian: CucianItem[]
  perhiasan: PerhiasanItem[]
  cash_rp?: number | null
  cash_gram?: number | null
  cash_method?: string | null
  gold_price?: number | null
}

export interface ReturWithParsed {
  id: number
  notaId: string
  userId: string
  date: string
  note?: string | null
  items: NotaItem[]
  totalGross: number
  totalNet: number
}

export interface DebtStatus {
  totalGram: number
  paidGram: number
  remainingGram: number
  effectiveRemaining: number
  denda: number
  dendaLabel: string
  status: 'lunas' | 'sebagian' | 'belum'
  dueDate: Date
  diffDays: number
}
