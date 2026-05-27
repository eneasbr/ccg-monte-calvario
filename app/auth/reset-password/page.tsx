'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()

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
        <h1 style={{fontFamily:'Montserrat,sans-serif',fontSize:'1.5rem',fontWeight:700,color:'var(--cream)',marginBottom:'1.5rem'}}>Nova senha</h1>
        <input
          type="password"
          placeholder="Digite sua nova senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{width:'100%',padding:'12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'10px',color:'var(--text)',fontSize:'14px',marginBottom:'1rem',boxSizing:'border-box'}}
        />
        <button onClick={handleSubmit}
          style={{width:'100%',padding:'12px',background:'var(--gold)',color:'var(--bg)',fontWeight:600,border:'none',borderRadius:'10px',cursor:'pointer',fontSize:'14px'}}>
          Salvar senha
        </button>
        {msg && <p style={{marginTop:'1rem',fontSize:'13px',color:'var(--text-muted)',textAlign:'center'}}>{msg}</p>}
      </div>
    </div>
  )
}