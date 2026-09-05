'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { PlayCircleIcon } from 'lucide-react'
import type { DemoScenario } from '@/services/scenarios'

export function DemoScenarioSelector({ scenarios }: { scenarios: DemoScenario[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('scenario') ?? ''

  if (scenarios.length === 0) return null

  function onChange(value: string) {
    if (!value) {
      router.push('/')
      return
    }
    const scenario = scenarios.find((s) => s.scenario_code === value)
    if (scenario?.client_id) {
      router.push(`/clients/${scenario.client_id}?scenario=${value}`)
    }
  }

  return (
    <div className="relative hidden items-center lg:flex">
      <PlayCircleIcon className="pointer-events-none absolute left-2 size-3.5 text-assist" />
      <select
        aria-label="Demo scenario"
        value={active}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 appearance-none rounded-md border border-assist/30 bg-assist-muted py-0 pr-6 pl-7 text-[13px] font-medium text-assist outline-none"
      >
        <option value="">Demo scenario…</option>
        {scenarios.map((s) => (
          <option key={s.scenario_code} value={s.scenario_code}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  )
}
