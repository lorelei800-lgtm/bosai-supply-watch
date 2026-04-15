import { useState, useEffect, useCallback } from 'react'
import { fetchAllLatestSupplies } from '../services/cmsApi'
import { MOCK_SUPPLIES } from '../data/mockShelters'
import type { SupplySnapshot } from '../types'
import { CMS } from '../config'

const REFRESH_INTERVAL = 60_000 // 1 minute

export function useSupplies() {
  const [suppliesMap, setSuppliesMap] = useState<Map<string, SupplySnapshot>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    if (!CMS.enabled) {
      const map = new Map<string, SupplySnapshot>()
      for (const snap of MOCK_SUPPLIES) map.set(snap.shelterId, snap)
      setSuppliesMap(map)
      setIsLoading(false)
      return
    }
    try {
      const map = await fetchAllLatestSupplies()
      setSuppliesMap(map)
    } catch (err) {
      console.warn('[useSupplies] fetch failed', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = setInterval(() => { void load() }, REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [load])

  return { suppliesMap, isLoading, refresh: load }
}
