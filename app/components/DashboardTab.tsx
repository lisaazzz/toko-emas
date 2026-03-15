'use client'
import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/lib/store'
import { fmtGram, fmtDate } from '@/lib/helpers'
import toast from 'react-hot-toast'

interface DashStats {
  inventaris: {
    totalMasukGross: number
    totalMasukNet: number
    totalReturKantorGross: number
    totalReturKantorNet: number
    sisaGross: number
    sisaNet: number
  }
  penjualan: {
    totalNota: number
    notasWithRetur: number
    totalJualGross: number
    totalJualNet: number
    totalPiutang: number
    jualHariIniGross: number
  }
  latestNotas: Array<{
    id: string
    notaNo: string
    date: string
    type: string
    customerName?: string
    customerStore?: string
    totalGross: number
    totalNet: number
  }>
}

export default function DashboardTab() {
  const { userId } = useApp()
  const [stats, setStats] = useState<DashStats | null>(null)
  const [showBackup, setShowBackup] = useState(false)
  const [importPreview, setImportPreview] = useState<any>(null)
  const [importData, setImportData] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { refreshAll } = useApp()

  useEffect(() => {
    if (userId) loadStats()
  }, [userId])

  async function loadStats() {
    const r = await fetch(`/api/dashboard?userId=${userId}`)
    const data = await r.json()
    setStats(data)
  }

  async function handleExport() {
    const r = await fetch(`/api/backup?userId=${userId}`)
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `toko-emas-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Backup berhasil diunduh')
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        setImportData(data)
        setImportPreview({
          customers: data.customers?.length || 0,
          notas: data.notas?.length || 0,
          payments: data.payments?.length || 0,
          returs: data.returs?.length || 0,
          timbang: data.timbang?.length || 0,
          exportedAt: data.exportedAt,
        })
      } catch {
        toast.error('File tidak valid')
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!importData) return
    const r = await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...importData, userId }),
    })
    if (r.ok) {
      toast.success('Data berhasil diimpor!')
      setShowBackup(false)
      setImportPreview(null)
      setImportData(null)
      await refreshAll()
      await loadStats()
    } else {
      toast.error('Gagal mengimpor data')
    }
  }

  const typeLabel: Record<string, string> = { sale: 'Jual', stock_in: 'Masuk', stock_return: 'Retur Kantor' }
  const typeBadge: Record<string, string> = {
    sale: 'bg-amber-200 text-amber-900 border border-amber-400',
    stock_in: 'bg-blue-200 text-blue-900 border border-blue-400',
    stock_return: 'bg-purple-200 text-purple-900 border border-purple-400',
  }

  return (
    <div className="min-h-screen bg-[#ede0c4]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-amber-800 to-amber-600 px-4 py-3 flex items-center justify-between shadow-md">
        <div>
          <h1 className="font-cinzel text-xl font-bold text-amber-100 tracking-wider">TOKO EMAS</h1>
          <p className="text-xs text-amber-200 font-dm">Manajemen Perhiasan</p>
        </div>
        <button
          onClick={() => setShowBackup(true)}
          className="w-10 h-10 rounded-full bg-amber-700 border border-amber-400 flex items-center justify-center text-lg hover:bg-amber-600 transition-colors"
          title="Backup & Restore"
        >
          💾
        </button>
      </header>

      <div className="p-4 space-y-4">
        {/* Inventaris Panel */}
        <div className="bg-blue-700 rounded-2xl p-4">
          <h2 className="font-cinzel text-sm font-semibold text-white mb-3 tracking-wide">INVENTARIS STOK</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Nota Masuk" value={`${stats?.inventaris ? (stats.inventaris.totalMasukGross > 0 ? fmtGram(stats.inventaris.totalMasukGross) : '0.000 g') : '—'}`} sub="B.Kotor" color="blue" />
            <StatCard label="Retur ke Kantor" value={stats?.inventaris ? fmtGram(stats.inventaris.totalReturKantorGross) : '—'} sub="B.Kotor" color="blue" />
            <div className="col-span-2 bg-blue-900 rounded-xl p-3 border border-blue-400">
              <p className="text-xs text-blue-200 font-medium mb-1">Sisa Stok</p>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-blue-300">B.Kotor</p>
                  <p className="font-cormorant text-lg font-semibold text-white">{stats ? fmtGram(stats.inventaris.sisaGross) : '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-300">B.Bersih</p>
                  <p className="font-cormorant text-lg font-semibold text-white">{stats ? fmtGram(stats.inventaris.sisaNet) : '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Penjualan Panel */}
        <div className="bg-amber-700 rounded-2xl p-4">
          <h2 className="font-cinzel text-sm font-semibold text-white mb-3 tracking-wide">PENJUALAN</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Nota Jual" value={`${stats?.penjualan.totalNota ?? 0} nota`} color="gold" />
            <StatCard label="Ada Retur" value={`${stats?.penjualan.notasWithRetur ?? 0} nota`} color="gold" />
            <StatCard label="B.Kotor Terjual" value={stats ? fmtGram(stats.penjualan.totalJualGross) : '—'} sub="setelah retur" color="gold" />
            <StatCard label="B.Bersih Terjual" value={stats ? fmtGram(stats.penjualan.totalJualNet) : '—'} sub="setelah retur" color="gold" />
            <div className="col-span-2 bg-amber-900 rounded-xl p-3 border border-amber-400">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-amber-200 font-medium">Total Piutang</p>
                  <p className="font-cormorant text-lg font-semibold text-red-300">{stats ? fmtGram(stats.penjualan.totalPiutang) : '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-amber-200 font-medium">Jual Hari Ini</p>
                  <p className="font-cormorant text-lg font-semibold text-white">{stats ? fmtGram(stats.penjualan.jualHariIniGross) : '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Notas */}
        <div>
          <h2 className="font-cinzel text-sm font-semibold text-gray-700 mb-2 tracking-wide px-1">NOTA TERBARU</h2>
          <div className="space-y-2">
            {stats?.latestNotas.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-6">Belum ada nota</p>
            )}
            {stats?.latestNotas.map(n => (
              <div key={n.id} className="bg-white rounded-xl p-3 border border-amber-200 border-l-4 border-l-amber-500 flex items-center gap-3 shadow-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-cinzel text-xs font-bold text-gray-900">{n.notaNo}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeBadge[n.type]}`}>{typeLabel[n.type]}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{n.customerStore || n.customerName || '—'}</p>
                  <p className="text-[11px] text-gray-500">{fmtDate(n.date)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-cormorant text-base font-bold text-amber-700">{fmtGram(n.totalNet)}</p>
                  <p className="text-[10px] text-gray-500">B.Bersih</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Backup Modal */}
      {showBackup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 animate-fadeIn">
            <h3 className="font-cinzel text-lg font-bold text-gray-800 mb-4">Backup & Restore</h3>
            <div className="space-y-3">
              <button onClick={handleExport} className="w-full bg-amber-700 text-white rounded-xl py-3 font-medium border border-amber-400 hover:bg-amber-800 transition-colors">
                💾 Export Backup (JSON)
              </button>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-sm text-gray-500 mb-2">Import dari file backup:</p>
                <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-gray-500 hover:border-amber-300 hover:text-amber-600 transition-colors">
                  📂 Pilih File JSON
                </button>
              </div>
              {importPreview && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                  <p className="font-medium text-amber-700 mb-1">Preview Data:</p>
                  {importPreview.exportedAt && <p className="text-xs text-gray-500 mb-1">Dibuat: {new Date(importPreview.exportedAt).toLocaleString('id-ID')}</p>}
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                    <span>Customers: {importPreview.customers}</span>
                    <span>Notas: {importPreview.notas}</span>
                    <span>Payments: {importPreview.payments}</span>
                    <span>Returs: {importPreview.returs}</span>
                  </div>
                  <p className="text-xs text-red-500 mt-2">⚠ Data saat ini akan ditimpa!</p>
                  <button onClick={handleImport} className="mt-2 w-full bg-red-500 text-white rounded-lg py-2 font-medium hover:bg-red-600">
                    Konfirmasi Import
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => { setShowBackup(false); setImportPreview(null); setImportData(null) }} className="mt-4 w-full text-gray-400 py-2 text-sm hover:text-gray-600">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: 'blue' | 'gold' }) {
  return (
    <div className={`rounded-xl p-3 border ${color === 'blue' ? 'bg-blue-800 border-blue-500' : 'bg-amber-800 border-amber-500'}`}>
      <p className={`text-xs font-medium mb-1 ${color === 'blue' ? 'text-blue-200' : 'text-amber-200'}`}>{label}</p>
      <p className="font-cormorant text-base font-semibold text-white">{value}</p>
      {sub && <p className="text-[10px] text-white/60">{sub}</p>}
    </div>
  )
}
