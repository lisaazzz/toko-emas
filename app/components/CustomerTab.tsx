'use client'
import { useState, useMemo } from 'react'
import { useApp } from '@/lib/store'
import toast from 'react-hot-toast'
import type { CustomerType } from '@/lib/types'

export default function CustomerTab() {
  const { customers, loadCustomers, userId } = useApp()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editCustomer, setEditCustomer] = useState<CustomerType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CustomerType | null>(null)

  // name field, store field, phone field for form
  const [formName, setFormName] = useState('')
  const [formStore, setFormStore] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const sorted = useMemo(() => {
    const withStore = customers.filter(c => c.store).sort((a, b) => {
      const s = (a.store || '').localeCompare(b.store || '')
      return s !== 0 ? s : a.name.localeCompare(b.name)
    })
    const withoutStore = customers.filter(c => !c.store).sort((a, b) => a.name.localeCompare(b.name))
    return [...withStore, ...withoutStore]
  }, [customers])

  const filtered = useMemo(() => {
    if (!search) return sorted
    const q = search.toLowerCase()
    return sorted.filter(c => c.name.toLowerCase().includes(q) || (c.store || '').toLowerCase().includes(q))
  }, [sorted, search])

  function openAdd() {
    setEditCustomer(null)
    setFormName('')
    setFormStore('')
    setFormPhone('')
    setShowForm(true)
  }

  function openEdit(c: CustomerType) {
    setEditCustomer(c)
    setFormName(c.name)
    setFormStore(c.store || '')
    setFormPhone(c.phone || '')
    setShowForm(true)
  }

  async function handleSave() {
    if (!formName.trim()) return toast.error('Nama harus diisi')
    setSaving(true)
    try {
      const url = editCustomer ? `/api/customers/${editCustomer.id}` : '/api/customers'
      const method = editCustomer ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: formName.trim(), store: formStore.trim() || null, phone: formPhone.trim() || null }),
      })
      if (!r.ok) throw new Error()
      await loadCustomers()
      toast.success(editCustomer ? 'Customer diupdate' : 'Customer ditambahkan')
      setShowForm(false)
    } catch {
      toast.error('Gagal menyimpan customer')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      const r = await fetch(`/api/customers/${deleteTarget.id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      await loadCustomers()
      toast.success('Customer dihapus')
      setDeleteTarget(null)
    } catch {
      toast.error('Gagal menghapus customer')
    }
  }

  return (
    <div className="min-h-screen bg-[#ede0c4]">
      <header className="sticky top-0 z-30 bg-gradient-to-r from-amber-800 to-amber-600 px-4 pt-3 pb-3 shadow-md">
        <h1 className="font-cinzel text-lg font-bold text-amber-100 tracking-wider mb-2">CUSTOMER</h1>
        <input type="text" placeholder="Cari nama / toko..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-100 border-2 border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-gray-900 placeholder-gray-500" />
      </header>

      <div className="p-4 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-2">👥</p>
            <p>Belum ada customer</p>
          </div>
        )}
        {filtered.map(c => (
          <div key={c.id} className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
              {(c.store || c.name).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">{c.store || c.name}</p>
              {c.store && <p className="text-xs text-gray-500 truncate">{c.name}</p>}
              {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => openEdit(c)} className="text-xs text-blue-700 border-2 border-blue-400 bg-blue-50 font-semibold px-2 py-1.5 rounded-lg hover:bg-blue-100">Edit</button>
              <button onClick={() => setDeleteTarget(c)} className="text-xs text-red-700 border-2 border-red-400 bg-red-50 font-semibold px-2 py-1.5 rounded-lg hover:bg-red-100">Hapus</button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button onClick={openAdd}
        className="fixed bottom-20 right-4 w-14 h-14 bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-amber-700 transition-colors z-30 active:scale-95">
        +
      </button>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-cinzel text-base font-bold text-amber-800">{editCustomer ? 'Edit Customer' : 'Tambah Customer'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Nama *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nama customer"
                  className="mt-1 w-full border-2 border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Nama Toko (opsional)</label>
                <input type="text" value={formStore} onChange={e => setFormStore(e.target.value)} placeholder="Toko Emas Sejahtera"
                  className="mt-1 w-full border-2 border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Telepon (opsional)</label>
                <input type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="08123456789"
                  className="mt-1 w-full border-2 border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 text-sm font-medium">Batal</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-amber-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-amber-700">
                  {saving ? '...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Hapus Customer?</h3>
            <p className="text-sm text-gray-500 mb-4"><strong>{deleteTarget.store || deleteTarget.name}</strong> akan dihapus.</p>
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
