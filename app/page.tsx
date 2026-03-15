'use client'
import { useState } from 'react'
import { AppProvider } from '@/lib/store'
import BottomNav from '@/app/components/BottomNav'
import DashboardTab from '@/app/components/DashboardTab'
import NotaTab from '@/app/components/NotaTab'
import CustomerTab from '@/app/components/CustomerTab'
import TimbangTab from '@/app/components/TimbangTab'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'nota' | 'customer' | 'timbang'>('dashboard')

  return (
    <AppProvider>
      <div className="min-h-screen bg-[#f8f5ee] pb-safe">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'nota' && <NotaTab />}
        {activeTab === 'customer' && <CustomerTab />}
        {activeTab === 'timbang' && <TimbangTab />}
        <BottomNav active={activeTab} onChange={setActiveTab} />
      </div>
    </AppProvider>
  )
}
