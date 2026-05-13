import { useState } from 'react'

interface LeadCaptureFormProps {
  onSubmit: (data: { name: string; email: string }) => void
  loading?: boolean
}

export function LeadCaptureForm({ onSubmit, loading }: LeadCaptureFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    onSubmit({ name: name.trim(), email: email.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="acx-p-4 acx-space-y-3">
      <p className="acx-text-sm acx-text-gray-600 acx-mb-1">
        Before we start, could you share your details?
      </p>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="acx-w-full acx-px-3 acx-py-2 acx-border acx-border-gray-200 acx-rounded-lg acx-text-sm acx-outline-none focus:acx-border-primary-500 focus:acx-ring-1 focus:acx-ring-primary-500"
      />

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email *"
        required
        className="acx-w-full acx-px-3 acx-py-2 acx-border acx-border-gray-200 acx-rounded-lg acx-text-sm acx-outline-none focus:acx-border-primary-500 focus:acx-ring-1 focus:acx-ring-primary-500"
      />

      <button
        type="submit"
        disabled={!email.trim() || loading}
        className="acx-w-full acx-bg-primary-600 acx-text-white acx-py-2.5 acx-rounded-lg acx-text-sm acx-font-medium acx-transition-colors enabled:hover:acx-bg-primary-700 disabled:acx-bg-gray-200 disabled:acx-text-gray-500 disabled:acx-cursor-not-allowed"
      >
        {loading ? 'Starting...' : 'Start conversation'}
      </button>
    </form>
  )
}
