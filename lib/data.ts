// UI-facing display shapes consumed by components/continuum/*. These used
// to be paired with hand-written mock data in this file; the data now comes
// from Supabase via services/* + the adapters in lib/*-display.ts, mapped
// into these same shapes so the presentational components didn't need to
// change. See services/client360.ts, services/cockpit.ts,
// services/recommendations.ts for where the real data comes from.
import type { Priority } from './types'

export type { Priority }

export type SourceSystem =
  | 'Holdings'
  | 'Credit Facility'
  | 'Mandate'
  | 'RM Note'
  | 'Advice Ledger'
  | 'CRM'
  | 'Calendar'
  | 'Valuations'
  | 'Suitability'

export type AdviceStatus =
  | 'Raised'
  | 'Under Review'
  | 'Discussed'
  | 'Accepted'
  | 'Deferred'
  | 'Rejected'
  | 'Resurfaced'

export interface Evidence {
  label: string
  value: string
  source: SourceSystem
  asOf?: string
}

export interface PriorityClient {
  id: string
  name: string
  priority: Priority
  reason: string
  evidence: Evidence[]
  exposure: { label: string; value: string }
  previousAdvice?: { status: AdviceStatus; date: string; summary: string }
  nextAction: string
  domicile: string
  avgHandlingTime: string
}

export type ActionStatus = 'Awaiting Review' | 'Approved' | 'Deferred' | 'Completed' | 'Rejected'

export interface LedgerRow {
  id: string
  clientId: string
  client: string
  recommendation: string
  category: string
  created: string
  status: AdviceStatus
  nextReview: string
  reviewTrigger: string
  lastAction: string
  highlighted?: boolean
  lifecycle: { date: string; event: string; status: AdviceStatus; note?: string; source?: SourceSystem }[]
}
