'use client'
import { useState } from 'react'
import { useApp } from '@/lib/store'
import { todayStr } from '@/lib/helpers'
import toast from 'react-hot-toast'
import type { NotaWithRelations, NotaItem } from '@/lib/types'

interface Props {
  nota: NotaWithRelations
  onClose: () => void
}

export default function ReturForm({ nota, onClose }: Props) {
  const { userId } = useApp()
  const [date, setDate] = useState(todayStr())
  const [note, setNote] = useState('')
  const [items, setItems] = useState<NotaItem[]>([{ gross: 0, pct: 75, net: 0 }])
  const [saving, setSaving] = useState(false)

  function updateItem(i: number, field: keyof NotaItem, val: number) {
    setItems(prev => {
      const n = [...prev]
      n[i] = { ...n[i], [field]: val }
      if (field === 'gross' || field === 'pct') {
        n[i].net = parseFloat((n[i].gross * n[i].pct / 100).toFixed(3))
      }
      return n
    })
  }

  function addRow() { setItems(prev => [...prev, { gross: 0, pct: 75, net: 0 }]) }
  function removeRow(i: number) { if (items.length > 1) setItems(prev => prev.filter((_, idx) => idx !== i)) }

  const totalGross = items.reduce((s, it) => s + (it.gross || 0), 0)
  const totalNet = items.reduce((s, it) => s + (it.net || 0), 0)

  async function handleSave() {
    if (items.some(it => !it.gross)) return toast.error('Berat kotor harus diisi')
    setSaving(true)
    try {
      const r = await fetch('/api/returs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notaId: nota.id, userId, date, note, items, totalGross, totalNet }),
      })
      if (!r.ok) throw new Error()
      toast.success('Retur berhasil disimpan')
      onClose()
    } catch {
      toast.error('Gagal menyimpan retur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-60 flex flex-col">
      <div className="flex-1 overflow-y-auto bg-[#f8f5ee]">
        <header className="sticky top-0 bg-white border-b border-gold-100 px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
          <h2 className="font-cinzel text-base font-bold text-gold-700 flex-1">↩ Retur Barang</h2>
          <button onClick={handleSave} disabled={saving}
            className="bg-purple-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? '...' : 'Simpan'}
          </button>
        </header>
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Tanggal Retur</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Catatan (opsional)</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Alasan retur..."
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-300" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Barang Dikembalikan</h3>
              <button onClick={addRow} className="text-purple-500 text-sm hover:text-purple-600">+ Tambah</button>
            </div>
            <div className="grid grid-cols-[1fr_80px_80px_32px] gap-2 text-xs text-gray-400 mb-1 px-1">
              <span>B.Kotor (g)</span><span>Kadar %</span><span>B.Bersih (g)</span><span></span>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center mb-2">
                <input type="number" step="0.001" min="0" value={item.gross || ''} placeholder="0.000"
                  onChange={e => updateItem(i, 'gross', parseFloat(e.target.value) || 0)}
                  className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-purple-300 text-right" />
                <input type="number" step="0.1" min="0" max="100" value={item.pct || ''} placeholder="75"
                  onChange={e => updateItem(i, 'pct', parseFloat(e.target.value) || 0)}
                  className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-purple-300 text-right" />
                <div className="border border-gray-100 rounded-lg px-2 py-2 text-sm bg-purple-50 text-purple-700 font-medium text-right">
                  {item.net.toFixed(3)}
                </div>
                <button onClick={() => removeRow(i)} disabled={items.length === 1} className="text-red-300 hover:text-red-500 disabled:opacity-20">✕</button>
              </div>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Total B.Kotor Retur</span><span className="font-cormorant font-semibold">{totalGross.toFixed(3)} g</span></div>
              <div className="flex justify-between text-sm font-bold"><span className="text-purple-600">Total B.Bersih Retur</span><span className="font-cormorant text-purple-700 text-base">{totalNet.toFixed(3)} g</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
