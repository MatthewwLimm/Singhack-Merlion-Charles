'use server'

import { revalidatePath } from 'next/cache'
import { resetScenario } from '@/services/scenarios'

export async function resetScenarioAction(scenarioCode: string, clientId: string) {
  const result = await resetScenario(scenarioCode)
  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/actions')
  revalidatePath('/ledger')
  return result
}
