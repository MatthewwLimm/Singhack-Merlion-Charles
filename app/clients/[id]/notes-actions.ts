'use server'

import { revalidatePath } from 'next/cache'
import { createRMNote, deleteRMNote, updateRMNote } from '@/services/notes'

const RM_NAME = 'Priscilla Ong'
const RM_ID = 'RM-SG-014'

export async function createNoteAction(clientId: string, note: string, channel: string) {
  if (!note.trim()) throw new Error('Note cannot be empty.')

  await createRMNote({
    client_id: clientId,
    note_date: new Date().toISOString().slice(0, 10),
    rm_id: RM_ID,
    rm_name: RM_NAME,
    channel,
    note: note.trim(),
  })

  revalidatePath(`/clients/${clientId}`)
}

export async function updateNoteAction(clientId: string, noteId: string, note: string) {
  if (!note.trim()) throw new Error('Note cannot be empty.')
  await updateRMNote(noteId, { note: note.trim() })
  revalidatePath(`/clients/${clientId}`)
}

export async function deleteNoteAction(clientId: string, noteId: string) {
  await deleteRMNote(noteId)
  revalidatePath(`/clients/${clientId}`)
}
