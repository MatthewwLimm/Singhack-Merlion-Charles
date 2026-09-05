export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        {eyebrow ? (
          <p className="text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="font-serif text-3xl font-medium tracking-tight text-balance">{title}</h1>
        {subtitle ? <p className="text-sm text-muted-foreground text-pretty">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}
