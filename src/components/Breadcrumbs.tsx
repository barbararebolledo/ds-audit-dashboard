import { Link } from 'react-router-dom'

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <div className="flex items-center gap-2 text-[12px] mb-6" style={{ opacity: 0.5 }}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span>/</span>}
          {item.to ? (
            <Link to={item.to} className="no-underline hover:opacity-80" style={{ color: '#F5E9C8' }}>{item.label}</Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}
