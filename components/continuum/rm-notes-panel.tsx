'use client'

import * as React from 'react'
import { PencilIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SourceCitation } from './source-citation'
import { createNoteAction, deleteNoteAction, updateNoteAction } from '@/app/clients/[id]/notes-actions'
import type { RmNote } from '@/lib/supabase/types'

const CHANNELS = ['Meeting', 'Call', 'Email', 'Video'] as const

export function RmNotesPanel({ clientId, notes }: { clientId: string; notes: RmNote[] }) {
  const [pending, startTransition] = React.useTransition()
  const [adding, setAdding] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const [channel, setChannel] = React.useState<(typeof CHANNELS)[number]>('Meeting')
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editDraft, setEditDraft] = React.useState('')
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  function submitNewNote() {
    setError(null)
    startTransition(async () => {
      try {
        await createNoteAction(clientId, draft, channel)
        setDraft('')
        setAdding(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save note.')
      }
    })
  }

  function submitEdit(noteId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await updateNoteAction(clientId, noteId, editDraft)
        setEditingId(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update note.')
      }
    })
  }

  function confirmDelete(noteId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await deleteNoteAction(clientId, noteId)
        setConfirmDeleteId(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete note.')
      }
    })
  }

  const sorted = [...notes].sort((a, b) => b.note_date.localeCompare(a.note_date))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">RM notes</h3>
        <div className="flex items-center gap-3">
          <SourceCitation source="RM Note" compact />
          {!adding ? (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
              <PlusIcon data-icon="inline-start" />
              Add note
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-xs text-signal-critical">{error}</p> : null}

      {adding ? (
        <div className="flex flex-col gap-2 rounded-md border bg-card p-4">
          <div className="flex items-center gap-2">
            {CHANNELS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c)}
                className={`rounded-sm border px-2 py-1 text-xs ${channel === c ? 'border-primary bg-primary/8 text-primary' : 'text-muted-foreground'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder="What happened, what the client said, what to follow up on..."
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false)
                setDraft('')
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={submitNewNote} disabled={pending || !draft.trim()}>
              Save note
            </Button>
          </div>
        </div>
      ) : null}

      {sorted.length ? (
        <ul className="flex flex-col gap-3">
          {sorted.map((n) => (
            <li key={n.note_id} className="flex flex-col gap-2 rounded-md border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <time className="tabular font-medium text-foreground">
                    {new Date(n.note_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </time>
                  <span>·</span>
                  <span>{n.channel}</span>
                  <span>·</span>
                  <span>{n.rm_name}</span>
                </div>
                {editingId !== n.note_id ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Edit note"
                      onClick={() => {
                        setEditingId(n.note_id)
                        setEditDraft(n.note)
                      }}
                    >
                      <PencilIcon />
                    </Button>
                    {confirmDeleteId === n.note_id ? (
                      <>
                        <Button variant="destructive" size="icon-xs" aria-label="Confirm delete" onClick={() => confirmDelete(n.note_id)}>
                          <Trash2Icon />
                        </Button>
                        <Button variant="ghost" size="icon-xs" aria-label="Cancel delete" onClick={() => setConfirmDeleteId(null)}>
                          <XIcon />
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="icon-xs" aria-label="Delete note" onClick={() => setConfirmDeleteId(n.note_id)}>
                        <Trash2Icon />
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>

              {editingId === n.note_id ? (
                <div className="flex flex-col gap-2">
                  <Textarea value={editDraft} onChange={(e) => setEditDraft(e.target.value)} rows={4} autoFocus />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => submitEdit(n.note_id)} disabled={pending || !editDraft.trim()}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-pretty text-foreground/90">{n.note}</p>
              )}

              {confirmDeleteId === n.note_id ? (
                <p className="text-xs text-signal-critical">Delete this note? This cannot be undone.</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          No RM notes recorded for this client yet.
        </p>
      )}
    </div>
  )
}
