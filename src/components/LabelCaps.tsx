export function LabelCaps({ children, className = '', style }: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <p
      className={`text-[11px] uppercase tracking-[0.08em] opacity-60 font-medium m-0 ${className}`}
      style={style}
    >
      {children}
    </p>
  )
}
