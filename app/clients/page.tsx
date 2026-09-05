import Link from 'next/link'
import { ArrowRightIcon, Users, Wallet, Building2, TrendingUp } from 'lucide-react'
import { getClients } from '@/services/clients'
import { PageHeader } from '@/components/continuum/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default async function ClientsPage() {
  let clients: Awaited<ReturnType<typeof getClients>> = []
  let loadError: string | null = null

  try {
    clients = await getClients()
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load clients.'
  }

  // Calculate executive KPI metrics
  const totalAumUsd = clients.reduce((acc, c) => acc + (c.total_aum_usd ?? 0), 0)
  const avgAumUsd = clients.length ? totalAumUsd / clients.length : 0
  const uhnwCount = clients.filter((c) => c.wealth_band?.toUpperCase().includes('UHNW')).length
  const uhnwPct = clients.length ? Math.round((uhnwCount / clients.length) * 100) : 0

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-6 lg:px-8">
      <PageHeader
        eyebrow="Book of clients"
        title="Clients"
        subtitle={loadError ? undefined : `${clients.length} relationships under management`}
      />

      {loadError ? (
        <div className="rounded-md border border-signal-critical/30 bg-signal-critical-muted px-4 py-3 text-sm text-signal-critical">
          Could not load clients: {loadError}
        </div>
      ) : (
        <>
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium uppercase tracking-wider">Relationships</span>
                <Users className="size-4 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">{clients.length}</p>
            </div>

            <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium uppercase tracking-wider">Total AUM</span>
                <Wallet className="size-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">{formatMoney(totalAumUsd, 'USD')}</p>
            </div>

            <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium uppercase tracking-wider">UHNW Ratio</span>
                <Building2 className="size-4 text-purple-500" />
              </div>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">{uhnwPct}%</p>
            </div>

            <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium uppercase tracking-wider">Avg Relationship</span>
                <TrendingUp className="size-4 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">{formatMoney(avgAumUsd, 'USD')}</p>
            </div>
          </div>

          {/* Enhanced Client Table */}
          <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[300px]">Client</TableHead>
                  <TableHead>Domicile</TableHead>
                  <TableHead>Mandate / Risk Profile</TableHead>
                  <TableHead className="text-right">Relationship Value</TableHead>
                  <TableHead className="text-center">Wealth Band</TableHead>
                  <TableHead>RM</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => {
                  const isUhnw = c.wealth_band?.toUpperCase().includes('UHNW')
                  const isHnw = c.wealth_band?.toUpperCase().includes('HNW')

                  return (
                    <TableRow key={c.client_id} className="group hover:bg-muted/30 transition-colors">
                      {/* Client Name with Avatar */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {getInitials(c.client_name)}
                          </div>
                          <div>
                            <Link
                              href={`/clients/${c.client_id}`}
                              className="font-semibold text-foreground group-hover:text-blue-600 transition-colors"
                            >
                              {c.client_name}
                            </Link>
                            <p className="text-[10px] text-muted-foreground font-mono">{c.client_id}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Domicile */}
                      <TableCell className="text-xs text-muted-foreground">
                        {c.country_of_residence ?? c.tax_domicile ?? '—'}
                      </TableCell>

                      {/* Mandate / Risk Profile Pill */}
                      <TableCell>
                        {c.risk_profile ? (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {c.risk_profile}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>

                      {/* Relationship Value */}
                      <TableCell className="tabular text-right font-bold text-foreground">
                        {formatMoney(c.total_aum_usd, c.base_currency)}
                      </TableCell>

                      {/* Wealth Band Badge */}
                      <TableCell className="text-center">
                        {c.wealth_band ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                              isUhnw && 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
                              isHnw && !isUhnw && 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
                              !isHnw && !isUhnw && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            )}
                          >
                            {c.wealth_band}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>

                      {/* RM Name */}
                      <TableCell className="text-xs text-muted-foreground">{c.rm_name ?? '—'}</TableCell>

                      {/* Action Button */}
                      <TableCell>
                        <Link
                          href={`/clients/${c.client_id}`}
                          aria-label={`Open ${c.client_name}`}
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground group-hover:translate-x-0.5"
                        >
                          <ArrowRightIcon className="size-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {!clients.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No clients found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}