'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const sb = createClient()
    const { error: authError } = await sb.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/admin/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle,rgba(0,32,71,0.35) 0%,transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg,var(--brand),var(--brand-light))', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: '#fff', fontFamily: 'Montserrat,sans-serif' }}>
            MC
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Painel Administrativo</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CCG Monte Calvário</div>
          </div>
        </div>

        <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>Entrar</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '2rem' }}>Acesso restrito a administradores da campanha.</p>

        {error && (
          <div style={{ background: 'rgba(224,92,92,.1)', border: '1px solid rgba(224,92,92,.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--red)', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@ccgmontecalvario.com.br"
              required
              style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: loading ? 'var(--bg4)' : 'var(--accent)', color: '#fff', fontFamily: 'Montserrat,sans-serif', fontSize: '14px', fontWeight: 600, padding: '12px', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s' }}
          >
            {loading ? 'Entrando...' : 'Entrar no painel →'}
          </button>
        </form>
      </div>
    </div>
  )
}
