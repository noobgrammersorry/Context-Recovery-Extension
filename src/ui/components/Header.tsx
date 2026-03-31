interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="mb-4 border-b border-slate-200 pb-2">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
    </header>
  )
}
