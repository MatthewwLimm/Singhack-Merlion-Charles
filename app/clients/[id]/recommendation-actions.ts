'use server'

import { revalidatePath } from 'next/cache'
import { transitionRecommendation, updateRecommendation } from '@/services/recommendations'
import { sendActionEmail } from '@/lib/email'
import type { RecommendationEventType } from '@/lib/supabase/types'

const RM_NAME = 'Priscilla Ong'

const EVENT_CLOSING: Record<'APPROVED' | 'CLIENT_DEFERRED' | 'CLIENT_REJECTED', string> = {
  APPROVED: "I've gone ahead and approved this on our end. Let me know if you'd like to talk it through before we proceed, or if you have any questions in the meantime.",
  CLIENT_DEFERRED: "I've noted that you'd like to hold off on this for now — no action will be taken. Happy to revisit whenever the timing suits you better.",
  CLIENT_REJECTED: "I've noted that this isn't the right fit for you at the moment. Thank you for letting me know — let's discuss alternatives whenever you're ready.",
}

export async function editRecommendationAction(clientId: string, recommendationId: string, text: string) {
  if (!text.trim()) throw new Error('Recommendation cannot be empty.')
  await updateRecommendation(recommendationId, { recommendation: text.trim() })
  revalidatePath(`/clients/${clientId}`)
}

export async function transitionRecommendationAction(
  clientId: string,
  recommendationId: string,
  eventType: RecommendationEventType,
  notes?: string,
) {
  await transitionRecommendation(recommendationId, eventType, { notes: notes ?? null, createdBy: RM_NAME })
  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/actions')
  revalidatePath('/ledger')
  revalidatePath('/')
}

export async function sendRecommendationEmailAction(input: {
  to: string
  clientName: string
  recommendationTitle: string
  recommendationText: string
  rationale?: string | null
  script?: string | null
  evidence?: { description: string; source: string }[]
  eventType: 'APPROVED' | 'CLIENT_DEFERRED' | 'CLIENT_REJECTED'
}) {
  const to = input.to.trim()
  if (!to) throw new Error('Recipient email is required.')

  const firstName = input.clientName.split(' ')[0] ?? input.clientName
  const script = input.script?.replace(/^"|"$/g, '').trim()
  const evidence = input.evidence ?? []
  const closing = EVENT_CLOSING[input.eventType]

  const textSections = [
    `Dear ${firstName},`,
    '',
    script || `Following up on my review of your portfolio, I wanted to share a recommendation regarding ${input.recommendationTitle.toLowerCase()}.`,
    '',
    `Here's what I'm recommending:`,
    input.recommendationText,
  ]

  if (input.rationale) {
    textSections.push('', `Why I'm recommending this:`, input.rationale)
  }

  if (evidence.length > 0) {
    textSections.push(
      '',
      'Supporting details:',
      ...evidence.map((e) => `- ${e.description} (source: ${e.source})`),
    )
  }

  textSections.push('', closing, '', 'Best regards,', RM_NAME, 'Relationship Manager')

  const evidenceHtml =
    evidence.length > 0
      ? `<h3 style="margin:24px 0 8px;font-size:13px;letter-spacing:0.02em;text-transform:uppercase;color:#6b7280;">Supporting details</h3>
         <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.6;">
           ${evidence.map((e) => `<li>${escapeHtml(e.description)} <span style="color:#9ca3af;">(source: ${escapeHtml(e.source)})</span></li>`).join('')}
         </ul>`
      : ''

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
      <p style="font-size:15px;line-height:1.6;">Dear ${escapeHtml(firstName)},</p>
      <p style="font-size:15px;line-height:1.6;">${escapeHtml(script || `Following up on my review of your portfolio, I wanted to share a recommendation regarding ${input.recommendationTitle.toLowerCase()}.`)}</p>

      <h3 style="margin:24px 0 8px;font-size:13px;letter-spacing:0.02em;text-transform:uppercase;color:#6b7280;">What I'm recommending</h3>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;font-size:15px;line-height:1.6;">
        ${escapeHtml(input.recommendationText)}
      </div>

      ${
        input.rationale
          ? `<h3 style="margin:24px 0 8px;font-size:13px;letter-spacing:0.02em;text-transform:uppercase;color:#6b7280;">Why I'm recommending this</h3>
             <p style="font-size:14px;line-height:1.6;color:#374151;">${escapeHtml(input.rationale)}</p>`
          : ''
      }

      ${evidenceHtml}

      <p style="font-size:15px;line-height:1.6;margin-top:24px;">${escapeHtml(closing)}</p>

      <p style="font-size:15px;line-height:1.6;margin-top:24px;">
        Best regards,<br />
        <strong>${RM_NAME}</strong><br />
        <span style="color:#6b7280;font-size:13px;">Relationship Manager</span>
      </p>
    </div>
  `

  await sendActionEmail({
    to,
    subject: `A note from ${RM_NAME} — ${input.recommendationTitle}`,
    text: textSections.join('\n'),
    html,
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
