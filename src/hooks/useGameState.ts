import { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
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
  longBreakMinutes: 15,
};

// ---------------------------------------------------------------------------
// Normalização de saves antigos
// ---------------------------------------------------------------------------
export function normalizeGameState(parsed: any): CharacterState {
  const baseState: CharacterState = { ...INITIAL_STATE, ...parsed };

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
async function fetchRemoteSave(userId: string): Promise<{ game_state: any; updated_at: string } | null> {
  const { data, error } = await supabase
    .from('saves')
    .select('game_state, updated_at')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as { game_state: any; updated_at: string };
}

async function pushRemoteSave(userId: string, state: CharacterState): Promise<string | null> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('saves')
    .upsert({ user_id: userId, game_state: state, updated_at: now });

  if (error) {
    console.error('[HeroLog] Erro ao sincronizar com Supabase:', error.message);
    return null;
  }
  return now;
}

// ---------------------------------------------------------------------------
// Hook principal
// ---------------------------------------------------------------------------
interface UseGameStateOptions {
  user: User | null;
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

    async function loadRemoteSave() {
      setSyncStatus('syncing');
      const remote = await fetchRemoteSave(user!.uid ?? user!.id);

      if (!remote) {
        // Nenhum save na nuvem ainda — faz push do local imediatamente
        const ts = await pushRemoteSave(user!.id, gameState);
        if (ts) setLocalUpdatedAt(ts);
        setSyncStatus('idle');
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
          if (ts) setLocalUpdatedAt(ts);
        }
      } else {
        // Sem handler de conflito: aplica remoto automaticamente (comportamento padrão)
        setGameState(remoteState);
        saveToLocalStorage(remoteState);
        setLocalUpdatedAt(remote.updated_at);
      }

      setSyncStatus('idle');
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
    if (!user) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSyncStatus('syncing');
      const ts = await pushRemoteSave(user.id, gameState);
      if (ts) {
        setLocalUpdatedAt(ts);
        setSyncStatus('idle');
      } else {
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
    if (user) pushRemoteSave(user.id, INITIAL_STATE);
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
