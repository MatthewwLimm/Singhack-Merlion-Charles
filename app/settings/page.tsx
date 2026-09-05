import { PageHeader } from '@/components/continuum/page-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const toggles = [
  { label: 'Portfolio monitoring', detail: 'Continuous monitoring of holdings, credit and mandate signals.', on: true },
  { label: 'Morning briefing email', detail: 'Send a summary of the Priority Client Feed each morning at 06:00.', on: true },
  { label: 'AI-drafted communications', detail: 'Allow the assistant to draft client messages for RM review.', on: true },
  { label: 'Behaviour-aware framing', detail: 'Use observed client behaviour to shape communication guidance.', on: true },
]

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-6 lg:px-8">
      <PageHeader title="Settings" subtitle="Workbench preferences for this RM profile." />

      <section className="flex items-center gap-4 rounded-lg border bg-card p-5">
        <Avatar className="size-12 rounded-md">
          <AvatarFallback className="rounded-md bg-primary font-serif text-lg text-primary-foreground">
            PO
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">Priscilla Ong</p>
          <p className="text-xs text-muted-foreground">Senior Relationship Manager · Asia desk (Singapore &amp; Hong Kong)</p>
        </div>
      </section>

      <section className="flex flex-col rounded-lg border bg-card">
        {toggles.map((t, i) => (
          <div key={t.label}>
            {i > 0 ? <Separator /> : null}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.detail}</p>
              </div>
              <span
                className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${t.on ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`block size-4 rounded-full bg-primary-foreground transition-transform ${t.on ? 'translate-x-4' : ''}`} />
              </span>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
