'use client'
import { useState, useMemo } from 'react'
import { useApp } from '@/lib/store'
import { fmtGram, fmtDate, getDebtStatus, getNetAfterRetur, sortNotas } from '@/lib/helpers'
import NotaDetail from './NotaDetail'
import NotaForm from './NotaForm'
import type { NotaWithRelations } from '@/lib/types'

type Filter = 'all' | 'sale' | 'stock_in' | 'stock_return'

export default function NotaTab() {
  const { notas } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [selectedNota, setSelectedNota] = useState<NotaWithRelations | null>(null)
  const [showForm, setShowForm] = useState(false)

  const filtered = useMemo(() => {
    let list = sortNotas(notas)
    if (filter !== 'all') list = list.filter(n => n.type === filter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(n =>
        n.notaNo.toLowerCase().includes(q) ||
        (n.customerName || '').toLowerCase().includes(q) ||
        (n.customerStore || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [notas, filter, search])

  const filterTabs: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Semua' },
    { id: 'sale', label: 'Penjualan' },
    { id: 'stock_in', label: 'Stok Masuk' },
    { id: 'stock_return', label: 'Retur' },
  ]

  const typeBadge: Record<string, { label: string; cls: string }> = {
    sale: { label: 'Jual', cls: 'bg-amber-200 text-amber-900 border border-amber-400' },
    stock_in: { label: 'Masuk', cls: 'bg-blue-200 text-blue-900 border border-blue-400' },
    stock_return: { label: 'Retur', cls: 'bg-purple-200 text-purple-900 border border-purple-400' },
  }

  function getStatusBadge(nota: NotaWithRelations) {
    if (nota.type !== 'sale') return null
    const debt = getDebtStatus(nota, nota.payments || [], nota.returs || [])
    if (debt.status === 'lunas') return { label: 'Lunas', cls: 'bg-green-200 text-green-900 border border-green-400' }
    if (debt.status === 'sebagian') return { label: 'Sebagian', cls: 'bg-yellow-200 text-yellow-900 border border-yellow-400' }
    return { label: 'Belum Bayar', cls: 'bg-red-200 text-red-900 border border-red-400' }
  }

  return (
    <div className="min-h-screen bg-[#ede0c4]">
      <header className="sticky top-0 z-30 bg-gradient-to-r from-amber-800 to-amber-600 px-4 pt-3 pb-0 shadow-md">
        <h1 className="font-cinzel text-lg font-bold text-amber-100 tracking-wider mb-2">NOTA</h1>
        <input
          type="text"
          placeholder="Cari nomor nota / customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-100 border-2 border-gray-300 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:border-amber-500 text-gray-900 placeholder-gray-500"
        />
        <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors ${
                filter === tab.id
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-amber-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-2">📋</p>
            <p>Tidak ada nota</p>
          </div>
        )}
        {filtered.map(nota => {
          const tb = typeBadge[nota.type]
          const sb = getStatusBadge(nota)
          return (
            <button
              key={nota.id}
              onClick={() => setSelectedNota(nota)}
              className="w-full bg-white rounded-xl p-3 border border-amber-200 border-l-4 border-l-amber-500 shadow-sm text-left flex items-center gap-3 hover:border-amber-400 transition-colors active:bg-amber-50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-cinzel text-sm font-bold text-gray-900">{nota.notaNo}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tb.cls}`}>{tb.label}</span>
                  {sb && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sb.cls}`}>{sb.label}</span>}
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">{nota.customerStore || nota.customerName || '—'}</p>
                {nota.customerStore && nota.customerName && (
                  <p className="text-xs text-gray-500 truncate">{nota.customerName}</p>
                )}
                <p className="text-[11px] text-gray-500">{fmtDate(nota.date)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-cormorant text-base font-bold text-amber-700">{fmtGram(getNetAfterRetur(nota.returs || [], nota.totalGross, nota.totalNet).net)}</p>
                <p className="text-[10px] text-gray-500">B.Bersih</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-amber-700 transition-colors z-30 active:scale-95"
      >
        +
      </button>

      {selectedNota && (
        <NotaDetail nota={selectedNota} onClose={() => setSelectedNota(null)} />
      )}
      {showForm && (
        <NotaForm onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
