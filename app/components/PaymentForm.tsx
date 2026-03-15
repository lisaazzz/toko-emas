'use client'
import { useState, useMemo } from 'react'
import { useApp } from '@/lib/store'
import { todayStr, getDebtStatus, getNetAfterRetur, fmtRp } from '@/lib/helpers'
import toast from 'react-hot-toast'
import type { NotaWithRelations, PaymentWithParsed, CucianItem, PerhiasanItem } from '@/lib/types'

interface Props {
  nota: NotaWithRelations
  editPayment?: PaymentWithParsed
  onClose: () => void
}

export default function PaymentForm({ nota, editPayment, onClose }: Props) {
  const { userId } = useApp()
  const [date, setDate] = useState(editPayment?.date || todayStr())
  const [cucian, setCucian] = useState<CucianItem[]>(editPayment?.cucian || [])
  const [perhiasan, setPerhiasan] = useState<PerhiasanItem[]>(editPayment?.perhiasan || [])
  const [useCash, setUseCash] = useState(!!(editPayment?.cash_gram))
  const [goldPrice, setGoldPrice] = useState(editPayment?.gold_price || 0)
  const [cashMethod, setCashMethod] = useState(editPayment?.cash_method || 'cash')
  const [saving, setSaving] = useState(false)

  const payments = nota.payments || []
  const returs = nota.returs || []

  // Exclude current edit payment from totals
  const otherPayments = editPayment ? payments.filter(p => p.id !== editPayment.id) : payments
  const debt = getDebtStatus(nota, otherPayments, returs)
  const sisaSebelum = debt.effectiveRemaining

  const cucianGram = cucian.reduce((s, c) => s + (c.totalGram || 0), 0)
  const perhiasanGram = perhiasan.reduce((s, h) => s + (h.net || 0), 0)
  const cashGram = useCash ? Math.max(0, sisaSebelum - cucianGram - perhiasanGram) : 0
  const sisaSetelah = Math.max(0, sisaSebelum - cucianGram - perhiasanGram - cashGram)

  function addCucian() { setCucian(prev => [...prev, { totalGram: 0, pieces: 0 }]) }
  function updateCucian(i: number, field: keyof CucianItem, val: number) {
    setCucian(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: val }; return n })
  }
  function removeCucian(i: number) { setCucian(prev => prev.filter((_, idx) => idx !== i)) }

  function addPerh() { setPerhiasan(prev => [...prev, { gross: 0, pct: 75, net: 0 }]) }
  function updatePerh(i: number, field: keyof PerhiasanItem, val: number) {
    setPerhiasan(prev => {
      const n = [...prev]
      n[i] = { ...n[i], [field]: val }
      if (field === 'gross' || field === 'pct') {
        n[i].net = parseFloat((n[i].gross * n[i].pct / 100).toFixed(3))
      }
      return n
    })
  }
  function removePerh(i: number) { setPerhiasan(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleSave() {
    if (cucian.length === 0 && perhiasan.length === 0 && !useCash) {
      return toast.error('Minimal satu jenis pembayaran')
    }
    setSaving(true)
    try {
      const cash_rp = useCash && goldPrice > 0 ? cashGram * goldPrice : null
      const payload = {
        notaId: nota.id,
        userId,
        date,
        cucian,
        perhiasan,
        cash_rp,
        cash_gram: useCash ? cashGram : null,
        cash_method: useCash ? cashMethod : null,
        gold_price: useCash && goldPrice > 0 ? goldPrice : null,
      }
      const url = editPayment ? `/api/payments/${editPayment.id}` : '/api/payments'
      const method = editPayment ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error()
      toast.success(editPayment ? 'Pembayaran diupdate' : 'Pembayaran disimpan')
      onClose()
    } catch {
      toast.error('Gagal menyimpan pembayaran')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-60 flex flex-col">
      <div className="flex-1 overflow-y-auto bg-[#f8f5ee]">
        <header className="sticky top-0 bg-white border-b border-gold-100 px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
          <h2 className="font-cinzel text-base font-bold text-gold-700 flex-1">
            {editPayment ? 'Edit Pembayaran' : 'Tambah Pembayaran'}
          </h2>
          <button onClick={handleSave} disabled={saving}
            className="bg-amber-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? '...' : 'Simpan'}
          </button>
        </header>

        <div className="p-4 space-y-4">
          {/* Sisa preview */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
            <div className="flex justify-between text-sm">
              <span className="text-amber-600 font-medium">Sisa Tagihan</span>
              <span className="font-cormorant text-lg text-amber-700 font-semibold">{sisaSebelum.toFixed(3)} g</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <label className="text-xs text-gray-500 font-medium">Tanggal Bayar</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-300" />
          </div>

          {/* Cucian */}
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">1. Cucian (Emas Batangan)</h3>
              <button onClick={addCucian} className="text-amber-500 text-sm hover:text-amber-600">+ Tambah</button>
            </div>
            {cucian.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Belum ada cucian</p>}
            {cucian.map((c, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_32px] gap-2 mb-2 items-center">
                <div>
                  <label className="text-[10px] text-gray-400">Total Gram</label>
                  <input type="number" step="0.001" min="0" value={c.totalGram || ''} placeholder="0.000"
                    onChange={e => updateCucian(i, 'totalGram', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-amber-300 text-right" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400">Keping</label>
                  <input type="number" min="0" value={c.pieces || ''} placeholder="0"
                    onChange={e => updateCucian(i, 'pieces', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-amber-300 text-right" />
                </div>
                <button onClick={() => removeCucian(i)} className="text-red-300 hover:text-red-500 mt-4">✕</button>
              </div>
            ))}
            {cucian.length > 0 && (
              <div className="flex justify-between text-sm font-medium border-t border-gray-100 pt-2 mt-2">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-cormorant text-amber-700">{cucianGram.toFixed(3)} g</span>
              </div>
            )}
          </div>

          {/* Perhiasan */}
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">2. Perhiasan Bekas</h3>
              <button onClick={addPerh} className="text-amber-500 text-sm hover:text-amber-600">+ Tambah</button>
            </div>
            {perhiasan.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Belum ada perhiasan</p>}
            {perhiasan.map((h, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_80px_32px] gap-2 mb-2 items-center">
                <input type="number" step="0.001" min="0" value={h.gross || ''} placeholder="B.Kotor"
                  onChange={e => updatePerh(i, 'gross', parseFloat(e.target.value) || 0)}
                  className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-amber-300 text-right" />
                <select value={h.pct} onChange={e => updatePerh(i, 'pct', parseFloat(e.target.value))}
                  className="border border-gray-200 rounded-lg px-1 py-2 text-sm focus:outline-none focus:border-amber-300">
                  {[36, 40, 68, 73, 74, 75, 98].map(p => <option key={p} value={p}>{p}%</option>)}
                </select>
                <div className="border border-gray-100 rounded-lg px-2 py-2 text-sm bg-amber-50 text-amber-700 font-medium text-right">
                  {h.net.toFixed(3)}
                </div>
                <button onClick={() => removePerh(i)} className="text-red-300 hover:text-red-500">✕</button>
              </div>
            ))}
            {perhiasan.length > 0 && (
              <div className="flex justify-between text-sm font-medium border-t border-gray-100 pt-2 mt-2">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-cormorant text-amber-700">{perhiasanGram.toFixed(3)} g</span>
              </div>
            )}
          </div>

          {/* Cash */}
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">3. Cash / Transfer / Cek</h3>
              <button onClick={() => setUseCash(!useCash)}
                className={`w-10 h-6 rounded-full transition-colors ${useCash ? 'bg-amber-500' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${useCash ? 'translate-x-4' : ''}`} />
              </button>
            </div>
            {useCash && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">Sisa setelah cucian & perhiasan</span>
                    <span className="font-cormorant font-semibold">{cashGram.toFixed(3)} g</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Harga Emas (Rp/gram)</label>
                  <input type="number" min="0" value={goldPrice || ''} placeholder="Contoh: 1500000"
                    onChange={e => setGoldPrice(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-300 text-right" />
                  {goldPrice > 0 && cashGram > 0 && (
                    <p className="text-xs text-amber-600 mt-1 text-right">{fmtRp(cashGram * goldPrice)}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-500">Metode</label>
                  <div className="flex gap-2 mt-1">
                    {['cash', 'transfer', 'cek'].map(m => (
                      <button key={m} onClick={() => setCashMethod(m)}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium border capitalize transition-colors ${
                          cashMethod === m ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className={`rounded-2xl p-4 border ${sisaSetelah <= 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className="font-cinzel text-xs font-bold text-gray-500 mb-2 tracking-wide">RINGKASAN</h3>
            <div className="space-y-1 text-sm">
              {cucianGram > 0 && <div className="flex justify-between"><span>Cucian</span><span>{cucianGram.toFixed(3)} g</span></div>}
              {perhiasanGram > 0 && <div className="flex justify-between"><span>Perhiasan</span><span>{perhiasanGram.toFixed(3)} g</span></div>}
              {useCash && cashGram > 0 && <div className="flex justify-between"><span>Cash ({cashMethod})</span><span>{cashGram.toFixed(3)} g</span></div>}
              <div className={`flex justify-between font-bold border-t pt-1 mt-1 ${sisaSetelah <= 0 ? 'border-green-200 text-green-600' : 'border-gray-200'}`}>
                <span>Sisa Setelah Bayar</span>
                <span className="font-cormorant text-base">{sisaSetelah.toFixed(3)} g</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
