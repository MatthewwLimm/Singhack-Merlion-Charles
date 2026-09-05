import { getSupabaseClient } from "@/lib/supabase/server"
import type { CreditFacility, CreditFacilitySnapshot } from "@/lib/supabase/types"

export type CreditFacilityWithSnapshots = CreditFacility & {
  snapshots: CreditFacilitySnapshot[]
  latest: CreditFacilitySnapshot | null
}

export async function getClientCreditFacilities(clientId: string): Promise<CreditFacilityWithSnapshots[]> {
  const supabase = getSupabaseClient()

  const { data: facilities, error: facilitiesError } = await supabase
    .from("credit_facilities")
    .select("*")
    .eq("client_id", clientId)

  if (facilitiesError) throw new Error(`getClientCreditFacilities(${clientId}): ${facilitiesError.message}`)
  if (!facilities || facilities.length === 0) return []

  const facilityIds = (facilities as CreditFacility[]).map((f) => f.facility_id)
  const { data: snapshots, error: snapshotsError } = await supabase
    .from("credit_facility_snapshots")
    .select("*")
    .in("facility_id", facilityIds)
    .order("snapshot_date", { ascending: true })

  if (snapshotsError) throw new Error(`getClientCreditFacilities(${clientId}) snapshots: ${snapshotsError.message}`)

  return (facilities as CreditFacility[]).map((facility) => {
    const facilitySnapshots = (snapshots as CreditFacilitySnapshot[]).filter(
      (s) => s.facility_id === facility.facility_id,
    )
    return {
      ...facility,
      snapshots: facilitySnapshots,
      latest: facilitySnapshots.at(-1) ?? null,
    }
  })
}
