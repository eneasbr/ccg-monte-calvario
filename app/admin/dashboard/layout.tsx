import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sb = await createServerSupabaseClient()
  const { data: { session } } = await sb.auth.getSession()
  if (!session) redirect('/admin')
  return <>{children}</>
}