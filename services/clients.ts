import { getSupabaseClient } from "@/lib/supabase/server"
import type { Client } from "@/lib/supabase/types"

export async function getClients(): Promise<Client[]> {
  const { data, error } = await getSupabaseClient()
    .from("clients")
    .select("*")
    .order("client_name", { ascending: true })

  if (error) throw new Error(`getClients: ${error.message}`)
  return data as Client[]
}

export async function getClientById(clientId: string): Promise<Client | null> {
  const { data, error } = await getSupabaseClient()
    .from("clients")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle()

  if (error) throw new Error(`getClientById(${clientId}): ${error.message}`)
  return data as Client | null
}

export type NewClient = Omit<Client, "created_at" | "updated_at">

/**
 * Creates a client record. `client_id` is treated as a business identifier
 * (e.g. "CL-0021") and must be supplied by the caller, matching the
 * convention of the source dataset — it is never auto-generated.
 */
export async function createClient(input: NewClient): Promise<Client> {
  const { data, error } = await getSupabaseClient().from("clients").insert(input).select().single()

  if (error) throw new Error(`createClient: ${error.message}`)
  return data as Client
}

export type ClientUpdate = Partial<Omit<Client, "client_id" | "created_at" | "updated_at">>

export async function updateClient(clientId: string, updates: ClientUpdate): Promise<Client> {
  const { data, error } = await getSupabaseClient()
    .from("clients")
    .update(updates)
    .eq("client_id", clientId)
    .select()
    .single()

  if (error) throw new Error(`updateClient(${clientId}): ${error.message}`)
  return data as Client
}

// deleteClient is intentionally not implemented. A client in this schema is
// referenced (ON DELETE RESTRICT) by portfolios, transactions, credit
// facilities, commitments, planned_cash_needs, rm_notes, insights and
// recommendations — 9 dependent tables. A "safe" cascading delete across all
// of those has no real product value for this prototype and a lot of ways to
// go wrong, so it's left out rather than half-built. The database will
// refuse the delete anyway if something calls it directly.
