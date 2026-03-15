'use client'

interface Props {
  active: string
  onChange: (tab: any) => void
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'nota', label: 'Nota', icon: '📋' },
  { id: 'customer', label: 'Customer', icon: '👥' },
  { id: 'timbang', label: 'Timbang', icon: '⚖️' },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[768px] mx-auto bg-white border-t-2 border-amber-400 shadow-[0_-4px_20px_rgba(180,130,20,0.25)] z-40">
      <div className="flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all ${
              active === tab.id
                ? 'text-amber-700 bg-amber-50'
                : 'text-gray-500 hover:text-amber-600 hover:bg-amber-50/60'
            }`}
          >
            {active === tab.id && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-amber-500 rounded-b-full" />
            )}
            <span className={`text-xl leading-none transition-transform ${active === tab.id ? 'scale-110' : ''}`}>{tab.icon}</span>
            <span className={`text-[11px] ${active === tab.id ? 'font-bold text-amber-700' : 'font-medium text-gray-500'}`}>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
