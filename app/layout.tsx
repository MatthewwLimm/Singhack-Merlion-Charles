import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Newsreader } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ApplicationShell } from '@/components/shell/application-shell'
import { listRecommendations } from '@/services/recommendations'
import { getDemoScenarios } from '@/services/scenarios'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Continuum — Relationship Manager Workbench',
  description:
    'AI-assisted intelligence workbench for private banking relationship managers. Understand, decide, personalise and follow through.',
  generator: 'v0.app',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#1c2434',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let awaitingReviewCount = 0
  let scenarios: Awaited<ReturnType<typeof getDemoScenarios>> = []
  try {
    const recommendations = await listRecommendations()
    awaitingReviewCount = recommendations.filter((r) => r.status === 'DRAFT' || r.status === 'READY_FOR_REVIEW').length
  } catch {
    // Shell renders with a zero badge if Supabase isn't reachable; the page
    // body itself surfaces the real error.
  }
  try {
    scenarios = await getDemoScenarios()
  } catch {
    // Scenario selector just won't render if this fails.
  }

  return (
    <html
      lang="en"
      className={`bg-background ${geistSans.variable} ${geistMono.variable} ${newsreader.variable}`}
    >
      <body className="font-sans antialiased">
        <TooltipProvider>
          <ApplicationShell actionQueueCount={awaitingReviewCount} scenarios={scenarios}>
            {children}
          </ApplicationShell>
        </TooltipProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
