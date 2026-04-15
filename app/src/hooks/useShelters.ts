import { useState, useEffect, useCallback } from 'react'
import { fetchShelters } from '../services/cmsApi'
import { MOCK_SHELTERS } from '../data/mockShelters'
import type { Shelter } from '../types'
import { CMS } from '../config'

const REFRESH_INTERVAL = 60_000 // 1 minute

export function useShelters() {
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!CMS.enabled) {
      setShelters(MOCK_SHELTERS)
      setIsLoading(false)
      return
    }
    try {
      const data = await fetchShelters()
      setShelters(data.length > 0 ? data : MOCK_SHELTERS)
      setError(null)
    } catch (err) {
      console.warn('[useShelters] fetch failed', err)
      if (shelters.length === 0) setShelters(MOCK_SHELTERS)
      setError('データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load()
    const timer = setInterval(() => { void load() }, REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [load])

  return { shelters, isLoading, error, refresh: load }
}
