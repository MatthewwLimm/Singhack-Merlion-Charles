import { getSupabaseClient } from "@/lib/supabase/server"
import type { Commitment, PlannedCashNeed } from "@/lib/supabase/types"

export async function getClientCommitments(clientId: string): Promise<Commitment[]> {
  const { data, error } = await getSupabaseClient().from("commitments").select("*").eq("client_id", clientId)

  if (error) throw new Error(`getClientCommitments(${clientId}): ${error.message}`)
  return data as Commitment[]
}

export async function getClientPlannedCashNeeds(clientId: string): Promise<PlannedCashNeed[]> {
  const { data, error } = await getSupabaseClient()
    .from("planned_cash_needs")
    .select("*")
    .eq("client_id", clientId)
    .order("due_from", { ascending: true })

  if (error) throw new Error(`getClientPlannedCashNeeds(${clientId}): ${error.message}`)
  return data as PlannedCashNeed[]
}

export async function getAllPlannedCashNeeds(): Promise<PlannedCashNeed[]> {
  const { data, error } = await getSupabaseClient()
    .from("planned_cash_needs")
    .select("*")
    .order("due_from", { ascending: true })

  if (error) throw new Error(`getAllPlannedCashNeeds: ${error.message}`)
  return data as PlannedCashNeed[]
}
