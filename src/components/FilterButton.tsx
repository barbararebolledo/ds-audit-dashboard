export function FilterButton({ label, isActive, onClick }: {
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return isActive ? (
    <button onClick={onClick} className="px-5 py-2 rounded-full text-[13px] font-medium" style={{ backgroundColor: '#F5E9C8', color: '#0C0C0C' }}>
      {label}
    </button>
  ) : (
    <button onClick={onClick} className="px-5 py-2 rounded-full text-[13px]" style={{ border: '1px solid rgba(245, 233, 200, 0.2)', color: '#F5E9C8', background: 'transparent' }}>
      {label}
    </button>
  )
}
