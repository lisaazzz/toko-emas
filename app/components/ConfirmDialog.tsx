'use client'
import { useEffect } from 'react'

interface Props {
  open: boolean
  title?: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** 'danger' (red) | 'warning' (orange) | 'primary' (gold) — default 'danger' */
  variant?: 'danger' | 'warning' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Reusable confirm / delete confirmation dialog.
 *
 * Usage:
 *   <ConfirmDialog
 *     open={showDelete}
 *     title="Hapus Nota?"
 *     message={<>Nota <strong>AA 00001</strong> akan dihapus permanen.</>}
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowDelete(false)}
 *   />
 */
export default function ConfirmDialog({
  open,
  title = 'Konfirmasi',
  message,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onCancel, onConfirm])

  // Prevent body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const confirmCls =
    variant === 'danger'
      ? 'bg-red-500 hover:bg-red-600 text-white'
      : variant === 'warning'
      ? 'bg-orange-500 hover:bg-orange-600 text-white'
      : 'bg-amber-500 hover:bg-amber-600 text-white'

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      aria-modal="true"
      role="alertdialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative z-10 bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl animate-fadeIn">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
            variant === 'danger'
              ? 'bg-red-50'
              : variant === 'warning'
              ? 'bg-orange-50'
              : 'bg-amber-50'
          }`}
        >
          <span className="text-2xl">
            {variant === 'danger' ? '🗑' : variant === 'warning' ? '⚠️' : '❓'}
          </span>
        </div>

        <h3 className="font-cinzel text-base font-bold text-gray-800 text-center mb-2">
          {title}
        </h3>

        <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${confirmCls}`}
          >
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
