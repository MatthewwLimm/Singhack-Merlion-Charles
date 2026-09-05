import { Resend } from "resend"

let client: Resend | null = null

function getResendClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error("RESEND_API_KEY is not set")
    client = new Resend(apiKey)
  }
  return client
}

export async function sendActionEmail(input: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<void> {
  const resend = getResendClient()
  const { error } = await resend.emails.send({
    from: "Continuum <onboarding@resend.dev>",
    to: input.to,
    subject: input.subject,
    text: input.text,
    ...(input.html ? { html: input.html } : {}),
  })
  if (error) throw new Error(error.message)
}
