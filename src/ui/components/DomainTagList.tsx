interface DomainTagListProps {
  domains: string[]
}

export default function DomainTagList({ domains }: DomainTagListProps) {
  return (
    <ul className="flex flex-wrap gap-1">
      {domains.map((domain) => (
        <li key={domain} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
          {domain}
        </li>
      ))}
    </ul>
  )
}
