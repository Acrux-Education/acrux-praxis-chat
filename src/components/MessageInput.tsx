import { useState, useRef, useCallback } from 'react'
import type { WidgetMode } from '../types'
import { SendIcon, PaperclipIcon } from '../icons'
import { LIMITS } from '../constants'

interface MessageInputProps {
  onSend: (text: string) => void
  onTyping?: (isTyping: boolean) => void
  onFileUpload?: (files: FileList) => void
  mode: WidgetMode
  disabled?: boolean
}

export function MessageInput({ onSend, onTyping, onFileUpload, mode, disabled }: MessageInputProps) {
  const [text, setText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    onTyping?.(false)
  }, [text, disabled, onSend, onTyping])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length > LIMITS.MAX_MESSAGE_LENGTH) return
    setText(value)

    onTyping?.(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => onTyping?.(false), 2000)
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload?.(e.target.files)
      e.target.value = ''
    }
  }

  return (
    <div className="acx-border-t acx-border-gray-200 acx-bg-white acx-px-3 acx-py-2">
      <div className="acx-flex acx-items-end acx-gap-2">
        {mode === 'user' && onFileUpload && (
          <>
            <button
              onClick={handleFileClick}
              className="acx-p-1.5 acx-text-gray-400 hover:acx-text-gray-600 acx-transition-colors acx-flex-shrink-0"
              aria-label="Attach file"
              type="button"
            >
              <PaperclipIcon className="acx-w-5 acx-h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="acx-hidden"
              accept={LIMITS.ALLOWED_FILE_TYPES.join(',')}
              multiple
              onChange={handleFileChange}
            />
          </>
        )}

        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="acx-flex-1 acx-resize-none acx-border-0 acx-outline-none acx-text-sm acx-py-2 acx-max-h-24 acx-bg-transparent placeholder:acx-text-gray-400"
          style={{ fieldSizing: 'content' } as React.CSSProperties}
        />

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          className="acx-p-1.5 acx-text-primary-600 hover:acx-text-primary-700 disabled:acx-text-gray-300 acx-transition-colors acx-flex-shrink-0"
          aria-label="Send message"
          type="button"
        >
          <SendIcon className="acx-w-5 acx-h-5" />
        </button>
      </div>
    </div>
  )
}
