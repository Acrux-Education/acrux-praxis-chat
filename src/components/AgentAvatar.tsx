interface AgentAvatarProps {
  name: string
  avatarUrl?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
}

const COLORS = [
  'acx:bg-blue-500',
  'acx:bg-green-500',
  'acx:bg-purple-500',
  'acx:bg-orange-500',
  'acx:bg-pink-500',
  'acx:bg-teal-500',
]

function getColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]!
}

export function AgentAvatar({ name, avatarUrl }: AgentAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="acx:w-8 acx:h-8 acx:rounded-full acx:object-cover acx:flex-shrink-0"
      />
    )
  }

  return (
    <div
      className={`acx:w-8 acx:h-8 acx:rounded-full acx:flex acx:items-center acx:justify-center acx:text-white acx:text-xs acx:font-semibold acx:flex-shrink-0 ${getColor(name)}`}
    >
      {getInitials(name)}
    </div>
  )
}
