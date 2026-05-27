'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { CampaignSummary, MonthlyGoal, Donor, Milestone, ActivityFeedItem } from '@/lib/types'

// ── i18n ──────────────────────────────────────────────────
type Lang = 'pt' | 'en' | 'es'

const T = {
  pt: {
    live:'Ao vivo', campaign_progress:'Campanha 2026',
    eyebrow:'Campanha de Construção · 2026',
    hero_title_1:'Construindo um lugar', hero_title_2:'sagrado para todos.',
    hero_desc:'Cada contribuição é um tijolo nessa história. Unidos, estamos erguendo não apenas um templo, mas um legado eterno para as próximas gerações em São Mateus, São Paulo.',
    cta_join:'Ser parceiro fundador', cta_learn:'Ver progresso',
    total_raised:'TOTAL LEVANTADO', goal_prefix:'Meta:',
    achieved:'da meta alcançada', remaining:'faltam',
    partners:'Parceiros', months:'Meses', avg:'Média/Parceiro',
    metrics_label:'Painel de resultados', metrics_title:'Visão geral da campanha',
    m_raised:'Total levantado', m_partners:'Parceiros ativos',
    m_pct:'Da meta global', m_avg:'Média por parceiro',
    m_remaining:'Valor restante', m_deadline:'Prazo da campanha',
    monthly_label:'Metas mensais', monthly_title:'Progresso mês a mês',
    milestones_label:'Marcos da campanha', milestones_title:'Celebrando cada conquista',
    ranking_label:'Parceiros fundadores', ranking_title:'Ranking de contribuições',
    activity_label:'Atividade recente',
    legacy_title:'Mural dos Fundadores',
    legacy_desc:'Esses nomes serão gravados em uma placa permanente na nova sede da CCG Monte Calvário — um legado eterno para todos que tornaram isso possível.',
    legacy_note:'* Conforme as contribuições são registradas. Nomes adicionados ao mural após confirmação.',
    footer_desc:'Plataforma de arrecadação transparente e segura.',
    upcoming:'Em breve', active:'Ativo', done:'Concluído',
  },
  en: {
    live:'Live', campaign_progress:'Campaign 2026',
    eyebrow:'Building Campaign · 2026',
    hero_title_1:'Building a sacred', hero_title_2:'place for all.',
    hero_desc:'Every contribution is a brick in this story. Together, we are building not just a temple, but an eternal legacy for future generations in São Mateus, São Paulo.',
    cta_join:'Become a founding partner', cta_learn:'View progress',
    total_raised:'TOTAL RAISED', goal_prefix:'Goal:',
    achieved:'of goal achieved', remaining:'remaining',
    partners:'Partners', months:'Months', avg:'Avg/Partner',
    metrics_label:'Results dashboard', metrics_title:'Campaign overview',
    m_raised:'Total raised', m_partners:'Active partners',
    m_pct:'Of global goal', m_avg:'Average per partner',
    m_remaining:'Remaining', m_deadline:'Campaign deadline',
    monthly_label:'Monthly goals', monthly_title:'Month by month progress',
    milestones_label:'Campaign milestones', milestones_title:'Celebrating each achievement',
    ranking_label:'Founding partners', ranking_title:'Contribution ranking',
    activity_label:'Recent activity',
    legacy_title:'Founders Wall',
    legacy_desc:"These names will be engraved on a permanent plaque at CCG Monte Calvário's new home — an eternal legacy for all who made this possible.",
    legacy_note:'* As contributions are registered. Names added to the wall after confirmation.',
    footer_desc:'Transparent and secure fundraising platform.',
    upcoming:'Upcoming', active:'Active', done:'Complete',
  },
  es: {
    live:'En vivo', campaign_progress:'Campaña 2026',
    eyebrow:'Campaña de Construcción · 2026',
    hero_title_1:'Construyendo un lugar', hero_title_2:'sagrado para todos.',
    hero_desc:'Cada contribución es un ladrillo en esta historia. Unidos, estamos erigiendo no solo un templo, sino un legado eterno para las próximas generaciones en São Mateus.',
    cta_join:'Ser socio fundador', cta_learn:'Ver progreso',
    total_raised:'TOTAL RECAUDADO', goal_prefix:'Meta:',
    achieved:'de la meta alcanzada', remaining:'faltan',
    partners:'Socios', months:'Meses', avg:'Promedio/Socio',
    metrics_label:'Panel de resultados', metrics_title:'Visión general',
    m_raised:'Total recaudado', m_partners:'Socios activos',
    m_pct:'De la meta global', m_avg:'Promedio por socio',
    m_remaining:'Valor restante', m_deadline:'Plazo de campaña',
    monthly_label:'Metas mensuales', monthly_title:'Progreso mes a mes',
    milestones_label:'Hitos de la campaña', milestones_title:'Celebrando cada logro',
    ranking_label:'Socios fundadores', ranking_title:'Ranking de contribuciones',
    activity_label:'Actividad reciente',
    legacy_title:'Mural de Fundadores',
    legacy_desc:'Estos nombres serán grabados en una placa permanente en la nueva sede de CCG Monte Calvário.',
    legacy_note:'* A medida que se registran las contribuciones.',
    footer_desc:'Plataforma de recaudación transparente y segura.',
    upcoming:'Próximo', active:'Activo', done:'Completado',
  },
}

// ── Helpers ──
function fmtK(n: number): string {
  if (n >= 1000) return 'R$' + (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return 'R$' + n
}
function fmtFull(n: number): string {
  return 'R$ ' + n.toLocaleString('pt-BR')
}
function getMonthName(m: MonthlyGoal, lang: Lang): string {
  return lang === 'pt' ? m.month_name_pt : lang === 'en' ? m.month_name_en : m.month_name_es
}

// ── COMPONENT ──
export default function HomePage() {
  const [lang, setLang] = useState<Lang>('pt')
  const [summary, setSummary]   = useState<CampaignSummary | null>(null)
  const [months, setMonths]     = useState<MonthlyGoal[]>([])
  const [donors, setDonors]     = useState<Donor[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [activity, setActivity] = useState<ActivityFeedItem[]>([])
  const [loading, setLoading]   = useState(true)
  const t = T[lang]

  const load = useCallback(async () => {
    const sb = createClient()
    const [s, m, d, mi, a] = await Promise.all([
      sb.from('campaign_summary').select('*').single(),
      sb.from('monthly_summary').select('*').order('month_order'),
      sb.from('donor_ranking').select('*').limit(20),
      sb.from('milestones').select('*').order('sort_order'),
      sb.from('activity_feed').select('*').eq('is_visible', true).order('created_at', { ascending: false }).limit(8),
    ])
    if (s.data) setSummary(s.data)
    if (m.data) setMonths(m.data)
    if (d.data) setDonors(d.data)
    if (mi.data) setMilestones(mi.data)
    if (a.data) setActivity(a.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Realtime updates
  useEffect(() => {
    const sb = createClient()
    const channel = sb
      .channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donors' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_goals' }, load)
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [load])

  const pct = summary ? Math.min(100, Math.round(summary.pct_complete)) : 0
  const avg = summary && summary.total_partners > 0
    ? Math.round(summary.total_raised / summary.total_partners) : 0
  const top3 = donors.slice(0, 3)
  const podiumOrder = [top3[1], top3[0], top3[2]]
  const medals = ['🥇', '🥈', '🥉']

  const now = new Date()
  const updateTime = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

  return (
    <>
      {/* NAV */}
      <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(6,12,20,0.95)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border-light)',padding:'0 clamp(1rem,4vw,3rem)',height:'60px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <a href="#" style={{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
          <div style={{width:'36px',height:'36px',flexShrink:0}}>
            <img src="/img/logo-ccg.png" alt="CCG" style={{width:'36px',height:'36px',objectFit:'contain',filter:'brightness(0) invert(1)'}}/>
          </div>
          <div>
            <div style={{fontSize:'13px',fontWeight:500,color:'var(--text)',letterSpacing:'0.02em'}}>Founding Partners</div>
            <div style={{fontSize:'11px',color:'var(--text-muted)',letterSpacing:'0.05em',textTransform:'uppercase'}}>CCG Monte Calvário</div>
          </div>
        </a>
        <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'11px',fontWeight:500,color:'var(--green)',letterSpacing:'0.08em',textTransform:'uppercase'}}>
            <span className="live-dot" style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--green)',display:'inline-block'}}/>
            {t.live}
          </div>
          {(['pt','en','es'] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{background:lang===l?'var(--border)':'none',border:'1px solid var(--border)',borderRadius:'6px',padding:'4px 6px',cursor:'pointer'}}>
              <img src={`/flags/${l}.svg`} alt={l} style={{width:'20px',height:'14px',objectFit:'cover',borderRadius:'2px',display:'block'}}/>
            </button>
          ))}
        </div>
      </nav>

      {/* TICKER */}
      <div style={{background:'var(--bg2)',borderBottom:'1px solid var(--border-light)',padding:'0 clamp(1rem,4vw,3rem)',display:'flex',alignItems:'center',gap:'16px',height:'40px',overflow:'hidden'}}>
        <span style={{fontSize:'11px',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)',whiteSpace:'nowrap'}}>{t.campaign_progress}</span>
        <div style={{flex:1,height:'4px',background:'var(--bg4)',borderRadius:'2px',overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,var(--gold-dark),var(--gold),var(--gold-light))',borderRadius:'2px',transition:'width 1.8s cubic-bezier(0.16,1,0.3,1)'}}/>
        </div>
        <span style={{fontSize:'13px',fontWeight:600,color:'var(--gold-light)',minWidth:'40px',textAlign:'right'}}>{pct}%</span>
      </div>

      {/* HERO */}
      <div style={{padding:'clamp(3rem,8vw,6rem) clamp(1rem,4vw,3rem) clamp(2rem,6vw,4rem)',maxWidth:'1100px',margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,440px),1fr))',gap:'clamp(2rem,6vw,5rem)',alignItems:'center'}}>
        <div className="fade-in visible">
          <div style={{display:'inline-flex',alignItems:'center',gap:'8px',fontSize:'11px',fontWeight:600,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'1.5rem',padding:'6px 14px',border:'1px solid var(--border)',borderRadius:'100px',background:'rgba(74,144,217,0.06)'}}>
            <span>✦</span><span>{t.eyebrow}</span>
          </div>
          <h1 style={{fontFamily:'Montserrat,sans-serif',fontSize:'clamp(2.4rem,5vw,3.8rem)',fontWeight:700,lineHeight:1.12,color:'var(--cream)',marginBottom:'1.25rem',letterSpacing:'-0.01em'}}>
            {t.hero_title_1}<br/>
            <em style={{fontStyle:'italic',color:'var(--gold-light)'}}>{t.hero_title_2}</em>
          </h1>
          <p style={{fontSize:'15px',color:'var(--text-muted)',lineHeight:1.75,marginBottom:'2rem',maxWidth:'460px'}}>{t.hero_desc}</p>
          <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
            <a href="#parceiros" style={{background:'var(--gold)',color:'var(--bg)',fontFamily:'DM Sans,sans-serif',fontSize:'14px',fontWeight:600,padding:'12px 24px',border:'none',borderRadius:'10px',cursor:'pointer',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'6px'}}>
              {t.cta_join} →
            </a>
            <a href="#metas" style={{background:'transparent',color:'var(--text)',fontFamily:'DM Sans,sans-serif',fontSize:'14px',fontWeight:500,padding:'12px 24px',border:'1px solid var(--border)',borderRadius:'10px',cursor:'pointer',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'6px'}}>
              {t.cta_learn}
            </a>
          </div>
        </div>

        <div className="fade-in visible" style={{transitionDelay:'0.15s'}}>
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'20px',padding:'2rem',position:'relative',overflow:'hidden'}}>
            <div style={{fontSize:'11px',fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:'0.4rem'}}>{t.total_raised}</div>
            <div style={{fontFamily:'Montserrat,sans-serif',fontSize:'clamp(2rem,5vw,3rem)',fontWeight:300,color:'var(--cream)',lineHeight:1,marginBottom:'0.4rem'}}>
              {loading ? '—' : fmtFull(summary?.total_raised ?? 0)}
            </div>
            <div style={{fontSize:'13px',color:'var(--text-muted)',marginBottom:'1.5rem'}}>
              {t.goal_prefix} <span style={{color:'var(--gold-light)',fontWeight:600}}> R$ 200.000</span>
            </div>
            <div style={{height:'8px',background:'var(--bg4)',borderRadius:'4px',overflow:'hidden',marginBottom:'0.75rem'}}>
              <div className="progress-fill" style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,var(--gold-dark) 0%,var(--gold) 60%,var(--gold-light) 100%)',borderRadius:'4px'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1.5rem'}}>
              <div>
                <div style={{fontSize:'22px',fontWeight:600,color:'var(--gold-light)'}}>{pct}%</div>
                <div style={{fontSize:'11px',color:'var(--text-dim)'}}>{t.achieved}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'11px',color:'var(--text-dim)'}}>{t.remaining}</div>
                <strong style={{fontSize:'15px',fontWeight:600,color:'var(--text)'}}>{loading ? '—' : fmtFull(summary?.remaining ?? 200000)}</strong>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1px',background:'var(--border-light)',borderRadius:'12px',overflow:'hidden',border:'1px solid var(--border-light)'}}>
              {[
                {val: loading ? '—' : String(summary?.total_partners ?? 0), label: t.partners},
                {val: '4', label: t.months},
                {val: loading ? '—' : fmtK(avg), label: t.avg},
              ].map((s,i) => (
                <div key={i} style={{background:'var(--bg3)',padding:'1rem',textAlign:'center'}}>
                  <span style={{fontSize:'18px',fontWeight:600,color:'var(--cream)',display:'block',lineHeight:1.2}}>{s.val}</span>
                  <div style={{fontSize:'11px',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginTop:'2px'}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{height:'1px',background:'var(--border-light)',maxWidth:'1100px',margin:'0 auto'}}/>

      {/* METRICS */}
      <section style={{maxWidth:'1100px',margin:'0 auto',padding:'clamp(2rem,5vw,3.5rem) clamp(1rem,4vw,3rem)'}} id="metricas">
        <div style={{marginBottom:'1.5rem'}}>
          <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.3rem'}}>{t.metrics_label}</div>
          <h2 style={{fontFamily:'Montserrat,sans-serif',fontSize:'clamp(1.4rem,3vw,2rem)',fontWeight:600,color:'var(--cream)'}}>{t.metrics_title}</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'12px'}}>
          {[
            {icon:'🏛️', val: loading ? '—' : fmtK(summary?.total_raised ?? 0), label: t.m_raised},
            {icon:'👥', val: loading ? '—' : String(summary?.total_partners ?? 0), label: t.m_partners},
            {icon:'📈', val: `${pct}%`, label: t.m_pct},
            {icon:'💎', val: loading ? '—' : fmtK(avg), label: t.m_avg},
            {icon:'🎯', val: loading ? '—' : fmtK(summary?.remaining ?? 200000), label: t.m_remaining},
            {icon:'🗓️', val: 'Set/25', label: t.m_deadline},
          ].map((m,i) => (
            <div key={i} style={{background:'var(--bg2)',border:'1px solid var(--border-light)',borderRadius:'14px',padding:'1.25rem 1.25rem 1rem'}}>
              <div style={{width:'32px',height:'32px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',marginBottom:'1rem',background:'rgba(74,144,217,0.1)'}}>{m.icon}</div>
              <div style={{fontFamily:'Montserrat,sans-serif',fontSize:'1.8rem',fontWeight:300,color:'var(--cream)',lineHeight:1,marginBottom:'0.25rem'}}>{m.val}</div>
              <div style={{fontSize:'12px',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:500}}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{height:'1px',background:'var(--border-light)',maxWidth:'1100px',margin:'0 auto'}}/>

      {/* MONTHLY GOALS */}
      <section style={{maxWidth:'1100px',margin:'0 auto',padding:'clamp(2rem,5vw,3.5rem) clamp(1rem,4vw,3rem)'}} id="metas">
        <div style={{marginBottom:'1.5rem'}}>
          <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.3rem'}}>{t.monthly_label}</div>
          <h2 style={{fontFamily:'Montserrat,sans-serif',fontSize:'clamp(1.4rem,3vw,2rem)',fontWeight:600,color:'var(--cream)'}}>{t.monthly_title}</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'12px'}}>
          {months.map((m) => {
            const p = Math.min(100, Math.round(m.pct_complete ?? 0))
            const s = m.raised > 0 ? (p >= 100 ? 'done' : 'active') : 'upcoming'
            const statusColors = {
              active:   {bg:'rgba(76,175,125,0.12)',color:'var(--green)',border:'1px solid rgba(76,175,125,0.2)'},
              done:     {bg:'rgba(74,144,217,0.1)',color:'var(--gold-light)',border:'1px solid var(--border)'},
              upcoming: {bg:'var(--bg4)',color:'var(--text-dim)',border:'1px solid var(--border-light)'},
            }
            const sc = statusColors[s]
            return (
              <div key={m.id} style={{background:'var(--bg2)',border:'1px solid var(--border-light)',borderRadius:'14px',padding:'1.25rem'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
                  <span style={{fontSize:'13px',fontWeight:600,color:'var(--text)',letterSpacing:'0.04em',textTransform:'uppercase'}}>{getMonthName(m, lang)}</span>
                  <span style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',padding:'3px 8px',borderRadius:'100px',...sc}}>
                    {t[s as keyof typeof t]}
                  </span>
                </div>
                <div style={{marginBottom:'0.75rem'}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontSize:'1.5rem',color:'var(--cream)',lineHeight:1,marginBottom:'2px'}}>{fmtK(m.raised)}</div>
                  <div style={{fontSize:'12px',color:'var(--text-dim)'}}>/ {fmtK(m.target)}</div>
                </div>
                <div style={{height:'5px',background:'var(--bg4)',borderRadius:'3px',overflow:'hidden',marginBottom:'0.5rem'}}>
                  <div style={{height:'100%',borderRadius:'3px',width:`${p}%`,transition:'width 1.5s ease',background:p>=100?'linear-gradient(90deg,#2D7A50,var(--green))':'linear-gradient(90deg,var(--gold-dark),var(--gold))'}}/>
                </div>
                <div style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textAlign:'right'}}>{p}%</div>
              </div>
            )
          })}
        </div>
      </section>

      <div style={{height:'1px',background:'var(--border-light)',maxWidth:'1100px',margin:'0 auto'}}/>

      {/* MILESTONES */}
      <section style={{maxWidth:'1100px',margin:'0 auto',padding:'clamp(2rem,5vw,3.5rem) clamp(1rem,4vw,3rem)'}}>
        <div style={{marginBottom:'1.5rem'}}>
          <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.3rem'}}>{t.milestones_label}</div>
          <h2 style={{fontFamily:'Montserrat,sans-serif',fontSize:'clamp(1.4rem,3vw,2rem)',fontWeight:600,color:'var(--cream)'}}>{t.milestones_title}</h2>
        </div>
        <div className="milestone-row" style={{display:'flex',gap:'10px',overflowX:'auto',paddingBottom:'8px'}}>
          {milestones.map((m) => (
            <div key={m.id} style={{flexShrink:0,border:`1px solid ${m.reached?'var(--border)':'var(--border-light)'}`,borderRadius:'12px',padding:'1rem 1.25rem',minWidth:'160px',textAlign:'center',background:m.reached?'linear-gradient(135deg,rgba(74,144,217,0.06),var(--bg2))':'var(--bg2)'}}>
              <span style={{fontSize:'24px',marginBottom:'6px',display:'block'}}>{m.reached ? m.emoji : '🔒'}</span>
              <div style={{fontSize:'14px',fontWeight:600,color:m.reached?'var(--cream)':'var(--text-dim)',marginBottom:'2px'}}>{m.value_label}</div>
              <div style={{fontSize:'11px',color:'var(--text-dim)'}}>{lang==='pt'?m.desc_pt:lang==='en'?m.desc_en:m.desc_es}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{height:'1px',background:'var(--border-light)',maxWidth:'1100px',margin:'0 auto'}}/>

      {/* LEADERBOARD */}
      <section style={{maxWidth:'1100px',margin:'0 auto',padding:'clamp(2rem,5vw,3.5rem) clamp(1rem,4vw,3rem)'}} id="parceiros">
        <div style={{marginBottom:'1.5rem'}}>
          <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'0.3rem'}}>{t.ranking_label}</div>
          <h2 style={{fontFamily:'Montserrat,sans-serif',fontSize:'clamp(1.4rem,3vw,2rem)',fontWeight:600,color:'var(--cream)'}}>{t.ranking_title}</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
          <div>
            {/* PODIUM */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1.15fr 1fr',gap:'10px',marginBottom:'1rem',alignItems:'end'}}>
              {podiumOrder.map((d, vi) => {
                if (!d) return <div key={vi}/>
                const rank = top3.indexOf(d)
                const isFirst = rank === 0
                const badgeColors = ['rgba(255,215,0,0.15)','rgba(192,192,192,0.15)','rgba(205,127,50,0.15)']
                const badgeTextColors = ['#FFD700','#D8D8D8','#E8A060']
                return (
                  <div key={d.id} style={{border:'1px solid var(--border-light)',borderRadius:'14px',padding:isFirst?'1.5rem 1rem 1rem':'1rem',textAlign:'center',position:'relative',background:isFirst?'linear-gradient(180deg,rgba(74,144,217,0.08) 0%,var(--bg2) 100%)':'var(--bg2)'}}>
                    {isFirst && <span style={{position:'absolute',top:'-14px',left:'50%',transform:'translateX(-50%)',fontSize:'22px'}}>👑</span>}
                    <div style={{width:isFirst?'52px':'44px',height:isFirst?'52px':'44px',borderRadius:'50%',background:'linear-gradient(135deg,var(--gold-dark),var(--gold))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:isFirst?'18px':'15px',fontWeight:600,color:'var(--bg)',margin:'0 auto 0.5rem',border:`2px solid ${isFirst?'var(--gold)':'var(--border)'}`}}>
                      {d.initials}
                    </div>
                    <div style={{fontSize:'12px',fontWeight:600,color:'var(--text)',marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
                    <div style={{fontSize:'11px',color:'var(--gold-light)',fontWeight:600}}>{fmtK(d.total)}</div>
                    <div style={{marginTop:'6px'}}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'10px',fontWeight:600,padding:'3px 8px',borderRadius:'100px',background:badgeColors[rank],color:badgeTextColors[rank],border:`1px solid ${badgeTextColors[rank]}40`}}>
                        {medals[rank]} {d.badge}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* TABLE */}
            <div style={{background:'var(--bg2)',border:'1px solid var(--border-light)',borderRadius:'14px',overflow:'hidden'}}>
              {donors.map((d, i) => {
                const badgeColors = {Diamante:['rgba(147,210,255,0.12)','#93D2FF'],Ouro:['rgba(255,215,0,0.12)','#FFD700'],Prata:['rgba(192,192,192,0.12)','#D8D8D8'],Bronze:['rgba(205,127,50,0.12)','#E8A060']}
                const bc = badgeColors[d.badge as keyof typeof badgeColors] || badgeColors.Bronze
                return (
                  <div key={d.id} style={{display:'grid',gridTemplateColumns:'28px 1fr auto',gap:'12px',padding:'12px 16px',alignItems:'center',borderBottom:i<donors.length-1?'1px solid var(--border-light)':'none'}}>
                    <div style={{fontSize:'12px',fontWeight:600,color:'var(--text-dim)',textAlign:'center'}}>{i+1}</div>
                    <div>
                      <div style={{fontSize:'13px',fontWeight:500,color:'var(--text)'}}>{d.name}</div>
                      <span style={{display:'inline-flex',fontSize:'10px',fontWeight:600,padding:'2px 7px',borderRadius:'100px',background:bc[0],color:bc[1],border:`1px solid ${bc[1]}40`,textTransform:'uppercase',letterSpacing:'0.05em'}}>{d.badge}</span>
                    </div>
                    <div style={{fontSize:'13px',fontWeight:600,color:'var(--gold-light)',textAlign:'right'}}>{fmtK(d.total)}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ACTIVITY */}
          <div>
            <div style={{marginBottom:'8px',fontSize:'12px',color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{t.activity_label}</div>
            <div style={{display:'flex',flexDirection:'column',gap:'1px',background:'var(--border-light)',border:'1px solid var(--border-light)',borderRadius:'14px',overflow:'hidden'}}>
              {activity.map((a) => (
                <div key={a.id} style={{background:'var(--bg2)',padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px'}}>
                  <div style={{width:'34px',height:'34px',flexShrink:0,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:600,color:'var(--bg)',background:'linear-gradient(135deg,var(--gold-dark),var(--gold))'}}>{a.donor_initials}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'13px',color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      <strong style={{fontWeight:600,color:'var(--cream)'}}>{a.donor_name}</strong> {lang==='pt'?a.action_pt:lang==='en'?a.action_en:a.action_es}
                    </div>
                    <div style={{fontSize:'11px',color:'var(--text-dim)',marginTop:'1px'}}>{new Date(a.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                  {a.amount && <div style={{fontSize:'13px',fontWeight:600,color:'var(--gold-light)',flexShrink:0}}>{a.amount}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LEGACY WALL */}
      <div style={{background:'var(--bg2)',borderTop:'1px solid var(--border-light)',borderBottom:'1px solid var(--border-light)',padding:'clamp(2.5rem,6vw,5rem) clamp(1rem,4vw,3rem)',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{maxWidth:'800px',margin:'0 auto',position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:'16px',justifyContent:'center',marginBottom:'1.5rem'}}>
            <div style={{flex:1,maxWidth:'120px',height:'1px',background:'linear-gradient(90deg,transparent,var(--border))'}}/>
            <div style={{width:'8px',height:'8px',background:'var(--gold)',transform:'rotate(45deg)'}}/>
            <div style={{flex:1,maxWidth:'120px',height:'1px',background:'linear-gradient(90deg,var(--border),transparent)'}}/>
          </div>
          <h2 style={{fontFamily:'Montserrat,sans-serif',fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:700,color:'var(--cream)',marginBottom:'1rem'}}>{t.legacy_title}</h2>
          <p style={{fontSize:'14px',color:'var(--text-muted)',maxWidth:'520px',margin:'0 auto 2.5rem',lineHeight:1.7}}>{t.legacy_desc}</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'10px',justifyContent:'center',marginBottom:'2rem'}}>
            {donors.filter(d => d.mural_status === 'approved').map(d => (
              <div key={d.id} style={{fontFamily:'Montserrat,sans-serif',fontSize:'14px',color:'var(--text-muted)',padding:'6px 16px',border:'1px solid var(--border-light)',borderRadius:'100px',background:'var(--bg3)'}}>
                {d.mural_name || d.name}
              </div>
            ))}
            {[...Array(5)].map((_,i) => (
              <div key={i} style={{fontSize:'12px',color:'var(--text-dim)',padding:'6px 16px',border:'1px dashed var(--border-light)',borderRadius:'100px',background:'var(--bg3)',fontStyle:'italic'}}>
                Seu nome aqui
              </div>
            ))}
          </div>
          <p style={{fontSize:'12px',color:'var(--text-dim)'}}>{t.legacy_note}</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{borderTop:'1px solid var(--border-light)',padding:'2rem clamp(1rem,4vw,3rem)',maxWidth:'1100px',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:'12px',color:'var(--text-dim)'}}>© 2026 CCG Monte Calvário · São Mateus, São Paulo, Brasil</div>
          <div style={{fontSize:'12px',color:'var(--text-dim)',marginTop:'4px'}}>{t.footer_desc}</div>
        </div>
        <div style={{fontSize:'11px',color:'var(--text-dim)'}}>Atualizado: {updateTime}</div>
      </footer>
    </>
  )
}
