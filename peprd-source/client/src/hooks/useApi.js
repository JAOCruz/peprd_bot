import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

export function useApi(path, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    api.get(path)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [path])

  useEffect(() => { reload() }, [reload, ...deps])

  return { data, loading, error, reload }
}
