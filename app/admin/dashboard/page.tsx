'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type {
  CampaignSummary, MonthlyGoal, Donor,
  Milestone, Update, AuditLog, AdminProfile,
  Badge, MuralStatus
} from '@/lib/types'

// ── HELPERS ──
function fk(n: number) {
  return n >= 1000 ? 'R$' + (n / 1000).toFixed(1).replace('.0', '') + 'k' : 'R$' + n
}
function fmtFull(n: number) {
  return 'R$ ' + n.toLocaleString('pt-BR')
}
function now() {
  const d = new Date()
  return `${d.toLocaleDateString('pt-BR')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}
function badgeColor(b: Badge) {
  return {
    Diamante: { bg: 'rgba(147,210,255,.12)', color: '#93D2FF', border: 'rgba(147,210,255,.2)' },
    Ouro:     { bg: 'rgba(255,215,0,.12)',   color: '#FFD700', border: 'rgba(255,215,0,.2)' },
    Prata:    { bg: 'rgba(192,192,192,.12)', color: '#D8D8D8', border: 'rgba(192,192,192,.2)' },
    Bronze:   { bg: 'rgba(205,127,50,.12)',  color: '#E8A060', border: 'rgba(205,127,50,.2)' },
  }[b]
}

// ── PAGE TITLES ──
const PAGE_TITLES: Record<string, string> = {
  'visao-geral': 'Visão Geral',
  metas: 'Metas Mensais',
  parceiros: 'Gerenciar Parceiros',
  ranking: 'Ranking & Pódio',
  mural: 'Mural dos Fundadores',
  updates: 'Publicar Updates',
  csv: 'Importar CSV',
  usuarios: 'Usuários & Acesso',
  config: 'Configurações',
  audit: 'Auditoria',
}

// ── TOAST ──
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([])
  const toast = useCallback((msg: string, type = 'info') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])
  return { toasts, toast }
}

// ══════════════════════════════════════════════════
export default function AdminDashboard() {
  const router = useRouter()
  const { toasts, toast } = useToast()
  const sb = createClient()

  // ── STATE ──
  const [page, setPage]         = useState('visao-geral')
  const [user, setUser]         = useState<{ email: string; role: string } | null>(null)
  const [summary, setSummary]   = useState<CampaignSummary | null>(null)
  const [months, setMonths]     = useState<MonthlyGoal[]>([])
  const [donors, setDonors]     = useState<Donor[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [updates, setUpdates]   = useState<Update[]>([])
  const [logs, setLogs]         = useState<AuditLog[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminProfile[]>([])
  const [campaignId, setCampaignId] = useState<string>('')
  const [loading, setLoading]   = useState(true)

  // donor modal
  const [donorModal, setDonorModal] = useState(false)
  const [editDonor, setEditDonor]   = useState<Donor | null>(null)
  const [dName, setDName]   = useState('')
  const [dPhone, setDPhone] = useState('')
  const [dBadge, setDBadge] = useState<Badge>('Prata')
  const [dMural, setDMural] = useState('')
  const [dJun, setDJun]     = useState(0)
  const [dJul, setDJul]     = useState(0)
  const [dAgo, setDAgo]     = useState(0)
  const [dSet, setDSet]     = useState(0)

  // update form
  const [updTitle, setUpdTitle] = useState('')
  const [updBody, setUpdBody]   = useState('')
  const [updType, setUpdType]   = useState('update')
  const [updVis, setUpdVis]     = useState('public')

  // donor search
  const [search, setSearch]     = useState('')
  const [filterBadge, setFilterBadge] = useState('')

  // ── LOAD DATA ──
  const loadAll = useCallback(async () => {
    const [s, m, d, mi, u, l] = await Promise.all([
      sb.from('campaign_summary').select('*').single(),
      sb.from('monthly_summary').select('*').order('month_order'),
      sb.from('donor_ranking').select('*'),
      sb.from('milestones').select('*').order('sort_order'),
      sb.from('updates').select('*').order('published_at', { ascending: false }),
      sb.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ])
    if (s.data) { setSummary(s.data); setCampaignId(s.data.id) }
    if (m.data) setMonths(m.data)
    if (d.data) setDonors(d.data)
    if (mi.data) setMilestones(mi.data)
    if (u.data) setUpdates(u.data)
    if (l.data) setLogs(l.data)
    setLoading(false)
  }, [sb])

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/admin'); return }
      setUser({ email: data.user.email ?? '', role: 'admin' })
    })
    loadAll()
  }, [loadAll, router, sb])

  async function addLog(action: string) {
    if (!user) return
    await sb.from('audit_logs').insert({ user_email: user.email, action })
    loadAll()
  }

  // ── LOGOUT ──
  async function logout() {
    await sb.auth.signOut()
    router.push('/admin')
  }

  // ── QUICK UPDATE ──
  async function saveQuick(raised: number, partners: number, goal: number) {
  await sb.from('campaigns').update({ 
    goal,
    raised,
    total_partners: partners 
  }).eq('id', campaignId)
  toast('Valores salvos!', 'success')
  addLog(`Total atualizado: R$ ${raised.toLocaleString('pt-BR')}`)
  loadAll()
}
    toast('Valores salvos!', 'success')
    addLog(`Total atualizado: R$ ${raised.toLocaleString('pt-BR')}`)
    loadAll()
  }

  // ── MONTHS ──
  async function saveMonths(newMonths: { id: string; raised: number }[]) {
    await Promise.all(newMonths.map(m => sb.from('monthly_goals').update({ raised: m.raised }).eq('id', m.id)))
    toast('Metas mensais salvas!', 'success')
    addLog('Metas mensais atualizadas')
    loadAll()
  }

  // ── DONORS ──
  function openAdd() {
    setEditDonor(null)
    setDName(''); setDPhone(''); setDBadge('Prata'); setDMural('')
    setDJun(0); setDJul(0); setDAgo(0); setDSet(0)
    setDonorModal(true)
  }

  function openEdit(d: Donor) {
    setEditDonor(d)
    setDName(d.name); setDPhone(d.phone ?? ''); setDBadge(d.badge); setDMural(d.mural_name ?? '')
    setDonorModal(true)
  }

  async function saveDonor() {
    if (!dName.trim()) { toast('Nome obrigatório', 'error'); return }
    const initials = dName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    const months = ['junho','julho','agosto','setembro']
    const amounts = [dJun, dJul, dAgo, dSet]

    if (editDonor) {
      await sb.from('donors').update({ name: dName, initials, phone: dPhone || null, badge: dBadge, mural_name: dMural || dName }).eq('id', editDonor.id)
      for (let i = 0; i < months.length; i++) {
        await sb.from('contributions').upsert({ donor_id: editDonor.id, campaign_id: campaignId, month_key: months[i], amount: amounts[i] }, { onConflict: 'donor_id,month_key' })
      }
      toast(`${dName} atualizado!`, 'success')
      addLog(`Parceiro editado: ${dName}`)
    } else {
      const { data: nd } = await sb.from('donors').insert({ campaign_id: campaignId, name: dName, initials, phone: dPhone || null, badge: dBadge, mural_name: dMural || dName, mural_status: 'pending' }).select().single()
      if (nd) {
        const contribs = months.map((mk, i) => ({ donor_id: nd.id, campaign_id: campaignId, month_key: mk, amount: amounts[i] })).filter(c => c.amount > 0)
        if (contribs.length) await sb.from('contributions').insert(contribs)
      }
      toast(`${dName} adicionado!`, 'success')
      addLog(`Novo parceiro: ${dName}`)
    }
    setDonorModal(false)
    loadAll()
  }

  async function deleteDonor(d: Donor) {
    if (!confirm(`Remover "${d.name}"?`)) return
    await sb.from('donors').delete().eq('id', d.id)
    toast(`${d.name} removido.`, 'info')
    addLog(`Parceiro removido: ${d.name}`)
    loadAll()
  }

  async function toggleMural(d: Donor) {
    const ms: MuralStatus = d.mural_status === 'approved' ? 'pending' : 'approved'
    await sb.from('donors').update({ mural_status: ms }).eq('id', d.id)
    toast(ms === 'approved' ? `${d.name} aprovado!` : `${d.name} movido para pendente.`, 'success')
    loadAll()
  }

  // ── UPDATES ──
  async function publishUpdate() {
    if (!updTitle || !updBody) { toast('Título e mensagem obrigatórios', 'error'); return }
    await sb.from('updates').insert({ campaign_id: campaignId, title: updTitle, body: updBody, type: updType, visibility: updVis })
    setUpdTitle(''); setUpdBody('')
    toast('Update publicado!', 'success')
    addLog(`Update publicado: "${updTitle}"`)
    loadAll()
  }

  async function deleteUpdate(u: Update) {
    await sb.from('updates').delete().eq('id', u.id)
    toast('Update removido.', 'info')
    loadAll()
  }

  // ── CSV ──
  async function handleCSV(file: File) {
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    let count = 0
    for (const [li, line] of lines.entries()) {
      const cols = line.split(',').map(c => c.trim())
      if (li === 0 && isNaN(Number(cols[2]))) continue
      if (cols.length < 6) continue
      const name = cols[0]; const phone = cols[1]
      const amounts = [parseInt(cols[2])||0, parseInt(cols[3])||0, parseInt(cols[4])||0, parseInt(cols[5])||0]
      const total = parseInt(cols[6]) || amounts.reduce((s,v) => s+v, 0)
      const badge = (cols[7] || 'Bronze') as Badge
      const initials = name.split(' ').map((w:string) => w[0]).slice(0,2).join('').toUpperCase()
      const { data: nd } = await sb.from('donors').insert({ campaign_id: campaignId, name, initials, phone: phone||null, badge, mural_name: name, mural_status: 'pending' }).select().single()
      if (nd) {
        const months = ['junho','julho','agosto','setembro']
        const contribs = months.map((mk,i) => ({ donor_id: nd.id, campaign_id: campaignId, month_key: mk, amount: amounts[i] })).filter(c => c.amount > 0)
        if (contribs.length) await sb.from('contributions').insert(contribs)
        count++
      }
    }
    toast(`${count} parceiros importados!`, 'success')
    addLog(`CSV importado: ${count} parceiros`)
    loadAll()
  }

  function exportCSV() {
    const hdr = 'nome,whatsapp,junho,julho,agosto,setembro,total,badge\n'
    const rows = donors.map(d => `${d.name},${d.phone||''},,,,,${d.total},${d.badge}`).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([hdr+rows], { type: 'text/csv' }))
    a.download = 'parceiros-ccg.csv'; a.click()
    toast('CSV baixado!', 'success')
  }

  // ── FILTERED DONORS ──
  const filteredDonors = donors.filter(d =>
    (!search || d.name.toLowerCase().includes(search.toLowerCase())) &&
    (!filterBadge || d.badge === filterBadge)
  )

  const pct = summary ? Math.min(100, Math.round(summary.pct_complete)) : 0
  const avg = summary && summary.total_partners > 0 ? Math.round(summary.total_raised / summary.total_partners) : 0
  const top3 = [...donors].slice(0, 3)
  const podiumOrder = [top3[1], top3[0], top3[2]]
  const medals = ['🥇','🥈','🥉']

  // ── NAV ──
  function navTo(id: string) {
    setPage(id)
  }

  // ── STYLES ──
  const S = {
    card: { background:'var(--bg2)', border:'1px solid var(--border-light)', borderRadius:'14px', overflow:'hidden', marginBottom:'1.25rem' } as React.CSSProperties,
    cardHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.9rem 1.25rem', borderBottom:'1px solid var(--border-light)', gap:'10px', flexWrap:'wrap' as const },
    cardBody: { padding:'1.25rem' },
    label: { display:'block', fontSize:'11px', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase' as const, letterSpacing:'.08em', marginBottom:'6px' },
    input: { width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'10px', padding:'10px 14px', color:'var(--text)', fontFamily:'DM Sans,sans-serif', fontSize:'14px', outline:'none' } as React.CSSProperties,
    select: { width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'10px', padding:'10px 14px', color:'var(--text)', fontFamily:'DM Sans,sans-serif', fontSize:'14px', outline:'none', cursor:'pointer', appearance:'none' as const },
    btnPrimary: { background:'var(--accent)', color:'#fff', fontFamily:'DM Sans,sans-serif', fontSize:'12px', fontWeight:600, padding:'7px 14px', border:'none', borderRadius:'8px', cursor:'pointer' } as React.CSSProperties,
    btnOutline: { background:'transparent', color:'var(--text-muted)', fontFamily:'DM Sans,sans-serif', fontSize:'12px', fontWeight:500, padding:'7px 14px', border:'1px solid var(--border)', borderRadius:'8px', cursor:'pointer' } as React.CSSProperties,
    btnDanger: { background:'rgba(224,92,92,.1)', color:'var(--red)', fontFamily:'DM Sans,sans-serif', fontSize:'11px', fontWeight:600, padding:'5px 10px', border:'1px solid rgba(224,92,92,.2)', borderRadius:'6px', cursor:'pointer' } as React.CSSProperties,
    ni: (active: boolean) => ({ display:'flex', alignItems:'center', gap:'10px', padding:'9px 10px', borderRadius:'8px', cursor:'pointer', color: active ? 'var(--accent-light)' : 'var(--text-muted)', fontSize:'13px', fontWeight:500, marginBottom:'2px', border: active ? '1px solid rgba(74,144,217,.15)' : '1px solid transparent', background: active ? 'rgba(74,144,217,.12)' : 'none', width:'100%', textAlign:'left' as const }),
    statCard: { background:'var(--bg2)', border:'1px solid var(--border-light)', borderRadius:'12px', padding:'1rem 1.1rem' } as React.CSSProperties,
    g2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' } as React.CSSProperties,
    g4: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' } as React.CSSProperties,
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>

      {/* SIDEBAR */}
      <aside style={{ width:'240px', background:'var(--bg2)', borderRight:'1px solid var(--border-light)', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, height:'100vh', zIndex:50, overflowY:'auto' }}>
        <div style={{ padding:'1.25rem', borderBottom:'1px solid var(--border-light)', display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
          <div style={{ width:'34px', height:'34px', background:'linear-gradient(135deg,var(--brand),var(--brand-light))', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'13px', color:'#fff', fontFamily:'Montserrat,sans-serif', flexShrink:0 }}>MC</div>
          <div>
            <div style={{ fontSize:'12px', fontWeight:600, color:'var(--text)' }}>Founding Partners</div>
            <div style={{ fontSize:'10px', color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'.05em' }}>CCG Monte Calvário</div>
          </div>
        </div>

        <nav style={{ flex:1, padding:'.75rem' }}>
          {[
            { group:'Principal', items:[{id:'visao-geral',icon:'📊',label:'Visão Geral'},{id:'metas',icon:'🎯',label:'Metas Mensais'}] },
            { group:'Parceiros', items:[{id:'parceiros',icon:'👥',label:'Gerenciar Parceiros'},{id:'ranking',icon:'🏆',label:'Ranking & Pódio'},{id:'mural',icon:'🏛️',label:'Mural dos Fundadores'}] },
            { group:'Conteúdo', items:[{id:'updates',icon:'📣',label:'Publicar Updates'},{id:'csv',icon:'📤',label:'Importar CSV'}] },
            { group:'Sistema', items:[{id:'usuarios',icon:'🔐',label:'Usuários & Acesso'},{id:'config',icon:'⚙️',label:'Configurações'},{id:'audit',icon:'📋',label:'Auditoria'}] },
          ].map(g => (
            <div key={g.group}>
              <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.15em', textTransform:'uppercase', color:'var(--text-dim)', padding:'0 8px', margin:'1rem 0 .3rem' }}>{g.group}</div>
              {g.items.map(item => (
                <button key={item.id} style={S.ni(page===item.id)} onClick={() => navTo(item.id)}>
                  <span style={{ fontSize:'15px', width:'20px', textAlign:'center' }}>{item.icon}</span>{item.label}
                </button>
              ))}
            </div>
          ))}
          <div>
            <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.15em', textTransform:'uppercase', color:'var(--text-dim)', padding:'0 8px', margin:'1rem 0 .3rem' }}>Atalhos</div>
            <button style={S.ni(false)} onClick={() => window.open('/', '_blank')}>
              <span style={{ fontSize:'15px', width:'20px', textAlign:'center' }}>🌐</span>Ver Dashboard Público
            </button>
          </div>
        </nav>

        <div style={{ padding:'.75rem', borderTop:'1px solid var(--border-light)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px', borderRadius:'8px', background:'var(--bg3)', marginBottom:'8px' }}>
            <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,var(--brand),var(--accent))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#fff', flexShrink:0 }}>
              {user?.email?.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:'12px', fontWeight:600, color:'var(--text)' }}>{user?.email?.split('@')[0]}</div>
              <div style={{ fontSize:'10px', color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'.05em' }}>Admin</div>
            </div>
          </div>
          <button onClick={logout} style={{ ...S.btnOutline, width:'100%', justifyContent:'center', display:'flex' }}>↩ Sair</button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft:'240px', flex:1, minHeight:'100vh' }}>

        {/* TOPBAR */}
        <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(6,12,20,.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--border-light)', padding:'0 1.5rem', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontFamily:'Montserrat,sans-serif', fontSize:'15px', fontWeight:600, color:'var(--text)' }}>{PAGE_TITLES[page]}</span>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', fontWeight:600, color:'var(--green)', textTransform:'uppercase', letterSpacing:'.08em' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--green)', display:'inline-block', animation:'pulse 2s infinite' }}/>Ao vivo
            </div>
            <button style={S.btnOutline} onClick={loadAll}>↺ Sincronizar</button>
            <button style={S.btnPrimary} onClick={() => { navTo('parceiros'); openAdd() }}>+ Parceiro</button>
          </div>
        </div>

        <div style={{ padding:'1.5rem', maxWidth:'1200px' }}>

          {/* ══ VISÃO GERAL ══ */}
          {page === 'visao-geral' && (
            <div>
              <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.15em', textTransform:'uppercase', color:'var(--accent)', marginBottom:'.3rem' }}>Painel de controle</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:'1.4rem', fontWeight:700, color:'var(--text)', marginBottom:'1.25rem' }}>Visão Geral da Campanha</div>

              {/* Progress hero */}
              <div style={{ background:'linear-gradient(135deg,var(--bg2) 0%,rgba(0,32,71,.3) 100%)', border:'1px solid var(--border)', borderRadius:'16px', padding:'1.5rem', marginBottom:'1.25rem' }}>
                <div style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'var(--text-dim)', marginBottom:'.3rem' }}>Total levantado</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:'2.4rem', fontWeight:300, color:'var(--text)', lineHeight:1, marginBottom:'.25rem' }}>{loading ? '—' : fmtFull(summary?.total_raised ?? 0)}</div>
                <div style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'1rem' }}>Meta: <strong style={{ color:'var(--accent-light)' }}>R$ 200.000</strong></div>
                <div style={{ height:'10px', background:'var(--bg4)', borderRadius:'5px', overflow:'hidden', marginBottom:'.5rem' }}>
                  <div style={{ height:'100%', borderRadius:'5px', width:`${pct}%`, background:'linear-gradient(90deg,var(--brand),var(--accent),var(--accent-light))', transition:'width 1.2s ease' }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'var(--text-muted)' }}>
                  <span><strong style={{ color:'var(--accent-light)' }}>{pct}%</strong> concluído</span>
                  <span>Faltam <strong style={{ color:'var(--accent-light)' }}>{loading ? '—' : fmtFull(summary?.remaining ?? 200000)}</strong></span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ ...S.g4, marginBottom:'1.25rem' }}>
                {[
                  { label:'Parceiros', val: loading ? '—' : String(summary?.total_partners ?? 0), delta:'↑ meta: 100', deltaColor:'var(--green)' },
                  { label:'Média/Parceiro', val: loading ? '—' : fk(avg), delta:'', deltaColor:'' },
                  { label:'% Concluído', val: `${pct}%`, delta:'', deltaColor:'' },
                  { label:'Prazo', val:'Set/25', delta:'4 meses', deltaColor:'var(--yellow)' },
                ].map((s,i) => (
                  <div key={i} style={S.statCard}>
                    <div style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-dim)', marginBottom:'.4rem' }}>{s.label}</div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:'1.6rem', fontWeight:300, color:'var(--text)', lineHeight:1 }}>{s.val}</div>
                    {s.delta && <div style={{ fontSize:'11px', marginTop:'4px', fontWeight:500, color:s.deltaColor }}>{s.delta}</div>}
                  </div>
                ))}
              </div>

              <div style={S.g2}>
                {/* Quick update */}
                <QuickUpdate summary={summary} onSave={saveQuick} S={S} />
                {/* Mini log */}
                <div style={S.card}>
                  <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>📋 Atividade recente</span><button style={S.btnOutline} onClick={() => navTo('audit')}>Ver tudo →</button></div>
                  <div style={{ padding:'.25rem 1.25rem' }}>
                    {logs.slice(0,5).map(l => (
                      <div key={l.id} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'11px 0', borderBottom:'1px solid var(--border-light)' }}>
                        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--accent)', marginTop:'5px', flexShrink:0 }}/>
                        <div><div style={{ fontSize:'13px', color:'var(--text)' }}>{l.action}</div><div style={{ fontSize:'11px', color:'var(--text-dim)' }}>{l.user_email} · {new Date(l.created_at).toLocaleString('pt-BR')}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ METAS ══ */}
          {page === 'metas' && (
            <MonthsPage months={months} onSave={saveMonths} S={S} />
          )}

          {/* ══ PARCEIROS ══ */}
          {page === 'parceiros' && (
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:'1.4rem', fontWeight:700, color:'var(--text)', marginBottom:'1.25rem' }}>Gerenciar Parceiros</div>
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>Lista <span style={{ color:'var(--text-dim)', fontWeight:400 }}>({filteredDonors.length})</span></span>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    <input placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, padding:'7px 12px', fontSize:'13px', width:'180px' }}/>
                    <select value={filterBadge} onChange={e => setFilterBadge(e.target.value)} style={{ ...S.select, padding:'7px 12px', fontSize:'13px', width:'130px' }}>
                      <option value="">Todos</option>
                      {['Diamante','Ouro','Prata','Bronze'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <button style={S.btnPrimary} onClick={openAdd}>+ Novo parceiro</button>
                  </div>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>{['#','Parceiro','WhatsApp','Jun','Jul','Ago','Set','Total','Nível','Mural','Ações'].map(h => (
                        <th key={h} style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--text-dim)', textAlign:'left', padding:'10px 14px', borderBottom:'1px solid var(--border-light)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {filteredDonors.map((d,i) => {
                        const bc = badgeColor(d.badge)
                        return (
                          <tr key={d.id}>
                            <td style={{ padding:'11px 14px', fontSize:'13px', color:'var(--text-dim)', fontWeight:600, borderBottom:'1px solid var(--border-light)' }}>{i+1}</td>
                            <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border-light)' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                <span style={{ width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,var(--brand),var(--accent))', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'#fff', flexShrink:0 }}>{d.initials}</span>
                                <span style={{ fontSize:'13px', color:'var(--text)' }}>{d.name}</span>
                              </div>
                            </td>
                            <td style={{ padding:'11px 14px', fontSize:'13px', color:'var(--text-muted)', borderBottom:'1px solid var(--border-light)' }}>{d.phone || '—'}</td>
                            <td style={{ padding:'11px 14px', fontSize:'13px', color:'var(--text)', borderBottom:'1px solid var(--border-light)' }}>—</td>
                            <td style={{ padding:'11px 14px', fontSize:'13px', color:'var(--text)', borderBottom:'1px solid var(--border-light)' }}>—</td>
                            <td style={{ padding:'11px 14px', fontSize:'13px', color:'var(--text)', borderBottom:'1px solid var(--border-light)' }}>—</td>
                            <td style={{ padding:'11px 14px', fontSize:'13px', color:'var(--text)', borderBottom:'1px solid var(--border-light)' }}>—</td>
                            <td style={{ padding:'11px 14px', fontSize:'13px', fontWeight:600, color:'var(--accent-light)', borderBottom:'1px solid var(--border-light)' }}>{fk(d.total)}</td>
                            <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border-light)' }}><span style={{ display:'inline-flex', fontSize:'10px', fontWeight:600, padding:'3px 9px', borderRadius:'100px', background:bc?.bg, color:bc?.color, border:`1px solid ${bc?.border}`, textTransform:'uppercase', letterSpacing:'.05em' }}>{d.badge}</span></td>
                            <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border-light)' }}>
                              <span onClick={() => toggleMural(d)} style={{ cursor:'pointer', display:'inline-flex', fontSize:'10px', fontWeight:600, padding:'3px 9px', borderRadius:'100px', background:d.mural_status==='approved'?'rgba(76,175,125,.12)':'rgba(240,180,41,.12)', color:d.mural_status==='approved'?'var(--green)':'var(--yellow)', border:`1px solid ${d.mural_status==='approved'?'rgba(76,175,125,.2)':'rgba(240,180,41,.2)'}` }}>
                                {d.mural_status==='approved'?'✓ Aprovado':'⏳ Pendente'}
                              </span>
                            </td>
                            <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border-light)', whiteSpace:'nowrap' }}>
                              <button style={S.btnOutline} onClick={() => openEdit(d)}>Editar</button>{' '}
                              <button style={S.btnDanger} onClick={() => deleteDonor(d)}>✕</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ RANKING ══ */}
          {page === 'ranking' && (
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:'1.4rem', fontWeight:700, color:'var(--text)', marginBottom:'1.25rem' }}>Ranking & Pódio</div>
              <div style={S.g2}>
                <div style={S.card}>
                  <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>👑 Pódio atual</span></div>
                  <div style={{ padding:'1.25rem' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1.15fr 1fr', gap:'10px', alignItems:'end' }}>
                      {podiumOrder.map((d,vi) => {
                        if (!d) return <div key={vi}/>
                        const r = top3.indexOf(d); const isF = r===0
                        return (
                          <div key={d.id} style={{ background:isF?'linear-gradient(180deg,rgba(74,144,217,.08) 0%,var(--bg2) 100%)':'var(--bg2)', border:`1px solid ${isF?'var(--border)':'var(--border-light)'}`, borderRadius:'14px', padding:isF?'1.75rem 1rem 1rem':'1rem', textAlign:'center', position:'relative' }}>
                            {isF && <span style={{ position:'absolute', top:'-14px', left:'50%', transform:'translateX(-50%)', fontSize:'22px' }}>👑</span>}
                            <div style={{ width:isF?'52px':'44px', height:isF?'52px':'44px', borderRadius:'50%', background:'linear-gradient(135deg,var(--brand),var(--accent))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:isF?'18px':'15px', fontWeight:600, color:'var(--bg)', margin:'0 auto .5rem' }}>{d.initials}</div>
                            <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text)', marginBottom:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</div>
                            <div style={{ fontSize:'12px', color:'var(--accent-light)', fontWeight:600 }}>{fk(d.total)}</div>
                            <div style={{ marginTop:'6px' }}><span style={{ fontSize:'10px', fontWeight:600, padding:'2px 8px', borderRadius:'100px', background:'rgba(255,215,0,.12)', color:'#FFD700', border:'1px solid rgba(255,215,0,.2)' }}>{medals[r]} {d.badge}</span></div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>🏆 Top 10</span></div>
                  <div style={{ padding:'.25rem 1.25rem' }}>
                    {donors.slice(0,10).map((d,i) => {
                      const bc = badgeColor(d.badge)
                      return (
                        <div key={d.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 0', borderBottom:'1px solid var(--border-light)' }}>
                          <span style={{ fontSize:'12px', fontWeight:700, color:'var(--text-dim)', width:'20px', textAlign:'center' }}>{i+1}</span>
                          <span style={{ width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,var(--brand),var(--accent))', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'#fff', flexShrink:0 }}>{d.initials}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:'13px', fontWeight:500, color:'var(--text)' }}>{d.name}</div>
                            <span style={{ fontSize:'10px', fontWeight:600, padding:'1px 6px', borderRadius:'100px', background:bc?.bg, color:bc?.color, border:`1px solid ${bc?.border}` }}>{d.badge}</span>
                          </div>
                          <span style={{ fontSize:'13px', fontWeight:600, color:'var(--accent-light)' }}>{fk(d.total)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ MURAL ══ */}
          {page === 'mural' && (
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:'1.4rem', fontWeight:700, color:'var(--text)', marginBottom:'1.25rem' }}>Mural dos Fundadores</div>
              <div style={S.g2}>
                <div style={S.card}>
                  <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>✅ Aprovados</span><span style={{ fontSize:'10px', fontWeight:600, padding:'3px 9px', borderRadius:'100px', background:'rgba(76,175,125,.12)', color:'var(--green)', border:'1px solid rgba(76,175,125,.2)' }}>{donors.filter(d=>d.mural_status==='approved').length} nomes</span></div>
                  <div style={{ ...S.cardBody, display:'flex', flexWrap:'wrap', gap:'8px' }}>
                    {donors.filter(d=>d.mural_status==='approved').map(d => (
                      <span key={d.id} onClick={() => toggleMural(d)} style={{ cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontSize:'13px', color:'var(--green)', padding:'6px 14px', border:'1px solid rgba(76,175,125,.3)', borderRadius:'100px', background:'rgba(76,175,125,.06)' }}>{d.mural_name||d.name} ✓</span>
                    ))}
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>⏳ Pendentes</span><span style={{ fontSize:'10px', fontWeight:600, padding:'3px 9px', borderRadius:'100px', background:'rgba(240,180,41,.12)', color:'var(--yellow)', border:'1px solid rgba(240,180,41,.2)' }}>{donors.filter(d=>d.mural_status==='pending').length}</span></div>
                  <div style={{ ...S.cardBody, display:'flex', flexWrap:'wrap', gap:'8px' }}>
                    {donors.filter(d=>d.mural_status==='pending').map(d => (
                      <span key={d.id} onClick={() => toggleMural(d)} title="Clique para aprovar" style={{ cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontSize:'13px', color:'var(--yellow)', padding:'6px 14px', border:'1px solid rgba(240,180,41,.3)', borderRadius:'100px', background:'rgba(240,180,41,.06)' }}>{d.mural_name||d.name} ⏳</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ UPDATES ══ */}
          {page === 'updates' && (
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:'1.4rem', fontWeight:700, color:'var(--text)', marginBottom:'1.25rem' }}>Publicar Updates</div>
              <div style={S.g2}>
                <div style={S.card}>
                  <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>✏️ Novo update</span></div>
                  <div style={S.cardBody}>
                    <div style={{ marginBottom:'1rem' }}><label style={S.label}>Título</label><input value={updTitle} onChange={e=>setUpdTitle(e.target.value)} placeholder="Ex: Meta de junho atingida! 🎉" style={S.input}/></div>
                    <div style={{ marginBottom:'1rem' }}><label style={S.label}>Mensagem</label><textarea value={updBody} onChange={e=>setUpdBody(e.target.value)} rows={4} placeholder="Mensagem motivacional..." style={{ ...S.input, resize:'vertical' }}/></div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'1rem' }}>
                      <div><label style={S.label}>Tipo</label><select value={updType} onChange={e=>setUpdType(e.target.value)} style={S.select}><option value="milestone">🎉 Marco</option><option value="update">📢 Atualização</option><option value="thanks">🙏 Agradecimento</option><option value="urgent">🔥 Urgente</option></select></div>
                      <div><label style={S.label}>Visibilidade</label><select value={updVis} onChange={e=>setUpdVis(e.target.value)} style={S.select}><option value="public">🌐 Público</option><option value="partners">👥 Parceiros</option></select></div>
                    </div>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button style={S.btnPrimary} onClick={publishUpdate}>📣 Publicar</button>
                      <button style={S.btnOutline} onClick={() => toast('Rascunho salvo!','info')}>💾 Rascunho</button>
                    </div>
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>📰 Publicados</span><span style={{ fontSize:'10px', fontWeight:600, padding:'3px 9px', borderRadius:'100px', background:'rgba(74,144,217,.12)', color:'var(--accent-light)', border:'1px solid rgba(74,144,217,.2)' }}>{updates.length}</span></div>
                  <div style={{ padding:'.25rem 1.25rem', maxHeight:'420px', overflowY:'auto' }}>
                    {updates.map(u => (
                      <div key={u.id} style={{ background:'var(--bg3)', border:'1px solid var(--border-light)', borderRadius:'12px', padding:'1rem', marginBottom:'10px' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.5rem', flexWrap:'wrap', gap:'6px' }}>
                          <span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>{u.title}</span>
                          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                            <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 8px', borderRadius:'100px', background:u.visibility==='public'?'rgba(74,144,217,.12)':'rgba(76,175,125,.12)', color:u.visibility==='public'?'var(--accent-light)':'var(--green)', border:`1px solid ${u.visibility==='public'?'rgba(74,144,217,.2)':'rgba(76,175,125,.2)'}` }}>{u.visibility==='public'?'Público':'Parceiros'}</span>
                            <span style={{ fontSize:'11px', color:'var(--text-dim)' }}>{new Date(u.published_at).toLocaleDateString('pt-BR')}</span>
                            <button style={S.btnDanger} onClick={() => deleteUpdate(u)}>✕</button>
                          </div>
                        </div>
                        <div style={{ fontSize:'13px', color:'var(--text-muted)', lineHeight:1.6 }}>{u.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ CSV ══ */}
          {page === 'csv' && (
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:'1.4rem', fontWeight:700, color:'var(--text)', marginBottom:'1.25rem' }}>Importar via CSV</div>
              <div style={S.card}>
                <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>📋 Formato esperado</span></div>
                <div style={S.cardBody}>
                  <p style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'.75rem' }}>Colunas nessa ordem:</p>
                  <div style={{ background:'var(--bg3)', border:'1px solid var(--border-light)', borderRadius:'8px', padding:'.75rem 1rem', marginBottom:'.75rem' }}><code style={{ color:'var(--accent-light)', fontSize:'12px' }}>nome, whatsapp, junho, julho, agosto, setembro, total, badge</code></div>
                  <div style={{ background:'var(--bg3)', border:'1px solid var(--border-light)', borderRadius:'8px', padding:'.75rem 1rem' }}><strong style={{ color:'var(--text)', display:'block', marginBottom:'4px', fontSize:'12px' }}>Exemplo:</strong><code style={{ color:'var(--text-dim)', fontSize:'12px' }}>Família Silva, 11999990000, 2000, 1500, 1000, 500, 5000, Diamante</code></div>
                </div>
              </div>
              <div style={S.card}>
                <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>📤 Upload</span></div>
                <div style={S.cardBody}>
                  <div
                    style={{ border:'2px dashed var(--border)', borderRadius:'12px', padding:'2.5rem 1.5rem', textAlign:'center', cursor:'pointer', background:'var(--bg3)' }}
                    onClick={() => document.getElementById('csv-input')?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) handleCSV(f) }}
                  >
                    <div style={{ fontSize:'2.5rem', marginBottom:'.75rem' }}>📂</div>
                    <div style={{ fontSize:'14px', fontWeight:600, color:'var(--text)', marginBottom:'.25rem' }}>Arraste o arquivo ou clique para selecionar</div>
                    <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>Suporta .csv</div>
                    <input id="csv-input" type="file" accept=".csv" style={{ display:'none' }} onChange={e => { if(e.target.files?.[0]) handleCSV(e.target.files[0]) }}/>
                  </div>
                </div>
              </div>
              <div style={S.card}>
                <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>📥 Exportar</span></div>
                <div style={S.cardBody}>
                  <p style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'1rem' }}>Baixe a lista atual de parceiros.</p>
                  <button style={S.btnOutline} onClick={exportCSV}>⬇ Baixar CSV completo</button>
                </div>
              </div>
            </div>
          )}

          {/* ══ USUÁRIOS ══ */}
          {page === 'usuarios' && (
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:'1.4rem', fontWeight:700, color:'var(--text)', marginBottom:'1.25rem' }}>Usuários & Permissões</div>
              <div style={S.card}>
                <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>👤 Admins cadastrados no Supabase</span></div>
                <div style={S.cardBody}>
                  <p style={{ fontSize:'13px', color:'var(--text-muted)', lineHeight:1.7, marginBottom:'1rem' }}>
                    Para cadastrar novos administradores, acesse o painel do Supabase:<br/>
                    <strong style={{ color:'var(--accent-light)' }}>Authentication → Users → Invite user</strong>
                  </p>
                  <p style={{ fontSize:'13px', color:'var(--text-muted)', lineHeight:1.7, marginBottom:'1rem' }}>
                    Após o convite, o usuário receberá um email para criar a senha. Você pode gerenciar permissões na tabela <code style={{ color:'var(--accent-light)' }}>admin_profiles</code>.
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {[{role:'👑 Super Admin', desc:'Acesso total: editar campanha, gerenciar usuários, auditoria.'},{role:'✏️ Admin', desc:'Editar parceiros, metas, publicar updates.'},{role:'👁️ Visualizador', desc:'Somente leitura.'}].map(r => (
                      <div key={r.role} style={{ background:'var(--bg3)', borderRadius:'10px', padding:'1rem' }}>
                        <div style={{ fontWeight:600, color:'var(--text)', marginBottom:'.25rem' }}>{r.role}</div>
                        <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>{r.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ CONFIG ══ */}
          {page === 'config' && (
            <ConfigPage campaignId={campaignId} sb={sb} toast={toast} S={S} />
          )}

          {/* ══ AUDIT ══ */}
          {page === 'audit' && (
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:'1.4rem', fontWeight:700, color:'var(--text)', marginBottom:'1.25rem' }}>Histórico de Ações</div>
              <div style={S.card}>
                <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>Registro completo</span><button style={S.btnDanger} onClick={async () => { if(!confirm('Limpar logs?')) return; await sb.from('audit_logs').delete().neq('id','00000000-0000-0000-0000-000000000000'); loadAll(); toast('Logs limpos.','info') }}>🗑 Limpar</button></div>
                <div style={{ padding:'.25rem 1.25rem', maxHeight:'500px', overflowY:'auto' }}>
                  {logs.map(l => (
                    <div key={l.id} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'11px 0', borderBottom:'1px solid var(--border-light)' }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--accent)', marginTop:'5px', flexShrink:0 }}/>
                      <div><div style={{ fontSize:'13px', color:'var(--text)' }}>{l.action}</div><div style={{ fontSize:'11px', color:'var(--text-dim)' }}>{l.user_email} · {new Date(l.created_at).toLocaleString('pt-BR')}</div></div>
                    </div>
                  ))}
                  {logs.length === 0 && <p style={{ fontSize:'13px', color:'var(--text-dim)', padding:'.5rem 0' }}>Nenhum log.</p>}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* DONOR MODAL */}
      {donorModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(6,12,20,.88)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={e => { if(e.target===e.currentTarget) setDonorModal(false) }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'18px', width:'100%', maxWidth:'500px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem', borderBottom:'1px solid var(--border-light)' }}>
              <span style={{ fontSize:'15px', fontWeight:600, color:'var(--text)' }}>{editDonor ? 'Editar Parceiro' : 'Novo Parceiro'}</span>
              <button onClick={() => setDonorModal(false)} style={{ background:'none', border:'none', color:'var(--text-dim)', fontSize:'22px', cursor:'pointer', lineHeight:1 }}>×</button>
            </div>
            <div style={{ padding:'1.25rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'1rem' }}>
                <div><label style={S.label}>Nome *</label><input value={dName} onChange={e=>setDName(e.target.value)} placeholder="Ex: Família Silva" style={S.input}/></div>
                <div><label style={S.label}>WhatsApp</label><input value={dPhone} onChange={e=>setDPhone(e.target.value)} placeholder="11999990000" style={S.input}/></div>
              </div>
              <div style={{ marginBottom:'1rem' }}><label style={S.label}>Badge</label><select value={dBadge} onChange={e=>setDBadge(e.target.value as Badge)} style={S.select}><option value="Diamante">💎 Diamante</option><option value="Ouro">🥇 Ouro</option><option value="Prata">🥈 Prata</option><option value="Bronze">🥉 Bronze</option></select></div>
              <div style={{ marginBottom:'1rem' }}>
                <label style={S.label}>Contribuições mensais (R$)</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
                  {[{label:'JUN',v:dJun,s:setDJun},{label:'JUL',v:dJul,s:setDJul},{label:'AGO',v:dAgo,s:setDAgo},{label:'SET',v:dSet,s:setDSet}].map(m => (
                    <div key={m.label} style={{ display:'flex', alignItems:'center', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden' }}>
                      <span style={{ fontSize:'10px', color:'var(--text-dim)', padding:'10px 8px', background:'var(--bg4)', borderRight:'1px solid var(--border)', flexShrink:0 }}>{m.label}</span>
                      <input type="number" value={m.v} onChange={e=>m.s(parseInt(e.target.value)||0)} style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--text)', fontFamily:'Montserrat,sans-serif', fontSize:'13px', padding:'10px 8px' }}/>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:'1.25rem' }}><label style={S.label}>Nome para o mural</label><input value={dMural} onChange={e=>setDMural(e.target.value)} placeholder="Como aparece na placa (opcional)" style={S.input}/></div>
            </div>
            <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid var(--border-light)', display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button style={S.btnOutline} onClick={() => setDonorModal(false)}>Cancelar</button>
              <button style={S.btnPrimary} onClick={saveDonor}>💾 Salvar parceiro</button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div style={{ position:'fixed', bottom:'1.5rem', right:'1.5rem', zIndex:999, display:'flex', flexDirection:'column', gap:'8px' }}>
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{ background:'var(--bg2)', border:`1px solid var(--border)`, borderLeft:`3px solid ${t.type==='success'?'var(--green)':t.type==='error'?'var(--red)':'var(--accent)'}`, borderRadius:'10px', padding:'12px 16px', fontSize:'13px', color:'var(--text)', display:'flex', alignItems:'center', gap:'10px', minWidth:'260px', boxShadow:'0 8px 32px rgba(0,0,0,.4)' }}>
            <span>{t.type==='success'?'✓':t.type==='error'?'✕':'ℹ'}</span><span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SUB-COMPONENTS ──

function QuickUpdate({ summary, onSave, S }: { summary: CampaignSummary | null; onSave: (r:number,p:number,g:number)=>void; S: any }) {
  const [goal, setGoal] = useState(200000)
  useEffect(() => { if(summary) { setGoal(summary.goal ?? 200000) } }, [summary])
  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>⚡ Atualização rápida</span>
        <button style={S.btnPrimary} onClick={() => onSave(0, 0, goal)}>Salvar</button>
      </div>
      <div style={S.cardBody}>
        <div style={{ marginBottom:'1rem', padding:'1rem', background:'var(--bg3)', borderRadius:'10px', border:'1px solid var(--border-light)' }}>
          <div style={{ fontSize:'11px', color:'var(--text-dim)', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'.08em' }}>Total levantado (automático)</div>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:'1.4rem', fontWeight:300, color:'var(--text)' }}>{summary ? fmtFull(summary.total_raised) : '—'}</div>
          <div style={{ fontSize:'11px', color:'var(--text-dim)', marginTop:'2px' }}>Calculado via contribuições dos parceiros</div>
        </div>
        <div style={{ marginBottom:'1rem', padding:'1rem', background:'var(--bg3)', borderRadius:'10px', border:'1px solid var(--border-light)' }}>
          <div style={{ fontSize:'11px', color:'var(--text-dim)', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'.08em' }}>Parceiros ativos (automático)</div>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:'1.4rem', fontWeight:300, color:'var(--text)' }}>{summary?.total_partners ?? '—'}</div>
          <div style={{ fontSize:'11px', color:'var(--text-dim)', marginTop:'2px' }}>Calculado via cadastro de parceiros</div>
        </div>
        <div>
          <label style={S.label}>Meta total (R$)</label>
          <div style={{ display:'flex', alignItems:'center', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden' }}>
            <span style={{ fontSize:'12px', color:'var(--text-dim)', padding:'10px 12px', background:'var(--bg4)', borderRight:'1px solid var(--border)' }}>R$</span>
            <input type="number" value={goal} onChange={e=>setGoal(parseInt(e.target.value)||200000)} style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--text)', fontFamily:'Montserrat,sans-serif', fontSize:'14px', padding:'10px 12px' }}/>
          </div>
        </div>
      </div>
    </div>
  )
}

function MonthsPage({ months, onSave, S }: { months: MonthlyGoal[]; onSave: (m:{id:string;raised:number}[])=>void; S: any }) {
  const [vals, setVals] = useState<Record<string,number>>({})
  useEffect(() => { const v: Record<string,number> = {}; months.forEach(m => { v[m.id] = m.raised }); setVals(v) }, [months])
  return (
    <div>
      <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:'1.4rem', fontWeight:700, color:'var(--text)', marginBottom:'1.25rem' }}>Metas Mensais</div>
      <div style={S.card}>
        <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>Editar valores arrecadados</span><button style={S.btnPrimary} onClick={() => onSave(months.map(m => ({ id:m.id, raised: vals[m.id]??m.raised })))}>💾 Salvar todos</button></div>
        <div style={S.cardBody}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' }}>
            {months.map(m => {
              const p = Math.min(100, Math.round((vals[m.id]??m.raised) / m.target * 100))
              return (
                <div key={m.id} style={{ background:'var(--bg3)', border:'1px solid var(--border-light)', borderRadius:'12px', padding:'1rem' }}>
                  <div style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--text-muted)', marginBottom:'.75rem' }}>{m.month_name_pt}</div>
                  <div style={{ fontSize:'11px', color:'var(--text-dim)', marginBottom:'6px' }}>Meta: R$ {m.target.toLocaleString('pt-BR')}</div>
                  <div style={{ display:'flex', alignItems:'center', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden', marginBottom:'8px' }}>
                    <span style={{ fontSize:'12px', color:'var(--text-dim)', padding:'8px 10px', background:'var(--bg4)', borderRight:'1px solid var(--border)' }}>R$</span>
                    <input type="number" value={vals[m.id]??m.raised} onChange={e => setVals(v => ({ ...v, [m.id]: parseInt(e.target.value)||0 }))} style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--text)', fontFamily:'Montserrat,sans-serif', fontSize:'14px', padding:'8px 10px' }}/>
                  </div>
                  <div style={{ height:'5px', background:'var(--bg4)', borderRadius:'3px', overflow:'hidden' }}><div style={{ height:'100%', borderRadius:'3px', width:`${p}%`, background:'linear-gradient(90deg,var(--brand-light),var(--accent))' }}/></div>
                  <div style={{ fontSize:'11px', color:'var(--text-dim)', textAlign:'right', marginTop:'3px' }}>{p}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfigPage({ campaignId, sb, toast, S }: { campaignId: string; sb: any; toast: any; S: any }) {
  const [goal, setGoal] = useState(200000)
  const [pgoal, setPgoal] = useState(100)
  const [titlePt, setTitlePt] = useState('Construindo um lugar sagrado para todos.')
  const [titleEn, setTitleEn] = useState('Building a sacred place for all.')
  const [titleEs, setTitleEs] = useState('Construyendo un lugar sagrado para todos.')
  const [diaThr, setDiaThr] = useState(5000)
  const [ouroThr, setOuroThr] = useState(2000)
  const [prataThr, setPrataThr] = useState(1000)

  async function save() {
    await sb.from('campaigns').update({ goal, partner_goal: pgoal, title_pt: titlePt, title_en: titleEn, title_es: titleEs }).eq('id', campaignId)
    await sb.from('settings').update({ badge_diamante: diaThr, badge_ouro: ouroThr, badge_prata: prataThr }).eq('campaign_id', campaignId)
    toast('Configurações salvas!', 'success')
  }

  return (
    <div>
      <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:'1.4rem', fontWeight:700, color:'var(--text)', marginBottom:'1.25rem' }}>Configurações</div>
      <div style={S.g2}>
        <div style={S.card}>
          <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>📋 Dados gerais</span><button style={S.btnPrimary} onClick={save}>💾 Salvar</button></div>
          <div style={S.cardBody}>
            <div style={{ marginBottom:'1rem' }}><label style={S.label}>Meta total (R$)</label><div style={{ display:'flex', alignItems:'center', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden' }}><span style={{ fontSize:'12px', color:'var(--text-dim)', padding:'10px 12px', background:'var(--bg4)', borderRight:'1px solid var(--border)' }}>R$</span><input type="number" value={goal} onChange={e=>setGoal(parseInt(e.target.value)||200000)} style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--text)', fontFamily:'Montserrat,sans-serif', fontSize:'14px', padding:'10px 12px' }}/></div></div>
            <div><label style={S.label}>Meta de parceiros</label><div style={{ display:'flex', alignItems:'center', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden' }}><span style={{ fontSize:'12px', color:'var(--text-dim)', padding:'10px 12px', background:'var(--bg4)', borderRight:'1px solid var(--border)' }}>#</span><input type="number" value={pgoal} onChange={e=>setPgoal(parseInt(e.target.value)||100)} style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--text)', fontFamily:'Montserrat,sans-serif', fontSize:'14px', padding:'10px 12px' }}/></div></div>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>🌍 Textos multilíngue</span><button style={S.btnPrimary} onClick={save}>💾 Salvar</button></div>
          <div style={S.cardBody}>
            <div style={{ marginBottom:'1rem' }}><label style={S.label}>Título PT 🇧🇷</label><input value={titlePt} onChange={e=>setTitlePt(e.target.value)} style={S.input}/></div>
            <div style={{ marginBottom:'1rem' }}><label style={S.label}>Título EN 🇬🇧</label><input value={titleEn} onChange={e=>setTitleEn(e.target.value)} style={S.input}/></div>
            <div><label style={S.label}>Título ES 🇪🇸</label><input value={titleEs} onChange={e=>setTitleEs(e.target.value)} style={S.input}/></div>
          </div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardHeader}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>🏅 Thresholds de badge (R$)</span><button style={S.btnPrimary} onClick={save}>Salvar</button></div>
        <div style={S.cardBody}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' }}>
            {[{l:'💎 Diamante',v:diaThr,s:setDiaThr},{l:'🥇 Ouro',v:ouroThr,s:setOuroThr},{l:'🥈 Prata',v:prataThr,s:setPrataThr}].map(b => (
              <div key={b.l}><label style={S.label}>{b.l}</label><div style={{ display:'flex', alignItems:'center', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden' }}><span style={{ fontSize:'12px', color:'var(--text-dim)', padding:'10px 12px', background:'var(--bg4)', borderRight:'1px solid var(--border)' }}>R$</span><input type="number" value={b.v} onChange={e=>b.s(parseInt(e.target.value)||0)} style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--text)', fontFamily:'Montserrat,sans-serif', fontSize:'14px', padding:'10px 12px' }}/></div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
