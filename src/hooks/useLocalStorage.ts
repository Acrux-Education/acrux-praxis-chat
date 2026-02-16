import { useState, useCallback } from 'react'

const STORAGE_PREFIX = 'acrux_chat_'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const prefixedKey = `${STORAGE_PREFIX}${key}`

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(prefixedKey)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T) => {
      setStoredValue(value)
      try {
        window.localStorage.setItem(prefixedKey, JSON.stringify(value))
      } catch {
        // Storage full or unavailable
      }
    },
    [prefixedKey]
  )

  return [storedValue, setValue]
}
