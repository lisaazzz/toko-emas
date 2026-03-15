'use client'
import { useState, useMemo } from 'react'
import { useApp } from '@/lib/store'
import { todayStr, fmtDate, getNetAfterRetur } from '@/lib/helpers'
import toast from 'react-hot-toast'
import type { TimbangRecord } from '@/lib/store'

function emptyGo() { return { rol: 0, kotak: 0, packing: 0 } }
function emptyBack() { return { rol: 0, kotak: 0, packing: 0, plastikAmbil: 0, plastikBawa: 0 } }

export default function TimbangTab() {
  const { userId, notas, timbangList, loadTimbang } = useApp()
  const [date, setDate] = useState(todayStr())
  const [go, setGo] = useState(emptyGo())
  const [back, setBack] = useState(emptyBack())
  const [saving, setSaving] = useState(false)
  const [editRecord, setEditRecord] = useState<TimbangRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TimbangRecord | null>(null)

  const goTotal = go.rol + go.kotak + go.packing
  const backTotal = back.rol + back.kotak + back.packing + back.plastikAmbil - back.plastikBawa
  const selisih = goTotal - backTotal

  // B.Kotor from nota sales for selected date (after retur customer)
  const bKotorNotaHariIni = useMemo(() => {
    const salesOnDate = notas.filter(n => n.type === 'sale' && n.date === date)
    return salesOnDate.reduce((s, n) => {
      const after = getNetAfterRetur(n.returs || [], n.totalGross, n.totalNet)
      return s + after.gross
    }, 0)
  }, [notas, date])

  const selisihFisik = bKotorNotaHariIni - selisih

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        userId,
        date,
        go: { ...go, total: goTotal },
        back: { ...back, total: backTotal },
        selisih,
        selisihFisik,
      }
      const r = await fetch('/api/timbang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error()
      await loadTimbang()
      toast.success('Timbang berhasil disimpan')
      // Reset
      setDate(todayStr())
      setGo(emptyGo())
      setBack(emptyBack())
    } catch {
      toast.error('Gagal menyimpan timbang')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await fetch(`/api/timbang/${deleteTarget.id}`, { method: 'DELETE' })
    await loadTimbang()
    toast.success('Data timbang dihapus')
    setDeleteTarget(null)
  }

  function openEdit(t: TimbangRecord) {
    setEditRecord(t)
    setDate(t.date)
    setGo({ rol: t.go.rol, kotak: t.go.kotak, packing: t.go.packing })
    setBack({ rol: t.back.rol, kotak: t.back.kotak, packing: t.back.packing, plastikAmbil: t.back.plastikAmbil, plastikBawa: t.back.plastikBawa })
  }

  async function handleEditSave() {
    if (!editRecord) return
    setSaving(true)
    try {
      const payload = {
        go: { ...go, total: goTotal },
        back: { ...back, total: backTotal },
        selisih,
        selisihFisik,
      }
      const r = await fetch(`/api/timbang/${editRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error()
      await loadTimbang()
      toast.success('Data timbang diupdate')
      setEditRecord(null)
      setDate(todayStr())
      setGo(emptyGo())
      setBack(emptyBack())
    } catch {
      toast.error('Gagal mengupdate')
    } finally {
      setSaving(false)
    }
  }

  function InputRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-700">{label}</label>
        <input type="number" step="0.001" min="0" value={value || ''} placeholder="0"
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-28 border-2 border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:border-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#ede0c4]">
      <header className="sticky top-0 z-30 bg-gradient-to-r from-amber-800 to-amber-600 px-4 py-3 shadow-md">
        <h1 className="font-cinzel text-lg font-bold text-amber-100 tracking-wider">TIMBANG HARIAN</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Date */}
        <div className="bg-white rounded-2xl p-4 shadow-md border border-amber-200">
          <label className="text-xs text-gray-600 font-medium">Tanggal</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="mt-1 w-full border-2 border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
        </div>

        {/* Timbang Pergi */}
        <div className="bg-white rounded-2xl p-4 space-y-3 shadow-md border border-amber-200">
          <h3 className="font-cinzel text-sm font-bold text-blue-700 tracking-wide">TIMBANG PERGI</h3>
          <InputRow label="Berat Rol (g)" value={go.rol} onChange={v => setGo(p => ({ ...p, rol: v }))} />
          <InputRow label="Berat Kotak (g)" value={go.kotak} onChange={v => setGo(p => ({ ...p, kotak: v }))} />
          <InputRow label="Berat Packing (g)" value={go.packing} onChange={v => setGo(p => ({ ...p, packing: v }))} />
          <div className="flex items-center justify-between border-t border-gray-200 pt-2">
            <span className="text-sm font-bold text-blue-700">Total Timbang Pergi</span>
            <span className="font-cormorant text-lg font-semibold text-blue-800">{goTotal.toFixed(3)} g</span>
          </div>
        </div>

        {/* Timbang Pulang */}
        <div className="bg-white rounded-2xl p-4 space-y-3 shadow-md border border-amber-200">
          <h3 className="font-cinzel text-sm font-bold text-purple-700 tracking-wide">TIMBANG PULANG</h3>
          <InputRow label="Berat Rol (g)" value={back.rol} onChange={v => setBack(p => ({ ...p, rol: v }))} />
          <InputRow label="Berat Kotak (g)" value={back.kotak} onChange={v => setBack(p => ({ ...p, kotak: v }))} />
          <InputRow label="Berat Packing (g)" value={back.packing} onChange={v => setBack(p => ({ ...p, packing: v }))} />
          <InputRow label="Plastik Diambil (g)" value={back.plastikAmbil} onChange={v => setBack(p => ({ ...p, plastikAmbil: v }))} />
          <InputRow label="Plastik Dibawa Pulang (g)" value={back.plastikBawa} onChange={v => setBack(p => ({ ...p, plastikBawa: v }))} />
          <div className="flex items-center justify-between border-t border-gray-200 pt-2">
            <span className="text-sm font-bold text-purple-700">Total Timbang Pulang</span>
            <span className="font-cormorant text-lg font-semibold text-purple-800">{backTotal.toFixed(3)} g</span>
          </div>
        </div>

        {/* Kalkulasi */}
        <div className="bg-amber-700 rounded-2xl p-4 space-y-2">
          <h3 className="font-cinzel text-sm font-semibold text-white tracking-wide mb-2">KALKULASI</h3>
          <div className="flex justify-between text-sm">
            <span className="text-amber-100">Selisih Timbang (Pergi - Pulang)</span>
            <span className="font-cormorant font-semibold text-white">{selisih.toFixed(3)} g</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-amber-100">B.Kotor dari Nota ({date})</span>
            <span className="font-cormorant font-semibold text-white">{bKotorNotaHariIni.toFixed(3)} g</span>
          </div>
          <div className={`flex justify-between text-sm font-bold border-t border-amber-500 pt-2 mt-1 ${Math.abs(selisihFisik) < 0.001 ? 'text-green-300' : 'text-orange-300'}`}>
            <span>Selisih Fisik</span>
            <span className="font-cormorant text-lg">{selisihFisik.toFixed(3)} g</span>
          </div>
        </div>

        <button onClick={editRecord ? handleEditSave : handleSave} disabled={saving}
          className="w-full bg-amber-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50">
          {saving ? 'Menyimpan...' : editRecord ? 'Update Timbang' : 'Simpan Timbang'}
        </button>
        {editRecord && (
          <button onClick={() => { setEditRecord(null); setDate(todayStr()); setGo(emptyGo()); setBack(emptyBack()) }}
            className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-2xl text-sm font-medium">
            Batal Edit
          </button>
        )}

        {/* History */}
        {timbangList.length > 0 && (
          <div>
            <h3 className="font-cinzel text-sm font-semibold text-gray-700 tracking-wide mb-2 px-1">RIWAYAT</h3>
            <div className="space-y-2">
              {timbangList.map(t => (
                <div key={t.id} className="bg-white rounded-xl p-3 border border-amber-200 border-l-4 border-l-amber-500 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{fmtDate(t.date)}</p>
                      <p className="text-xs text-gray-500">Pergi: {t.go.total.toFixed(3)} g → Pulang: {t.back.total.toFixed(3)} g</p>
                      <p className={`text-sm font-medium mt-0.5 ${Math.abs(t.selisihFisik) < 0.001 ? 'text-green-600' : 'text-orange-600'}`}>
                        Selisih Fisik: {t.selisihFisik.toFixed(3)} g
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => openEdit(t)} className="text-xs text-blue-600 px-2 py-1 rounded border-2 border-blue-400 bg-blue-50 font-semibold hover:bg-blue-100">Edit</button>
                      <button onClick={() => setDeleteTarget(t)} className="text-xs text-red-600 px-2 py-1 rounded border-2 border-red-400 bg-red-50 font-semibold hover:bg-red-100">Hapus</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Hapus Data Timbang?</h3>
            <p className="text-sm text-gray-500 mb-4">Data timbang tanggal <strong>{fmtDate(deleteTarget.date)}</strong> akan dihapus.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 text-sm">Batal</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
