interface BadgeProps {
  count: number
}

export function Badge({ count }: BadgeProps) {
  if (count <= 0) return null

  const display = count > 99 ? '99+' : String(count)

  return (
    <span className="acx:absolute acx:-top-1.5 acx:-right-1.5 acx:min-w-[18px] acx:h-[18px] acx:flex acx:items-center acx:justify-center acx:bg-red-500 acx:text-white acx:text-[10px] acx:font-bold acx:rounded-full acx:px-1 acx:leading-none">
      {display}
    </span>
  )
}
