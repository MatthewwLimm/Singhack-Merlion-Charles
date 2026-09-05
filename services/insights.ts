import { getSupabaseClient } from "@/lib/supabase/server"
import type { Insight, InsightEvidence, InsightSeverity, InsightStatus, InsightType } from "@/lib/supabase/types"

export type InsightWithEvidence = Insight & { evidence: InsightEvidence[] }

export async function getInsights(clientId: string): Promise<InsightWithEvidence[]> {
  const supabase = getSupabaseClient()

  const { data: insights, error } = await supabase
    .from("insights")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`getInsights(${clientId}): ${error.message}`)
  if (!insights || insights.length === 0) return []

  const ids = (insights as Insight[]).map((i) => i.id)
  const { data: evidence, error: evidenceError } = await supabase
    .from("insight_evidence")
    .select("*")
    .in("insight_id", ids)

  if (evidenceError) throw new Error(`getInsights(${clientId}) evidence: ${evidenceError.message}`)

  return (insights as Insight[]).map((insight) => ({
    ...insight,
    evidence: (evidence as InsightEvidence[]).filter((e) => e.insight_id === insight.id),
  }))
}

export interface CreateInsightInput {
  client_id: string
  insight_type: InsightType
  severity: InsightSeverity
  title: string
  summary: string
  status?: InsightStatus
  evidence?: Omit<InsightEvidence, "id" | "insight_id" | "created_at">[]
}

export async function createInsight(input: CreateInsightInput): Promise<InsightWithEvidence> {
  const supabase = getSupabaseClient()
  const { evidence, ...insightFields } = input

  const { data: insight, error } = await supabase.from("insights").insert(insightFields).select().single()
  if (error) throw new Error(`createInsight: ${error.message}`)

  let insertedEvidence: InsightEvidence[] = []
  if (evidence && evidence.length > 0) {
    const { data, error: evidenceError } = await supabase
      .from("insight_evidence")
      .insert(evidence.map((e) => ({ ...e, insight_id: (insight as Insight).id })))
      .select()

    if (evidenceError) throw new Error(`createInsight evidence: ${evidenceError.message}`)
    insertedEvidence = data as InsightEvidence[]
  }

  return { ...(insight as Insight), evidence: insertedEvidence }
}

export type UpdateInsightInput = Partial<Pick<Insight, "severity" | "title" | "summary" | "status">>

export async function updateInsight(insightId: string, updates: UpdateInsightInput): Promise<Insight> {
  const { data, error } = await getSupabaseClient()
    .from("insights")
    .update(updates)
    .eq("id", insightId)
    .select()
    .single()

  if (error) throw new Error(`updateInsight(${insightId}): ${error.message}`)
  return data as Insight
}

/** Cascades to insight_evidence at the DB level. */
export async function deleteInsight(insightId: string): Promise<void> {
  const { error } = await getSupabaseClient().from("insights").delete().eq("id", insightId)
  if (error) throw new Error(`deleteInsight(${insightId}): ${error.message}`)
}

export async function addInsightEvidence(
  insightId: string,
  evidence: Omit<InsightEvidence, "id" | "insight_id" | "created_at">,
): Promise<InsightEvidence> {
  const { data, error } = await getSupabaseClient()
    .from("insight_evidence")
    .insert({ ...evidence, insight_id: insightId })
    .select()
    .single()

  if (error) throw new Error(`addInsightEvidence(${insightId}): ${error.message}`)
  return data as InsightEvidence
}
