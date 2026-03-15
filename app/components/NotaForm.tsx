'use client'
import { useState, useMemo } from 'react'
import { useApp } from '@/lib/store'
import { todayStr } from '@/lib/helpers'
import toast from 'react-hot-toast'
import type { NotaItem, CustomerType, NotaWithRelations } from '@/lib/types'

interface Props {
  onClose: () => void
  editNota?: NotaWithRelations
}

export default function NotaForm({ onClose, editNota }: Props) {
  const { userId, customers, loadNotas } = useApp()
  const [date, setDate] = useState(editNota?.date || todayStr())
  const [type, setType] = useState<'sale' | 'stock_in' | 'stock_return'>(
    (editNota?.type as any) || 'sale'
  )
  const [customerId, setCustomerId] = useState(editNota?.customerId || '')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustPicker, setShowCustPicker] = useState(false)
  const [items, setItems] = useState<NotaItem[]>(
    editNota?.items || [{ gross: 0, pct: 75, net: 0 }]
  )
  const [catatan, setCatatan] = useState(editNota?.catatan || '')
  const [saving, setSaving] = useState(false)

  const selectedCustomer = customers.find(c => c.id === customerId)

  const sortedCustomers = useMemo(() => {
    const withStore = customers.filter(c => c.store).sort((a, b) => {
      const s = (a.store || '').localeCompare(b.store || '')
      return s !== 0 ? s : a.name.localeCompare(b.name)
    })
    const withoutStore = customers.filter(c => !c.store).sort((a, b) => a.name.localeCompare(b.name))
    return [...withStore, ...withoutStore]
  }, [customers])

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return sortedCustomers
    const q = customerSearch.toLowerCase()
    return sortedCustomers.filter(c =>
      c.name.toLowerCase().includes(q) || (c.store || '').toLowerCase().includes(q)
    )
  }, [sortedCustomers, customerSearch])

  function updateItem(i: number, field: keyof NotaItem, val: number) {
    setItems(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      if (field === 'gross' || field === 'pct') {
        next[i].net = parseFloat((next[i].gross * next[i].pct / 100).toFixed(3))
      }
      return next
    })
  }

  function addRow() {
    setItems(prev => [...prev, { gross: 0, pct: 75, net: 0 }])
  }

  function removeRow(i: number) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  const totalGross = items.reduce((s, it) => s + (it.gross || 0), 0)
  const totalNet = items.reduce((s, it) => s + (it.net || 0), 0)

  async function handleSave() {
    if (items.some(it => !it.gross)) return toast.error('Berat kotor harus diisi')
    if (type === 'sale' && !customerId) return toast.error('Pilih customer terlebih dahulu')
    setSaving(true)
    try {
      const cust = customers.find(c => c.id === customerId)
      const payload = {
        userId,
        date,
        type,
        customerId: customerId || null,
        customerName: cust?.name || null,
        customerStore: cust?.store || null,
        items,
        totalGross,
        totalNet,
        catatan,
      }
      const url = editNota ? `/api/notas/${editNota.id}` : '/api/notas'
      const method = editNota ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error('Failed')
      await loadNotas()
      toast.success(editNota ? 'Nota berhasil diupdate' : 'Nota berhasil dibuat')
      onClose()
    } catch {
      toast.error('Gagal menyimpan nota')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col">
      <div className="flex-1 overflow-y-auto bg-[#f8f5ee]">
        <header className="sticky top-0 bg-white border-b border-gold-100 px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          <h2 className="font-cinzel text-base font-bold text-gold-700 tracking-wide flex-1">
            {editNota ? 'Edit Nota' : 'Buat Nota Baru'}
          </h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-amber-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </header>

        <div className="p-4 space-y-4">
          {/* Date + Type */}
          <div className="bg-white rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Tanggal</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Jenis Nota</label>
              <div className="flex gap-2 mt-1">
                {(['sale', 'stock_in', 'stock_return'] as const).map(t => {
                  const label = { sale: 'Penjualan', stock_in: 'Stok Masuk', stock_return: 'Retur Kantor' }[t]
                  return (
                    <button key={t} onClick={() => setType(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        type === t ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Customer (sale only) */}
          {type === 'sale' && (
            <div className="bg-white rounded-2xl p-4">
              <label className="text-xs text-gray-500 font-medium">Customer</label>
              <button
                onClick={() => setShowCustPicker(true)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-left text-sm hover:border-amber-300 transition-colors"
              >
                {selectedCustomer ? (
                  <span>
                    <span className="font-medium text-gray-800">{selectedCustomer.store || selectedCustomer.name}</span>
                    {selectedCustomer.store && <span className="text-gray-400 text-xs ml-1">({selectedCustomer.name})</span>}
                  </span>
                ) : (
                  <span className="text-gray-400">Pilih customer...</span>
                )}
              </button>
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Daftar Barang</h3>
              <button onClick={addRow} className="text-amber-500 text-sm font-medium hover:text-amber-600">+ Tambah</button>
            </div>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_80px_80px_32px] gap-2 text-xs text-gray-400 px-1">
                <span>B.Kotor (g)</span><span>Kadar %</span><span>B.Bersih (g)</span><span></span>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center">
                  <input
                    type="number" step="0.001" min="0"
                    value={item.gross || ''}
                    onChange={e => updateItem(i, 'gross', parseFloat(e.target.value) || 0)}
                    placeholder="0.000"
                    className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-amber-300 text-right"
                  />
                  <input
                    type="number" step="0.1" min="0" max="100"
                    value={item.pct || ''}
                    onChange={e => updateItem(i, 'pct', parseFloat(e.target.value) || 0)}
                    placeholder="75"
                    className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-amber-300 text-right"
                  />
                  <div className="border border-gray-100 rounded-lg px-2 py-2 text-sm text-amber-700 font-medium bg-amber-50 text-right">
                    {item.net.toFixed(3)}
                  </div>
                  <button onClick={() => removeRow(i)} disabled={items.length === 1}
                    className="text-red-300 hover:text-red-500 text-sm disabled:opacity-20 text-center">✕</button>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total B.Kotor</span>
                <span className="font-cormorant font-semibold">{totalGross.toFixed(3)} g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total B.Bersih</span>
                <span className="font-cormorant font-semibold">{totalNet.toFixed(3)} g</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-1.5 mt-1.5">
                <span className="text-amber-600">Total Tagihan</span>
                <span className="font-cormorant text-amber-700 text-base">{totalNet.toFixed(3)} g</span>
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div className="bg-white rounded-2xl p-4">
            <label className="text-xs text-gray-500 font-medium">Catatan (opsional)</label>
            <textarea value={catatan} onChange={e => setCatatan(e.target.value)}
              placeholder="Tambahkan catatan..."
              rows={3}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-300 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Customer Picker Modal */}
      {showCustPicker && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">Pilih Customer</h3>
                <button onClick={() => setShowCustPicker(false)} className="text-gray-400">✕</button>
              </div>
              <input type="text" placeholder="Cari customer..." value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-300"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredCustomers.map(c => (
                <button key={c.id} onClick={() => { setCustomerId(c.id); setShowCustPicker(false); setCustomerSearch('') }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-amber-50 transition-colors ${customerId === c.id ? 'bg-amber-50' : ''}`}>
                  <p className="font-medium text-gray-800">{c.store || c.name}</p>
                  {c.store && <p className="text-xs text-gray-400">{c.name}</p>}
                </button>
              ))}
              {filteredCustomers.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">Tidak ada customer</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
