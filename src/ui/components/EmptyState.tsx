interface EmptyStateProps {
  title: string
  subtitle: string
}

export default function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
    </section>
  )
}
