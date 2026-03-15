'use client'
import { useState } from 'react'
import { useApp } from '@/lib/store'
import { fmtGram, fmtDate, fmtRp, getDebtStatus, getNetAfterRetur } from '@/lib/helpers'
import toast from 'react-hot-toast'
import NotaForm from './NotaForm'
import PaymentForm from './PaymentForm'
import ReturForm from './ReturForm'
import type { NotaWithRelations, PaymentWithParsed } from '@/lib/types'

interface Props {
  nota: NotaWithRelations
  onClose: () => void
}

export default function NotaDetail({ nota: initialNota, onClose }: Props) {
  const { loadNotas, userId } = useApp()
  const [nota, setNota] = useState(initialNota)
  const [showEdit, setShowEdit] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showRetur, setShowRetur] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editPayment, setEditPayment] = useState<PaymentWithParsed | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Refresh nota after any change
  async function refreshNota() {
    const r = await fetch(`/api/notas/${nota.id}`)
    if (r.ok) {
      const data = await r.json()
      setNota(data)
    }
    await loadNotas()
  }

  const payments = nota.payments || []
  const returs = nota.returs || []

  const afterRetur = getNetAfterRetur(returs, nota.totalGross, nota.totalNet)
  const debt = nota.type === 'sale' ? getDebtStatus(nota, payments, returs) : null

  const typeLabelMap: Record<string, string> = {
    sale: 'PENJUALAN',
    stock_in: 'STOK MASUK',
    stock_return: 'RETUR KE KANTOR',
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const r = await fetch(`/api/notas/${nota.id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      await loadNotas()
      toast.success('Nota berhasil dihapus')
      onClose()
    } catch {
      toast.error('Gagal menghapus nota')
    } finally {
      setDeleting(false)
    }
  }

  async function handleDeletePayment(payId: number) {
    await fetch(`/api/payments/${payId}`, { method: 'DELETE' })
    await refreshNota()
    toast.success('Pembayaran dihapus')
  }

  async function handleDeleteRetur(returId: number) {
    await fetch(`/api/returs/${returId}`, { method: 'DELETE' })
    await refreshNota()
    toast.success('Retur dihapus')
  }

  async function handleCalendar() {
    const dueDate = new Date(nota.date + 'T00:00:00')
    dueDate.setMonth(dueDate.getMonth() + 1)
    const reminderDate = new Date(dueDate)
    reminderDate.setDate(reminderDate.getDate() - 1)

    const custName = nota.customerStore || nota.customerName || 'Customer'
    const title = `⚠ Jatuh Tempo: ${custName} — Nota ${nota.notaNo}`
    const desc = `Nota: ${nota.notaNo}\nCustomer: ${nota.customerName || '-'} / ${nota.customerStore || '-'}\nTotal: ${nota.totalNet.toFixed(3)} g\nJatuh Tempo: ${fmtDate(dueDate.toISOString().slice(0,10))}`

    // Open Google Calendar
    const start = reminderDate.toISOString().replace(/[-:]/g, '').slice(0, 15) + '00Z'
    const end = reminderDate.toISOString().replace(/[-:]/g, '').slice(0, 15) + '00Z'
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(desc)}&dates=${start}/${end}&color=11`
    window.open(url, '_blank')
  }

  function paymentSummary(p: PaymentWithParsed): string {
    const parts: string[] = []
    const cucianTotal = (p.cucian || []).reduce((s: number, c: any) => s + c.totalGram, 0)
    const perhTotal = (p.perhiasan || []).reduce((s: number, h: any) => s + (h.net || 0), 0)
    if (cucianTotal > 0) parts.push(`Cucian ${cucianTotal.toFixed(3)}g`)
    if (perhTotal > 0) parts.push(`Perhiasan ${perhTotal.toFixed(3)}g`)
    if (p.cash_gram) parts.push(`Cash ${p.cash_gram.toFixed(3)}g`)
    return parts.join(' + ') || '—'
  }

  function paymentGramTotal(p: PaymentWithParsed): number {
    const cucianTotal = (p.cucian || []).reduce((s: number, c: any) => s + c.totalGram, 0)
    const perhTotal = (p.perhiasan || []).reduce((s: number, h: any) => s + (h.net || 0), 0)
    return cucianTotal + perhTotal + (p.cash_gram || 0)
  }

  const statusColor = debt ? {
    lunas: 'text-green-600',
    sebagian: 'text-yellow-600',
    belum: 'text-red-600',
  }[debt.status] : ''

  const statusLabel = debt ? {
    lunas: 'LUNAS',
    sebagian: 'SEBAGIAN',
    belum: 'BELUM BAYAR',
  }[debt.status] : ''

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col">
      <div className="flex-1 overflow-y-auto bg-[#f8f5ee]">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
          <h2 className="font-cinzel text-base font-bold text-gold-700 tracking-wide flex-1">{nota.notaNo}</h2>
          {nota.type === 'sale' && debt && (
            <span className={`text-xs font-bold ${statusColor}`}>{statusLabel}</span>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Struk */}
          <div className="struk rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="text-center mb-3">
              <p className="font-cinzel text-lg font-bold tracking-widest">{nota.notaNo}</p>
              <p className="text-sm text-gray-600">{typeLabelMap[nota.type]}</p>
              <p className="text-sm text-gray-500">{fmtDate(nota.date)}</p>
            </div>
            {(nota.customerName || nota.customerStore) && (
              <div className="border-t border-dashed border-gray-300 pt-2 mb-2">
                <p className="text-sm font-bold">{nota.customerStore || nota.customerName}</p>
                {nota.customerStore && nota.customerName && (
                  <p className="text-xs text-gray-500">{nota.customerName}</p>
                )}
              </div>
            )}
            <div className="border-t border-dashed border-gray-300 pt-2">
              <div className="text-xs text-gray-500 grid grid-cols-[1fr_60px_60px] gap-1 mb-1">
                <span>B.Kotor</span><span className="text-right">Kadar</span><span className="text-right">B.Bersih</span>
              </div>
              {nota.items.map((item, i) => (
                <div key={i} className="text-sm grid grid-cols-[1fr_60px_60px] gap-1">
                  <span>{item.gross.toFixed(3)}</span>
                  <span className="text-right text-gray-500">{item.pct}%</span>
                  <span className="text-right">{item.net.toFixed(3)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-gray-300 mt-2 pt-2 space-y-0.5">
              <div className="flex justify-between text-sm">
                <span>Total B.Kotor</span>
                <span className="font-bold">{nota.totalGross.toFixed(3)} g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total B.Bersih</span>
                <span className="font-bold">{nota.totalNet.toFixed(3)} g</span>
              </div>
              {returs.length > 0 && (
                <>
                  <div className="flex justify-between text-sm text-red-500">
                    <span>- Retur Customer</span>
                    <span>-{(nota.totalNet - afterRetur.net).toFixed(3)} g</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-dashed border-gray-300 pt-1 mt-1">
                    <span>Total Efektif</span>
                    <span>{afterRetur.net.toFixed(3)} g</span>
                  </div>
                </>
              )}
              {nota.type === 'sale' && (
                <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-1 mt-1">
                  <span>TOTAL TAGIHAN</span>
                  <span>{afterRetur.net.toFixed(3)} g</span>
                </div>
              )}
            </div>
            {nota.catatan && (
              <div className="border-t border-dashed border-gray-300 mt-2 pt-2">
                <p className="text-xs text-gray-500">Catatan: {nota.catatan}</p>
              </div>
            )}
          </div>

          {/* Debt status (sale only) */}
          {nota.type === 'sale' && debt && (
            <div className={`rounded-2xl p-4 border ${
              debt.status === 'lunas' ? 'bg-green-50 border-green-200' :
              debt.status === 'sebagian' ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            }`}>
              <h3 className="font-cinzel text-xs font-bold text-gray-600 mb-2 tracking-wide">STATUS PEMBAYARAN</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Tagihan</span>
                  <span className="font-cormorant font-semibold">{debt.totalGram.toFixed(3)} g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sudah Dibayar</span>
                  <span className="font-cormorant font-semibold text-green-600">-{debt.paidGram.toFixed(3)} g</span>
                </div>
                {debt.denda > 0 && (
                  <div className="flex justify-between">
                    <span className="text-orange-500">Denda {debt.dendaLabel}</span>
                    <span className="font-cormorant font-semibold text-orange-600">+{debt.denda.toFixed(3)} g</span>
                  </div>
                )}
                <div className={`flex justify-between font-bold text-base border-t pt-1.5 mt-1 ${
                  debt.status === 'lunas' ? 'border-green-200' : debt.status === 'sebagian' ? 'border-yellow-200' : 'border-red-200'
                }`}>
                  <span>Sisa Hutang</span>
                  <span className={`font-cormorant ${statusColor}`}>{debt.effectiveRemaining.toFixed(3)} g</span>
                </div>
                {debt.diffDays > 0 && debt.status !== 'lunas' && (
                  <p className="text-xs text-red-500">Lewat {Math.floor(debt.diffDays)} hari dari jatuh tempo</p>
                )}
              </div>
            </div>
          )}

          {/* Payments */}
          {payments.length > 0 && (
            <div className="bg-white rounded-2xl p-4">
              <h3 className="font-cinzel text-xs font-bold text-gray-500 mb-2 tracking-wide">RIWAYAT PEMBAYARAN</h3>
              <div className="space-y-2">
                {payments.map(p => (
                  <div key={p.id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">{fmtDate(p.date)}</p>
                        <p className="text-sm font-medium text-gray-700">{paymentSummary(p)}</p>
                        <p className="font-cormorant text-base text-amber-700 font-semibold">{paymentGramTotal(p).toFixed(3)} g</p>
                        {p.cash_rp && p.gold_price && (
                          <p className="text-xs text-gray-400">{fmtRp(p.cash_rp)} @ {fmtRp(p.gold_price)}/g via {p.cash_method}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => setEditPayment(p)} className="text-xs text-blue-400 hover:text-blue-600 px-2 py-1 rounded border border-blue-100">Edit</button>
                        <button onClick={() => handleDeletePayment(p.id)} className="text-xs text-red-300 hover:text-red-500 px-2 py-1 rounded border border-red-100">✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Returs */}
          {returs.length > 0 && (
            <div className="bg-white rounded-2xl p-4">
              <h3 className="font-cinzel text-xs font-bold text-gray-500 mb-2 tracking-wide">RIWAYAT RETUR</h3>
              <div className="space-y-2">
                {returs.map(r => (
                  <div key={r.id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">{fmtDate(r.date)}</p>
                        {r.note && <p className="text-sm text-gray-600">{r.note}</p>}
                        <p className="font-cormorant text-base text-purple-700 font-semibold">-{r.totalNet.toFixed(3)} g B.Bersih</p>
                        <p className="text-xs text-gray-400">B.Kotor: {r.totalGross.toFixed(3)} g</p>
                      </div>
                      <button onClick={() => handleDeleteRetur(r.id)} className="text-xs text-red-300 hover:text-red-500 px-2 py-1 rounded border border-red-100 ml-2">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex gap-2 flex-wrap">
        <button onClick={() => setShowEdit(true)}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
          ✏️ Edit
        </button>
        <button onClick={() => setShowDeleteConfirm(true)}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50">
          🗑 Hapus
        </button>
        {(nota.type === 'sale' || nota.type === 'stock_in') && (
          <button onClick={() => setShowRetur(true)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-purple-200 text-purple-600 hover:bg-purple-50">
            ↩ Retur
          </button>
        )}
        {nota.type === 'sale' && (
          <>
            <button onClick={() => setShowPayment(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-amber-500 text-white hover:bg-amber-600">
              💰 Bayar
            </button>
            <button onClick={handleCalendar}
              className="py-2.5 px-3 rounded-xl text-sm font-medium border border-blue-200 text-blue-500 hover:bg-blue-50">
              📅
            </button>
          </>
        )}
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Hapus Nota?</h3>
            <p className="text-sm text-gray-500 mb-4">Nota <strong>{nota.notaNo}</strong> dan semua data terkait akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Batal</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium disabled:opacity-50">
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <NotaForm editNota={nota} onClose={async () => { setShowEdit(false); await refreshNota() }} />
      )}
      {showPayment && (
        <PaymentForm nota={nota} onClose={async () => { setShowPayment(false); await refreshNota() }} />
      )}
      {editPayment && (
        <PaymentForm nota={nota} editPayment={editPayment} onClose={async () => { setEditPayment(null); await refreshNota() }} />
      )}
      {showRetur && (
        <ReturForm nota={nota} onClose={async () => { setShowRetur(false); await refreshNota() }} />
      )}
    </div>
  )
}
