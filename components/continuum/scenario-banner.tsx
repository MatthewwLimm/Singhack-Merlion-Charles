'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDownIcon, PlayCircleIcon, RotateCcwIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { resetScenarioAction } from '@/app/clients/[id]/scenario-actions'
import type { DemoScenario, ScenarioEvent } from '@/services/scenarios'

const BEATS: { key: keyof DemoScenario['narrative']; label: string }[] = [
  { key: 'initial_state', label: 'Initial state' },
  { key: 'reveal', label: 'Reveal' },
  { key: 'why_it_matters', label: 'Why it matters' },
  { key: 'action', label: 'Action' },
  { key: 'personalisation', label: 'Personalisation' },
  { key: 'follow_up', label: 'Follow-up' },
]

export function ScenarioBanner({
  scenario,
  hypotheticalEvents,
}: {
  scenario: DemoScenario
  hypotheticalEvents: ScenarioEvent[]
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(true)
  const [pending, startTransition] = React.useTransition()

  function reset() {
    startTransition(async () => {
      await resetScenarioAction(scenario.scenario_code, scenario.client_id ?? '')
      router.refresh()
    })
  }

  return (
    <section className="rounded-lg border border-assist/30 bg-assist-muted">
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <PlayCircleIcon className="size-4 text-assist" />
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-assist">
              Demo Scenario
              <span className="rounded-sm bg-assist/15 px-1.5 py-px text-[10px] font-semibold tracking-wide uppercase">
                {scenario.name}
              </span>
            </p>
            <p className="text-xs text-assist/80">{scenario.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset} disabled={pending} className="text-assist hover:bg-assist/10">
            <RotateCcwIcon data-icon="inline-start" />
            Reset scenario
          </Button>
        </div>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="border-t border-assist/20 px-5 py-1.5">
          <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="-ml-2 text-assist" />}>
            Presenter walkthrough
            <ChevronDownIcon data-icon="inline-end" className={cn('transition-transform', open && 'rotate-180')} />
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <ol className="grid gap-3 border-t border-assist/20 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
            {BEATS.map((beat, i) => {
              const text = scenario.narrative[beat.key]
              if (!text) return null
              return (
                <li key={beat.key} className="flex flex-col gap-1 rounded-md bg-card p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] text-assist uppercase">
                    <span className="tabular">{i + 1}</span>
                    {beat.label}
                  </p>
                  <p className="text-xs leading-relaxed text-foreground/90">{text}</p>
                </li>
              )
            })}
          </ol>

          {hypotheticalEvents.length > 0 ? (
            <div className="flex flex-col gap-2 border-t border-assist/20 px-5 py-4">
              <p className="text-[10px] font-semibold tracking-[0.1em] text-assist uppercase">
                Hypothetical — what-if projection
              </p>
              {hypotheticalEvents.map((e) => (
                <div key={e.id} className="rounded-md bg-card p-3">
                  <p className="text-xs leading-relaxed text-foreground/90">{e.description}</p>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Simulated · not from the official dataset · {e.transmission_channel}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}
