'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const sb = createClient()
    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // também aceita token_hash na URL
    const params = new URLSearchParams(window.location.search)
    const token_hash = params.get('token_hash')
    const type = params.get('type')
    if (token_hash && type === 'recovery') {
      sb.auth.verifyOtp({ token_hash, type: 'recovery' }).then(() => setReady(true))
    }
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit() {
    const sb = createClient()
    const { error } = await sb.auth.updateUser({ password })
    if (error) { setMsg(error.message); return }
    setMsg('Senha atualizada! Redirecionando...')
    setTimeout(() => router.push('/admin'), 2000)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'20px',padding:'2.5rem',width:'100%',maxWidth:'400px'}}>
        <h1 style={{fontFamily:'Montserrat,sans-serif',fontSize:'1.5rem',fontWeight:700,color:'var(--cream)',marginBottom:'0.5rem'}}>Nova senha</h1>
        <p style={{fontSize:'13px',color:'var(--text-muted)',marginBottom:'1.5rem'}}>Digite sua nova senha abaixo.</p>
        {!ready && <p style={{fontSize:'13px',color:'var(--text-muted)'}}>Verificando link...</p>}
        {ready && <>
          <input
            type="password"
            placeholder="Nova senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{width:'100%',padding:'12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'10px',color:'var(--text)',fontSize:'14px',marginBottom:'1rem',boxSizing:'border-box'}}
          />
          <button onClick={handleSubmit}
            style={{width:'100%',padding:'12px',background:'var(--gold)',color:'var(--bg)',fontWeight:600,border:'none',borderRadius:'10px',cursor:'pointer',fontSize:'14px'}}>
            Salvar senha
          </button>
        </>}
        {msg && <p style={{marginTop:'1rem',fontSize:'13px',color:'var(--text-muted)',textAlign:'center'}}>{msg}</p>}
      </div>
    </div>
  )
}