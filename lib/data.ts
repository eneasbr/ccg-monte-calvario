// ============================================================
// CCG Monte Calvário — Funções de dados
// Todas as queries ao Supabase centralizadas aqui
// ============================================================
import { createClient } from './supabase'
import type {
  CampaignSummary, MonthlyGoal, Donor,
  Milestone, ActivityFeedItem, Update,
  Contribution, AdminProfile, AuditLog, Settings,
  DonorFormData, MonthlyGoalFormData
} from './types'

// ── DASHBOARD PÚBLICO ──────────────────────────────────────

export async function getCampaignSummary(): Promise<CampaignSummary | null> {
  const sb = createClient()
  const { data, error } = await sb
    .from('campaign_summary')
    .select('*')
    .single()
  if (error) { console.error(error); return null }
  return data
}

export async function getMonthlyGoals(): Promise<MonthlyGoal[]> {
  const sb = createClient()
  const { data, error } = await sb
    .from('monthly_summary')
    .select('*')
    .order('month_order')
  if (error) { console.error(error); return [] }
  return data || []
}

export async function getDonorRanking(): Promise<Donor[]> {
  const sb = createClient()
  const { data, error } = await sb
    .from('donor_ranking')
    .select('*')
    .limit(20)
  if (error) { console.error(error); return [] }
  return data || []
}

export async function getMilestones(): Promise<Milestone[]> {
  const sb = createClient()
  const { data, error } = await sb
    .from('milestones')
    .select('*')
    .order('sort_order')
  if (error) { console.error(error); return [] }
  return data || []
}

export async function getActivityFeed(): Promise<ActivityFeedItem[]> {
  const sb = createClient()
  const { data, error } = await sb
    .from('activity_feed')
    .select('*')
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) { console.error(error); return [] }
  return data || []
}

export async function getPublicUpdates(): Promise<Update[]> {
  const sb = createClient()
  const { data, error } = await sb
    .from('updates')
    .select('*')
    .eq('is_published', true)
    .eq('visibility', 'public')
    .order('published_at', { ascending: false })
    .limit(10)
  if (error) { console.error(error); return [] }
  return data || []
}

// ── ADMIN ──────────────────────────────────────────────────

export async function getAllDonors(): Promise<Donor[]> {
  const sb = createClient()
  const { data, error } = await sb
    .from('donors')
    .select('*')
    .order('total', { ascending: false })
  if (error) { console.error(error); return [] }
  return data || []
}

export async function getDonorWithContributions(id: string) {
  const sb = createClient()
  const { data, error } = await sb
    .from('donors')
    .select('*, contributions(*)')
    .eq('id', id)
    .single()
  if (error) { console.error(error); return null }
  return data
}

export async function createDonor(donor: DonorFormData, campaignId: string) {
  const sb = createClient()
  const initials = donor.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  const { data: donorData, error: donorError } = await sb
    .from('donors')
    .insert({
      campaign_id: campaignId,
      name: donor.name,
      initials,
      phone: donor.phone || null,
      email: donor.email || null,
      badge: donor.badge,
      mural_name: donor.mural_name || donor.name,
      mural_status: donor.mural_status || 'pending',
    })
    .select()
    .single()

  if (donorError || !donorData) { console.error(donorError); return null }

  // Inserir contribuições mensais
  const monthKeys = ['junho', 'julho', 'agosto', 'setembro']
  const amounts = [donor.jun, donor.jul, donor.ago, donor.set]
  const contributions = monthKeys
    .map((month_key, i) => ({
      donor_id: donorData.id,
      campaign_id: campaignId,
      month_key,
      amount: amounts[i] || 0,
    }))
    .filter(c => c.amount > 0)

  if (contributions.length > 0) {
    const { error: contribError } = await sb
      .from('contributions')
      .insert(contributions)
    if (contribError) console.error(contribError)
  }

  return donorData
}

export async function updateDonor(id: string, donor: Partial<DonorFormData>, campaignId: string) {
  const sb = createClient()
  const initials = donor.name
    ? donor.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : undefined

  const { error } = await sb
    .from('donors')
    .update({
      ...(donor.name && { name: donor.name, initials }),
      ...(donor.phone !== undefined && { phone: donor.phone || null }),
      ...(donor.email !== undefined && { email: donor.email || null }),
      ...(donor.badge && { badge: donor.badge }),
      ...(donor.mural_name !== undefined && { mural_name: donor.mural_name }),
      ...(donor.mural_status && { mural_status: donor.mural_status }),
    })
    .eq('id', id)

  if (error) { console.error(error); return false }

  // Atualizar contribuições mensais
  const monthKeys = ['junho', 'julho', 'agosto', 'setembro']
  const amounts = [donor.jun, donor.jul, donor.ago, donor.set]

  for (let i = 0; i < monthKeys.length; i++) {
    if (amounts[i] === undefined) continue
    await sb.from('contributions').upsert({
      donor_id: id,
      campaign_id: campaignId,
      month_key: monthKeys[i],
      amount: amounts[i] || 0,
    }, { onConflict: 'donor_id,month_key' })
  }

  return true
}

export async function deleteDonor(id: string) {
  const sb = createClient()
  const { error } = await sb.from('donors').delete().eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

export async function updateMonthlyGoal(id: string, data: Partial<MonthlyGoalFormData>) {
  const sb = createClient()
  const { error } = await sb
    .from('monthly_goals')
    .update(data)
    .eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

export async function getAllUpdates(): Promise<Update[]> {
  const sb = createClient()
  const { data, error } = await sb
    .from('updates')
    .select('*')
    .order('published_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return data || []
}

export async function createUpdate(update: {
  campaign_id: string
  title: string
  body: string
  type: string
  visibility: string
}) {
  const sb = createClient()
  const { data, error } = await sb
    .from('updates')
    .insert(update)
    .select()
    .single()
  if (error) { console.error(error); return null }
  return data
}

export async function deleteUpdate(id: string) {
  const sb = createClient()
  const { error } = await sb.from('updates').delete().eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

export async function getSettings(): Promise<Settings | null> {
  const sb = createClient()
  const { data, error } = await sb.from('settings').select('*').single()
  if (error) { console.error(error); return null }
  return data
}

export async function updateSettings(id: string, settings: Partial<Settings>) {
  const sb = createClient()
  const { error } = await sb.from('settings').update(settings).eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

export async function getAdminProfiles(): Promise<AdminProfile[]> {
  const sb = createClient()
  const { data, error } = await sb.from('admin_profiles').select('*')
  if (error) { console.error(error); return [] }
  return data || []
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const sb = createClient()
  const { data, error } = await sb
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) { console.error(error); return [] }
  return data || []
}

export async function insertAuditLog(log: {
  user_email: string
  action: string
  entity?: string
  entity_id?: string
  old_data?: Record<string, unknown>
  new_data?: Record<string, unknown>
}) {
  const sb = createClient()
  await sb.from('audit_logs').insert(log)
}

// ── CSV IMPORT ─────────────────────────────────────────────

export async function importDonorsFromCSV(
  rows: DonorFormData[],
  campaignId: string
) {
  const results = await Promise.all(
    rows.map(row => createDonor(row, campaignId))
  )
  return results.filter(Boolean).length
}
