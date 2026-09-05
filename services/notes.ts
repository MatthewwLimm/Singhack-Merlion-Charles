import { getSupabaseClient } from "@/lib/supabase/server"
import type { RmNote } from "@/lib/supabase/types"

export async function getClientNotes(clientId: string): Promise<RmNote[]> {
  const { data, error } = await getSupabaseClient()
    .from("rm_notes")
    .select("*")
    .eq("client_id", clientId)
    .order("note_date", { ascending: false })

  if (error) throw new Error(`getClientNotes(${clientId}): ${error.message}`)
  return data as RmNote[]
}

/** Next sequential "N-###" id, following the source dataset's convention. */
async function generateNextNoteId(): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .from("rm_notes")
    .select("note_id")
    .order("note_id", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`generateNextNoteId: ${error.message}`)

  const lastNumber = data ? Number.parseInt(data.note_id.replace(/\D/g, ""), 10) : 0
  const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1
  return `N-${String(next).padStart(3, "0")}`
}

export interface CreateRMNoteInput {
  client_id: string
  note_date: string
  rm_id?: string | null
  rm_name?: string | null
  channel?: string | null
  note: string
}

export async function createRMNote(input: CreateRMNoteInput): Promise<RmNote> {
  const note_id = await generateNextNoteId()

  const { data, error } = await getSupabaseClient()
    .from("rm_notes")
    .insert({
      note_id,
      client_id: input.client_id,
      note_date: input.note_date,
      rm_id: input.rm_id ?? null,
      rm_name: input.rm_name ?? null,
      channel: input.channel ?? null,
      note: input.note,
    })
    .select()
    .single()

  if (error) throw new Error(`createRMNote: ${error.message}`)
  return data as RmNote
}

export type UpdateRMNoteInput = Partial<Omit<CreateRMNoteInput, "client_id">>

export async function updateRMNote(noteId: string, updates: UpdateRMNoteInput): Promise<RmNote> {
  const { data, error } = await getSupabaseClient()
    .from("rm_notes")
    .update(updates)
    .eq("note_id", noteId)
    .select()
    .single()

  if (error) throw new Error(`updateRMNote(${noteId}): ${error.message}`)
  return data as RmNote
}

export async function deleteRMNote(noteId: string): Promise<void> {
  const { error } = await getSupabaseClient().from("rm_notes").delete().eq("note_id", noteId)
  if (error) throw new Error(`deleteRMNote(${noteId}): ${error.message}`)
}
