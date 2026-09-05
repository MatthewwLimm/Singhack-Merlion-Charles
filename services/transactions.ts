import { getSupabaseClient } from "@/lib/supabase/server"
import type { Transaction } from "@/lib/supabase/types"

export async function getClientTransactions(clientId: string, limit = 50): Promise<Transaction[]> {
  const { data, error } = await getSupabaseClient()
    .from("transactions")
    .select("*")
    .eq("client_id", clientId)
    .order("trade_date", { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getClientTransactions(${clientId}): ${error.message}`)
  return data as Transaction[]
}
