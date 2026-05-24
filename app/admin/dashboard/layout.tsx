import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sb = createServerSupabaseClient()
  const { data: { session } } = await sb.auth.getSession()
  if (!session) redirect('/admin')
  return <>{children}</>
}
