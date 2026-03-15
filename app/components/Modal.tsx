'use client'
import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** 'sheet' slides up from bottom (default), 'center' floats in the middle */
  variant?: 'sheet' | 'center'
  /** Extra Tailwind classes for the inner panel */
  panelClassName?: string
}

/**
 * Reusable modal / bottom-sheet dialog.
 *
 * Usage:
 *   <Modal open={show} onClose={() => setShow(false)} title="Judul">
 *     ...content...
 *   </Modal>
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  variant = 'sheet',
  panelClassName = '',
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Prevent body scroll while modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const isSheet = variant === 'sheet'

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ alignItems: isSheet ? 'flex-end' : 'center', justifyContent: 'center' }}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-fadeIn"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={[
          'relative z-10 bg-white w-full',
          isSheet
            ? 'rounded-t-2xl max-h-[90vh] flex flex-col'
            : 'rounded-2xl mx-4 max-w-md max-h-[85vh] flex flex-col',
          'animate-fadeIn',
          panelClassName,
        ].join(' ')}
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
            <h3 className="font-cinzel text-base font-bold text-gold-700 tracking-wide">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        )}

        {!title && (
          /* Drag handle for sheet without title */
          isSheet ? (
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
          ) : (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors z-10"
              aria-label="Tutup"
            >
              ✕
            </button>
          )
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
