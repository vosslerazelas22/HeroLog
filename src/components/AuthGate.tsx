import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '../lib/supabaseClient';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface AuthGateProps {
  user: User | null;
  loading: boolean;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  bypassAuth?: () => void;
  children: (props: {
    userId: string;
    signOut: () => Promise<void>;
  }) => React.ReactNode;
}

// ---------------------------------------------------------------------------
// Tela de login (magic link)
// ---------------------------------------------------------------------------
function LoginScreen({
  onSend,
  onPasswordLogin,
  onBypass,
}: {
  onSend: (email: string) => Promise<{ error: string | null }>;
  onPasswordLogin: (email: string, password: string) => Promise<{ error: string | null }>;
  onBypass?: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isDev = import.meta.env.VITE_ALLOW_PASSWORD_LOGIN === 'true';
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit() {
    if (!email.trim()) return;

    setStatus('sending');

    if (isDev) {
      const { error } = await onPasswordLogin(email.trim(), password);
      if (error) {
        setErrorMsg(error);
        setStatus('error');
      } else {
        setStatus('sent');
      }
      return;
    }

    const { error } = await onSend(email.trim());

    if (error) {
      setErrorMsg(error);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f0f1a',
      color: '#e2d9f3',
      fontFamily: 'sans-serif',
      padding: '2rem',
      gap: '1.5rem',
    }}>
      <div style={{ fontSize: '3rem' }}>⚔️</div>
      <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#c4a8ff' }}>HeroLog</h1>
      <p style={{ margin: 0, color: '#9880c0', textAlign: 'center', maxWidth: 320 }}>
        Entre com seu e-mail para sincronizar seu progresso entre dispositivos.
      </p>

      {status === 'sent' ? (
        <div style={{
          background: '#1a1a2e',
          border: '1px solid #4a3a7a',
          borderRadius: 12,
          padding: '1.5rem 2rem',
          textAlign: 'center',
          maxWidth: 320,
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📨</div>
          <p style={{ margin: 0, color: '#c4a8ff' }}>
            Link enviado para <strong>{email}</strong>.<br />
            Verifique sua caixa de entrada e clique no link para entrar.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: 320 }}>

          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={status === 'sending'}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 8,
              border: '1px solid #4a3a7a',
              background: '#1a1a2e',
              color: '#e2d9f3',
              fontSize: '1rem',
              outline: 'none',
            }}
          />

          {isDev && (
            <input
              type="password"
              placeholder="senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 8,
                border: '1px solid #4a3a7a',
                background: '#1a1a2e',
                color: '#e2d9f3',
                fontSize: '1rem',
                outline: 'none',
              }}
            />
          )}

          <button
            onClick={handleSubmit}
            disabled={status === 'sending' || !email.trim()}
            style={{
              padding: '0.75rem',
              borderRadius: 8,
              border: 'none',
              background: status === 'sending' ? '#4a3a7a' : '#7c3aed',
              color: '#fff',
              fontSize: '1rem',
              cursor: status === 'sending' ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {status === 'sending' ? 'Enviando...' : 'Enviar link mágico ✨'}
          </button>

          {(!isSupabaseConfigured) && (
            <div style={{
              background: '#2b1a1a',
              border: '1px solid #7a3a3a',
              borderRadius: 8,
              padding: '0.75rem',
              fontSize: '0.8rem',
              color: '#fca5a5',
              textAlign: 'center',
              marginTop: '0.5rem',
            }}>
              ⚠️ Supabase não configurado. O app funcionará localmente (dados salvos no seu navegador).
            </div>
          )}

          {(import.meta.env.DEV || !isSupabaseConfigured) && onBypass && (
            <button
              onClick={onBypass}
              style={{
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid #4a3a7a',
                background: 'transparent',
                color: '#c4a8ff',
                fontSize: '0.95rem',
                cursor: 'pointer',
                fontWeight: 600,
                marginTop: '0.25rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {!isSupabaseConfigured ? 'Entrar em Modo Local 🛠️ (Bypass)' : 'Entrar como Desenvolvedor 🛠️ (Bypass)'}
            </button>
          )}

          {status === 'error' && (
            <p style={{ margin: 0, color: '#f87171', fontSize: '0.875rem', textAlign: 'center' }}>
              {errorMsg}
            </p>
          )}
        </div>
      )}

      <p style={{ margin: 0, color: '#5a4a7a', fontSize: '0.75rem', textAlign: 'center', maxWidth: 280 }}>
        Nenhuma senha necessária. O link expira em 1 hora.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SyncIndicator — renderizado diretamente pelo App (não pelo AuthGate)
// Exportado separadamente para o App.tsx importar e posicionar onde quiser.
// ---------------------------------------------------------------------------
export function SyncIndicator({
  status,
}: {
  status: 'idle' | 'syncing' | 'error' | 'conflict';
}) {
  // Sucesso (Silencioso): O aplicativo salva em segundo plano sem nenhum indicador visual na tela.
  if (status === 'idle' || status === 'syncing') return null;

  const config = {
    error: {
      icon: '⚠️',
      label: 'Erro de Sincronização',
      desc: 'Falha ao salvar progresso na nuvem. Seus dados estão seguros localmente.',
      borderColor: 'border-red-500/50',
      textColor: 'text-red-300',
      bgColor: 'bg-stone-950/95',
      dotColor: 'bg-red-500',
    },
    conflict: {
      icon: '⚡',
      label: 'Conflito de Save',
      desc: 'Versão mais recente encontrada na nuvem. Ação necessária para sincronizar.',
      borderColor: 'border-amber-500/50',
      textColor: 'text-amber-300',
      bgColor: 'bg-stone-950/95',
      dotColor: 'bg-amber-500',
    },
  }[status];

  return (
    <div
      id="sync-indicator"
      className={`fixed bottom-4 right-4 z-[9999] flex flex-col max-w-xs p-3.5 rounded-xl border-2 ${config.borderColor} ${config.bgColor} backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.8)] animate-fade-in font-serif`}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dotColor} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`}></span>
        </span>
        <span className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-stone-100">
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </span>
      </div>
      <p className={`mt-1.5 text-[10px] leading-relaxed ${config.textColor}`}>
        {config.desc}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AuthGate principal — só cuida de auth, não de sync
// ---------------------------------------------------------------------------
export function AuthGate({ user, loading, sendMagicLink, signInWithPassword, signOut, bypassAuth, children }: AuthGateProps) {
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f1a',
        color: '#9880c0',
        fontFamily: 'sans-serif',
      }}>
        Carregando sessão...
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onSend={sendMagicLink}
        onPasswordLogin={signInWithPassword}
        onBypass={bypassAuth}
      />
    );
  }

  return <>{children({ userId: user.id, signOut })}</>;
}
