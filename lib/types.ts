// ============================================================
// CCG Monte Calvário — Tipos TypeScript
// Espelha exatamente o schema.sql do Supabase
// ============================================================

export type Badge = 'Diamante' | 'Ouro' | 'Prata' | 'Bronze'
export type MuralStatus = 'approved' | 'pending' | 'rejected'
export type UpdateType = 'milestone' | 'update' | 'thanks' | 'urgent'
export type Visibility = 'public' | 'partners'
export type AdminRole = 'superadmin' | 'admin' | 'viewer'
export type Lang = 'pt' | 'en' | 'es'

export interface Campaign {
  id: string
  name: string
  goal: number
  partner_goal: number
  start_date: string
  end_date: string
  is_active: boolean
  title_pt: string
  title_en: string
  title_es: string
  desc_pt: string
  desc_en: string
  desc_es: string
  created_at: string
  updated_at: string
}

export interface MonthlyGoal {
  id: string
  campaign_id: string
  month_key: string
  month_name_pt: string
  month_name_en: string
  month_name_es: string
  month_order: number
  target: number
  raised: number
  pct_complete?: number
  remaining?: number
  created_at: string
  updated_at: string
}

export interface Donor {
  id: string
  campaign_id: string
  name: string
  initials: string
  phone: string | null
  email: string | null
  badge: Badge
  total: number
  mural_name: string | null
  mural_status: MuralStatus
  is_visible: boolean
  notes: string | null
  created_at: string
  updated_at: string
  // from donor_ranking view
  rank_position?: number
}

export interface Contribution {
  id: string
  donor_id: string
  campaign_id: string
  month_key: string
  amount: number
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  campaign_id: string
  emoji: string
  value: number
  value_label: string
  desc_pt: string
  desc_en: string
  desc_es: string
  reached: boolean
  reached_at: string | null
  sort_order: number
  created_at: string
}

export interface Update {
  id: string
  campaign_id: string
  title: string
  body: string
  type: UpdateType
  visibility: Visibility
  is_published: boolean
  published_at: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ActivityFeedItem {
  id: string
  campaign_id: string
  donor_id: string | null
  donor_name: string
  donor_initials: string
  action_pt: string
  action_en: string
  action_es: string
  amount: string | null
  is_visible: boolean
  created_at: string
}

export interface AdminProfile {
  id: string
  name: string
  role: AdminRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  user_email: string | null
  action: string
  entity: string | null
  entity_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface Settings {
  id: string
  campaign_id: string
  badge_diamante: number
  badge_ouro: number
  badge_prata: number
  badge_bronze: number
  updated_at: string
}

// ── VIEW TYPES ──
export interface CampaignSummary {
  id: string
  name: string
  goal: number
  partner_goal: number
  start_date: string
  end_date: string
  total_partners: number
  total_raised: number
  pct_complete: number
  remaining: number
}

// ── DONOR WITH CONTRIBUTIONS ──
export interface DonorWithContributions extends Donor {
  contributions: Contribution[]
}

// ── FORM TYPES ──
export interface DonorFormData {
  name: string
  phone: string
  email: string
  badge: Badge
  mural_name: string
  mural_status: MuralStatus
  jun: number
  jul: number
  ago: number
  set: number
}

export interface MonthlyGoalFormData {
  month_key: string
  raised: number
  target: number
}
