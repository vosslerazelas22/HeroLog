import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CharacterState } from '../types';

const STORAGE_KEY = 'quest-of-mind-campaign';
const SYNC_DEBOUNCE_MS = 3000; // salva na nuvem 3s após a última mudança

// ---------------------------------------------------------------------------
// INITIAL_STATE
// ---------------------------------------------------------------------------
export const INITIAL_STATE: CharacterState = {
  gold: 200,
  totalXP: 0,
  totalGoldEarned: 200,
  totalSessions: 0,
  totalMinutes: 0,
  combatLevel: 1,
  combatXP: 0,
  skills: [
    { name: 'Código Sagrado (Programação)', level: 1, xp: 0, emoji: '💻', prestige: 0, tags: ['React Backend', 'Vite CSS', 'Solução de Bugs'] },
    { name: 'Alquimia & Foco Geral', level: 1, xp: 0, emoji: '🧪', prestige: 0, tags: ['Exercício Físico', 'Planejamento Semanal', 'Meditação'] },
    { name: 'Sábias Letras (Leitura)', level: 1, xp: 0, emoji: '📚', prestige: 0, tags: ['Direito Civil', 'História Geral', 'Filosofia Estoica'] },
  ],
  history: [],
  inventory: [],
  streak: 0,
  bestStreak: 0,
  lastStudyDate: null,
  wildernessWins: 0,
  combo: 0,
  dungeonProgress: 0,
  achievements: [],
  charName: 'Aventureiro do Foco',
  charClass: 'Mage',
  equippedTitle: null,
  ownedTitles: [],
  todayXP: 0,
  todayMinutes: 0,
  todayDate: new Date().toDateString(),
  hasClaimedLogin: false,
  hp: 50,
  maxHp: 50,
  habits: [
    { id: 'h-1', title: '30 min de leitura', notes: 'Desenvolver sabedoria em livros sagrados', up: true, down: false, difficulty: 'Easy', upCount: 0, downCount: 0, streak: 0, tags: ['study'] },
    { id: 'h-2', title: 'Tomar creatina', notes: 'Suplemento da força milenar', up: true, down: false, difficulty: 'Trivial', upCount: 0, downCount: 0, streak: 0, tags: ['workout'] },
    { id: 'h-3', title: 'Estudar / procrastinar', notes: 'Estudar 1 hora ganha +, procrastinar ganha -', up: true, down: true, difficulty: 'Medium', upCount: 0, downCount: 0, streak: 0, tags: ['study'] },
  ],
  dailies: [
    { id: 'd-1', title: 'Duolingo', notes: 'Lição diária de idiomas estrangeiros', difficulty: 'Easy', completed: false, streak: 62, repeats: 'Daily', every: 1, tags: ['study'], checklist: [] },
    { id: 'd-2', title: 'Remédio da Milk', notes: 'Dar medicação da querida companheira', difficulty: 'Trivial', completed: false, streak: 5, repeats: 'Daily', every: 1, tags: [], checklist: [] },
  ],
  todos: [
    { id: 't-1', title: 'Ler WAY OF THE KINGS', notes: 'Completar o capítulo pendente do épico de Brandon Sanderson', difficulty: 'Medium', completed: false, tags: ['study'], checklist: [] },
  ],
  equippedEquipment: [null, null, null],
  pomodoroSettings: {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreak: false,
    autoStartFocus: false,
  },
};

// ---------------------------------------------------------------------------
// Normalização de saves antigos
// ---------------------------------------------------------------------------
export function normalizeGameState(parsed: any): CharacterState {
  const baseState: CharacterState = { ...INITIAL_STATE, ...parsed };

  // Migração/Inicialização de pomodoroSettings
  const oldLongBreak = parsed?.longBreakMinutes ?? 15;
  baseState.pomodoroSettings = {
    focusDuration: parsed?.pomodoroSettings?.focusDuration ?? 25,
    shortBreakDuration: parsed?.pomodoroSettings?.shortBreakDuration ?? 5,
    longBreakDuration: parsed?.pomodoroSettings?.longBreakDuration ?? oldLongBreak,
    autoStartBreak: parsed?.pomodoroSettings?.autoStartBreak ?? false,
    autoStartFocus: parsed?.pomodoroSettings?.autoStartFocus ?? false,
    ...parsed?.pomodoroSettings,
  };

  if ('longBreakMinutes' in baseState) {
    delete (baseState as any).longBreakMinutes;
  }

  if (baseState.skills) {
    baseState.skills = baseState.skills.map((sk: any, idx: number) => ({
      ...sk,
      emoji: sk.emoji || (idx === 0 ? '💻' : idx === 1 ? '🧪' : idx === 2 ? '📚' : '🎯'),
      prestige: sk.prestige ?? 0,
    }));
  }

  if (
    !baseState.equippedEquipment ||
    !Array.isArray(baseState.equippedEquipment) ||
    baseState.equippedEquipment.length < 3
  ) {
    baseState.equippedEquipment = [null, null, null];
  }

  return baseState;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
function loadFromLocalStorage(): CharacterState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeGameState(JSON.parse(saved));
  } catch { /* fallback silencioso */ }
  return INITIAL_STATE;
}

function saveToLocalStorage(state: CharacterState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getLocalUpdatedAt(): string | null {
  return localStorage.getItem(`${STORAGE_KEY}_updated_at`);
}

function setLocalUpdatedAt(ts: string) {
  localStorage.setItem(`${STORAGE_KEY}_updated_at`, ts);
}

// ---------------------------------------------------------------------------
// Supabase sync helpers
// ---------------------------------------------------------------------------
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

async function fetchRemoteSave(userId: string): Promise<{ game_state: any; updated_at: string } | null> {
  if (!isUUID(userId)) return null;

  try {
    const { data, error } = await supabase
      .from('saves')
      .select('game_state, updated_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.warn('[HeroLog] Erro ao buscar save remoto:', error.message);
      }
      return null;
    }
    return data as { game_state: any; updated_at: string } | null;
  } catch (err: any) {
    console.error('[HeroLog] Erro de rede ao buscar save remoto:', err?.message || err);
    return null;
  }
}

async function pushRemoteSave(userId: string, state: CharacterState): Promise<string | null> {
  if (!isUUID(userId)) return null;

  const now = new Date().toISOString();
  try {
    const { error } = await supabase
      .from('saves')
      .upsert({ user_id: userId, game_state: state, updated_at: now });

    if (error) {
      console.error('[HeroLog] Erro ao sincronizar com Supabase:', error.message);
      return null;
    }
    return now;
  } catch (err: any) {
    console.error('[HeroLog] Erro ao sincronizar com Supabase:', err?.message || err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hook principal
// ---------------------------------------------------------------------------
interface UseGameStateOptions {
  user: { id: string } | null;
  onConflict?: (remoteState: CharacterState, localState: CharacterState) => Promise<'remote' | 'local'>;
}

export function useGameState({ user, onConflict }: UseGameStateOptions) {
  const [gameState, setGameState] = useState<CharacterState>(loadFromLocalStorage);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'conflict'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // -------------------------------------------------------------------------
  // 1. Ao fazer login: busca save remoto e resolve conflito se necessário
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    if (!isUUID(user.id)) {
      setSyncStatus('idle');
      return;
    }

    async function loadRemoteSave() {
      setSyncStatus('syncing');
      try {
        const remote = await fetchRemoteSave(user!.id);

        if (!remote) {
          // Nenhum save na nuvem ainda — faz push do local imediatamente
          const ts = await pushRemoteSave(user!.id, gameState);
          if (ts) {
            setLocalUpdatedAt(ts);
            setSyncStatus('idle');
          } else {
            setSyncStatus('error');
          }
          return;
        }

        const remoteDate = new Date(remote.updated_at).getTime();
        const localUpdatedAt = getLocalUpdatedAt();
        const localDate = localUpdatedAt ? new Date(localUpdatedAt).getTime() : 0;

        if (remoteDate <= localDate) {
          // Local é mais recente ou igual — nada a fazer
          setSyncStatus('idle');
          return;
        }

        // Remoto é mais novo que o local que tínhamos quando abrimos o app
        const remoteState = normalizeGameState(remote.game_state);

        if (onConflict) {
          setSyncStatus('conflict');
          const choice = await onConflict(remoteState, gameState);
          if (choice === 'remote') {
            setGameState(remoteState);
            saveToLocalStorage(remoteState);
            setLocalUpdatedAt(remote.updated_at);
          } else {
            // Usuário escolheu manter o local — faz push para sobrescrever o remoto
            const ts = await pushRemoteSave(user!.id, gameState);
            if (ts) {
              setLocalUpdatedAt(ts);
              setSyncStatus('idle');
            } else {
              setSyncStatus('error');
            }
          }
        } else {
          // Sem handler de conflito: aplica remoto automaticamente (comportamento padrão)
          setGameState(remoteState);
          saveToLocalStorage(remoteState);
          setLocalUpdatedAt(remote.updated_at);
        }

        setSyncStatus('idle');
      } catch (err: any) {
        console.error('[HeroLog] Erro durante o carregamento do save remoto:', err);
        setSyncStatus('error');
      }
    }

    loadRemoteSave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // -------------------------------------------------------------------------
  // 2. A cada mudança de estado: salva local imediato + debounce remoto
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Pula o efeito na montagem inicial (já carregamos do localStorage acima)
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    // Salva local imediatamente (sem delay, igual ao comportamento anterior)
    saveToLocalStorage(gameState);

    // Debounce para o save remoto
    if (!user || !isUUID(user.id)) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        const ts = await pushRemoteSave(user.id, gameState);
        if (ts) {
          setLocalUpdatedAt(ts);
          setSyncStatus('idle');
        } else {
          setSyncStatus('error');
        }
      } catch (err: any) {
        console.error('[HeroLog] Erro no push automático do save:', err);
        setSyncStatus('error');
      }
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [gameState, user]);

  // -------------------------------------------------------------------------
  // 3. API pública (idêntica à versão anterior — App.tsx não muda)
  // -------------------------------------------------------------------------
  function resetGameState() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}_updated_at`);
    setGameState(INITIAL_STATE);
    // Push do reset para a nuvem também, se logado
    if (user && isUUID(user.id)) pushRemoteSave(user.id, INITIAL_STATE);
  }

  const importGameState = useCallback((parsed: any): CharacterState => {
    const restored = normalizeGameState(parsed);
    setGameState(restored);
    return restored;
  }, []);

  return {
    gameState,
    setGameState,
    resetGameState,
    importGameState,
    syncStatus,
  };
}
