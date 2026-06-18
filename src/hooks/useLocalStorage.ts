import { Dispatch, SetStateAction, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    setStoredValue((currentValue) => {
      const valueToStore = value instanceof Function ? value(currentValue) : value
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
      return valueToStore
    })
  }

  return [storedValue, setValue]
}
