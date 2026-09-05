// Shared UI-facing types that aren't a direct database row shape — mostly
// classifications computed by the service layer (e.g. services/cockpit.ts).

export type Priority = "ACTION REQUIRED" | "RM CHECK-IN" | "FOLLOW-UP" | "REVIEW"
