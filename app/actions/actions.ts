'use server'

import { revalidatePath } from 'next/cache'
import { transitionRecommendation, updateRecommendation } from '@/services/recommendations'
import type { RecommendationEventType } from '@/lib/supabase/types'

const RM_NAME = 'Priscilla Ong'

export async function transitionAction(recommendationId: string, eventType: RecommendationEventType, notes?: string) {
  await transitionRecommendation(recommendationId, eventType, { notes: notes ?? null, createdBy: RM_NAME })
  revalidatePath('/actions')
  revalidatePath('/ledger')
  revalidatePath('/')
}

export async function editRecommendationMessageAction(recommendationId: string, text: string) {
  if (!text.trim()) throw new Error('Message cannot be empty.')
  await updateRecommendation(recommendationId, { recommendation: text.trim() })
  revalidatePath('/actions')
}
