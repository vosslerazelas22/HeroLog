import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface AuthGateProps {
  user: User | null;
  loading: boolean;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
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
}: {
  onSend: (email: string) => Promise<{ error: string | null }>;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit() {
    if (!email.trim()) return;
    setStatus('sending');
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
  if (status === 'idle') return null;

  const config = {
    syncing:  { icon: '☁️', label: 'Sincronizando...', color: '#9880c0' },
    error:    { icon: '⚠️', label: 'Erro ao sincronizar', color: '#f87171' },
    conflict: { icon: '⚡', label: 'Conflito detectado', color: '#fbbf24' },
  }[status];

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      background: '#1a1a2e',
      border: `1px solid ${config.color}`,
      borderRadius: 8,
      padding: '0.4rem 0.75rem',
      fontSize: '0.75rem',
      color: config.color,
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AuthGate principal — só cuida de auth, não de sync
// ---------------------------------------------------------------------------
export function AuthGate({ user, loading, sendMagicLink, signOut, children }: AuthGateProps) {
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
    return <LoginScreen onSend={sendMagicLink} />;
  }

  return <>{children({ userId: user.id, signOut })}</>;
}
