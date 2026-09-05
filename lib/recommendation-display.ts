// Maps the database's richer RecommendationStatus/RecommendationEventType
// enums onto the simpler ActionStatus / AdviceStatus vocabularies the
// existing UI components were built around (see lib/data.ts), so the
// presentational components didn't need to change shape.
import type { InsightType, RecommendationEventType, RecommendationPriority, RecommendationStatus } from '@/lib/supabase/types'
import type { ActionStatus, AdviceStatus } from '@/lib/data'
import type { Priority } from '@/lib/types'

/** Recommendation priority (Low/Medium/High/Urgent) -> the cockpit's Priority badge vocabulary, for display consistency across screens. */
export function toPriorityBadge(priority: RecommendationPriority): Priority {
  switch (priority) {
    case 'Urgent':
    case 'High':
      return 'ACTION REQUIRED'
    case 'Medium':
      return 'RM CHECK-IN'
    case 'Low':
      return 'REVIEW'
  }
}

const INSIGHT_TYPE_LABEL: Record<InsightType, string> = {
  CREDIT_RISK: 'Credit & Liquidity',
  LIQUIDITY_GAP: 'Credit & Liquidity',
  MANDATE_BREACH: 'Mandate & Compliance',
  CONCENTRATION_RISK: 'Portfolio Construction',
  BEHAVIOURAL_SIGNAL: 'Client Behaviour',
  LIFE_EVENT: 'Wealth Planning',
  MARKET_EVENT_IMPACT: 'Market Impact',
}

export function toCategoryLabel(insightType: InsightType | null): string {
  return insightType ? INSIGHT_TYPE_LABEL[insightType] : 'Recommendation'
}

export function toActionStatus(status: RecommendationStatus): ActionStatus {
  switch (status) {
    case 'DRAFT':
    case 'READY_FOR_REVIEW':
      return 'Awaiting Review'
    case 'APPROVED':
    case 'SENT':
    case 'ACCEPTED':
      return 'Approved'
    case 'DEFERRED':
      return 'Deferred'
    case 'REJECTED':
      return 'Rejected'
    case 'CLOSED':
      return 'Completed'
  }
}

/**
 * `latestEventType` lets a row that was just RESURFACED show that
 * distinctly from an ordinary READY_FOR_REVIEW — the Advice Ledger's whole
 * point is surfacing exactly that.
 */
export function toAdviceStatus(status: RecommendationStatus, latestEventType?: RecommendationEventType): AdviceStatus {
  if (latestEventType === 'RESURFACED') return 'Resurfaced'
  switch (status) {
    case 'DRAFT':
      return 'Raised'
    case 'READY_FOR_REVIEW':
      return 'Under Review'
    case 'APPROVED':
    case 'SENT':
      return 'Discussed'
    case 'ACCEPTED':
    case 'CLOSED':
      return 'Accepted'
    case 'REJECTED':
      return 'Rejected'
    case 'DEFERRED':
      return 'Deferred'
  }
}

const EVENT_LABEL: Record<RecommendationEventType, string> = {
  CREATED: 'Recommendation raised',
  RM_REVIEWED: 'Reviewed by RM',
  APPROVED: 'Approved by RM',
  SENT: 'Sent to client',
  CLIENT_ACCEPTED: 'Client accepted',
  CLIENT_REJECTED: 'Client rejected',
  CLIENT_DEFERRED: 'Client deferred',
  RESURFACED: 'Resurfaced — review condition met',
  COMPLETED: 'Completed',
  NOTE: 'Note added',
}

export function eventLabel(eventType: RecommendationEventType): string {
  return EVENT_LABEL[eventType]
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatHandlingTime(hours: number | null): string {
  if (hours === null) return '—'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 48) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
