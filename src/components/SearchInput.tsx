import { useState, useEffect, useRef } from 'react'
import { SearchIcon } from '../icons'
import { TIMEOUTS } from '../constants'

interface SearchInputProps {
  onSearch: (query: string) => void
  /** Called with the current query when the user presses Enter. */
  onSubmit?: (query: string) => void
  placeholder?: string
}

export function SearchInput({ onSearch, onSubmit, placeholder = 'Search for help...' }: SearchInputProps) {
  const [value, setValue] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearch(value.trim())
    }, TIMEOUTS.SEARCH_DEBOUNCE)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, onSearch])

  return (
    <div className="acx:relative">
      <SearchIcon className="acx:absolute acx:left-3 acx:top-1/2 -acx-translate-y-1/2 acx:w-4 acx:h-4 acx:text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSubmit && value.trim()) {
            e.preventDefault()
            onSubmit(value.trim())
          }
        }}
        placeholder={placeholder}
        className="acx:w-full acx:pl-9 acx:pr-4 acx:py-2.5 acx:border acx:border-gray-200 acx:rounded-lg acx:text-sm acx:outline-none acx:focus:border-primary-500 acx:focus:ring-1 acx:focus:ring-primary-500 acx:transition-colors acx:bg-white"
      />
    </div>
  )
}
