'use client'

import * as React from 'react'
import { SparklesIcon, ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionReviewDrawer } from './action-review-drawer'
import type { InsightEvidence, Recommendation } from '@/lib/supabase/types'
import type { RecommendationWithClient } from '@/services/recommendations'

export function RecommendationPanel({
  clientId,
  clientName,
  recommendation,
  evidence,
}: {
  clientId: string
  clientName: string
  recommendation: Recommendation | null
  evidence: InsightEvidence[]
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  if (!recommendation) return null

  const recommendationWithClient: RecommendationWithClient = {
    ...recommendation,
    client_name: clientName,
    evidence,
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <SparklesIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Action Recommended
            </span>
            <p className="text-sm font-medium text-foreground">
              {recommendation.recommendation}
            </p>
          </div>
        </div>

        <Button size="sm" onClick={() => setDrawerOpen(true)} className="gap-2">
          Review Action
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ActionReviewDrawer
        recommendation={recommendationWithClient}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  )
}