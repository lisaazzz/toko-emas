'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { NotaWithRelations, CustomerType } from './types'

interface TimbangRecord {
  id: number
  userId: string
  date: string
  go: { rol: number; kotak: number; packing: number; total: number }
  back: { rol: number; kotak: number; packing: number; plastikAmbil: number; plastikBawa: number; total: number }
  selisih: number
  selisihFisik: number
}

interface AppState {
  userId: string
  userName: string
  notas: NotaWithRelations[]
  customers: CustomerType[]
  timbangList: TimbangRecord[]
  loading: boolean
  loadNotas: () => Promise<void>
  loadCustomers: () => Promise<void>
  loadTimbang: () => Promise<void>
  refreshAll: () => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [notas, setNotas] = useState<NotaWithRelations[]>([])
  const [customers, setCustomers] = useState<CustomerType[]>([])
  const [timbangList, setTimbangList] = useState<TimbangRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/init')
      .then(r => r.json())
      .then(data => {
        setUserId(data.id)
        setUserName(data.name)
      })
  }, [])

  const loadNotas = useCallback(async () => {
    if (!userId) return
    const r = await fetch(`/api/notas?userId=${userId}`)
    const data = await r.json()
    setNotas(data)
  }, [userId])

  const loadCustomers = useCallback(async () => {
    if (!userId) return
    const r = await fetch(`/api/customers?userId=${userId}`)
    const data = await r.json()
    setCustomers(data)
  }, [userId])

  const loadTimbang = useCallback(async () => {
    if (!userId) return
    const r = await fetch(`/api/timbang?userId=${userId}`)
    const data = await r.json()
    setTimbangList(data)
  }, [userId])

  const refreshAll = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    await Promise.all([loadNotas(), loadCustomers(), loadTimbang()])
    setLoading(false)
  }, [userId, loadNotas, loadCustomers, loadTimbang])

  useEffect(() => {
    if (userId) {
      refreshAll()
    }
  }, [userId, refreshAll])

  return (
    <AppContext.Provider value={{ userId, userName, notas, customers, timbangList, loading, loadNotas, loadCustomers, loadTimbang, refreshAll }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export type { TimbangRecord }
