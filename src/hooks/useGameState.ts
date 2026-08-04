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
    { id: 'sk-1', name: 'Código Sagrado (Programação)', level: 1, xp: 0, emoji: '💻', prestige: 0, tags: ['React Backend', 'Vite CSS', 'Solução de Bugs'] },
    { id: 'sk-2', name: 'Alquimia & Foco Geral', level: 1, xp: 0, emoji: '🧪', prestige: 0, tags: ['Exercício Físico', 'Planejamento Semanal', 'Meditação'] },
    { id: 'sk-3', name: 'Sábias Letras (Leitura)', level: 1, xp: 0, emoji: '📚', prestige: 0, tags: ['Direito Civil', 'História Geral', 'Filosofia Estoica'] },
  ],
  history: [],
  inventory: [],
  streak: 0,
  bestStreak: 0,
  lastStudyDate: null,
  wildernessWins: 0,
  combo: 0,
  dungeonProgress: 0,
  isDungeonMode: false,
  dungeonSessions: 0,
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
    { id: 'd-1', title: 'Duolingo', notes: 'Lição diária de idiomas estrangeiros', difficulty: 'Easy', completed: false, streak: 62, repeats: 'Daily', every: 1, tags: ['study'], checklist: [], value: 0, createdAt: new Date().toISOString() },
    { id: 'd-2', title: 'Remédio da Milk', notes: 'Dar medicação da querida companheira', difficulty: 'Trivial', completed: false, streak: 5, repeats: 'Daily', every: 1, tags: [], checklist: [], value: 0, createdAt: new Date().toISOString() },
  ],
  todos: [
    { id: 't-1', title: 'Ler WAY OF THE KINGS', notes: 'Completar o capítulo pendente do épico de Brandon Sanderson', difficulty: 'Medium', completed: false, tags: ['study'], checklist: [], createdAt: new Date().toISOString() },
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
      id: sk.id || `sk-${idx + 1}`,
      emoji: sk.emoji || (idx === 0 ? '💻' : idx === 1 ? '🧪' : idx === 2 ? '📚' : '🎯'),
      prestige: sk.prestige ?? 0,
    }));
  }

  if (baseState.dailies) {
    baseState.dailies = baseState.dailies.map((d: any) => ({
      ...d,
      value: d.value ?? 0,
      createdAt: d.createdAt ?? new Date().toISOString(),
    }));
  }

  if (baseState.todos) {
    baseState.todos = baseState.todos.map((t: any) => ({
      ...t,
      createdAt: t.createdAt ?? new Date().toISOString(),
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

export async function fetchReconstructedRemoteState(userId: string): Promise<CharacterState | null> {
  if (!isUUID(userId)) return null;

  try {
    const [
      { data: charData, error: charErr },
      { data: sessionsData },
      { data: skillsData },
      { data: inventoryData },
      { data: habitsData },
      { data: dailiesData },
      { data: todosData },
    ] = await Promise.all([
      supabase.from('characters').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('sessions').select('*').eq('user_id', userId),
      supabase.from('skills').select('*').eq('user_id', userId),
      supabase.from('inventory').select('*').eq('user_id', userId),
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('dailies').select('*').eq('user_id', userId),
      supabase.from('todos').select('*').eq('user_id', userId),
    ]);

    if (charErr || !charData) {
      return null;
    }

    const c = charData;

    const reconstructed: CharacterState = {
      gold: c.gold,
      totalXP: c.total_xp,
      totalGoldEarned: c.total_gold_earned,
      totalSessions: c.total_sessions,
      totalMinutes: c.total_minutes,
      combatLevel: c.combat_level,
      combatXP: c.combat_xp,
      streak: c.streak,
      bestStreak: c.best_streak,
      lastStudyDate: c.last_study_date,
      wildernessWins: c.wilderness_wins,
      combo: c.combo,
      dungeonProgress: c.dungeon_progress,
      isDungeonMode: c.is_dungeon_mode,
      dungeonSessions: c.dungeon_sessions,
      charName: c.char_name,
      charClass: c.char_class,
      todayXP: c.today_xp,
      todayMinutes: c.today_minutes,
      todayDate: c.today_date,
      hasClaimedLogin: c.has_claimed_login,
      hp: c.hp,
      maxHp: c.max_hp,
      equippedTitle: c.equipped_title,
      achievements: c.achievements || [],
      ownedTitles: c.owned_titles || [],
      pomodoroSettings: c.pomodoro_settings,
      equippedEquipment: c.equipped_equipment || [null, null, null],

      history: (sessionsData || []).map((s: any) => ({
        id: s.id,
        skillName: s.skill_name,
        date: s.session_date,
        duration: s.duration,
        xp: s.xp,
        gold: s.gold,
        notes: s.notes,
        subskillTag: s.subskill_tag,
        wilderness: s.wilderness,
        aiChronicle: s.ai_chronicle,
      })),

      skills: (skillsData || []).map((sk: any) => ({
        id: sk.id,
        name: sk.name,
        level: sk.level,
        xp: sk.xp,
        emoji: sk.emoji,
        prestige: sk.prestige,
        tags: sk.tags,
      })),

      inventory: (inventoryData || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        emoji: i.emoji,
        desc: i.description,
        buff: i.buff,
        price: i.price,
        isEquipment: i.is_equipment,
        charges: i.charges,
        maxCharges: i.max_charges,
        rarity: i.rarity,
      })),

      habits: (habitsData || []).map((h: any) => ({
        id: h.id,
        title: h.title,
        notes: h.notes,
        up: h.up,
        down: h.down,
        difficulty: h.difficulty,
        upCount: h.up_count,
        downCount: h.down_count,
        streak: h.streak,
        tags: h.tags || [],
      })),

      dailies: (dailiesData || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        notes: d.notes,
        difficulty: d.difficulty,
        completed: d.completed,
        streak: d.streak,
        repeats: d.repeats,
        every: d.every,
        tags: d.tags || [],
        checklist: d.checklist || [],
        value: d.value,
        createdAt: d.created_at,
      })),

      todos: (todosData || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        notes: t.notes,
        difficulty: t.difficulty,
        completed: t.completed,
        tags: t.tags || [],
        checklist: t.checklist || [],
        createdAt: t.created_at,
        completedAt: t.completed_at,
      })),
    };

    return normalizeGameState(reconstructed);
  } catch (err) {
    console.error('[HeroLog] Erro ao reconstruir estado remoto:', err);
    return null;
  }
}

function diffArrayById<T extends { id: string }>(prevArr: T[] | undefined, nextArr: T[]): { upsert: T[]; deleteIds: string[] } {
  const prevMap = new Map((prevArr || []).map((item) => [item.id, item]));
  const nextMap = new Map(nextArr.map((item) => [item.id, item]));
  const upsert = nextArr.filter((item) => {
    const prev = prevMap.get(item.id);
    return !prev || JSON.stringify(prev) !== JSON.stringify(item);
  });
  const deleteIds = (prevArr || []).filter((item) => !nextMap.has(item.id)).map((item) => item.id);
  return { upsert, deleteIds };
}

export function buildDiff(prevState: CharacterState | null, nextState: CharacterState, prevDeviceLabel: string | null): Record<string, any> | null {
  const diff: Record<string, any> = {};
  const deviceLabel = typeof window !== 'undefined'
    ? (localStorage.getItem('herolog_device_label') || 'Dispositivo sem nome')
    : 'Dispositivo sem nome';

  const charactersChanged = !prevState ||
    prevState.gold !== nextState.gold ||
    prevState.totalXP !== nextState.totalXP ||
    prevState.totalGoldEarned !== nextState.totalGoldEarned ||
    prevState.totalSessions !== nextState.totalSessions ||
    prevState.totalMinutes !== nextState.totalMinutes ||
    prevState.combatLevel !== nextState.combatLevel ||
    prevState.combatXP !== nextState.combatXP ||
    prevState.streak !== nextState.streak ||
    prevState.bestStreak !== nextState.bestStreak ||
    prevState.lastStudyDate !== nextState.lastStudyDate ||
    prevState.wildernessWins !== nextState.wildernessWins ||
    prevState.combo !== nextState.combo ||
    prevState.dungeonProgress !== nextState.dungeonProgress ||
    prevState.isDungeonMode !== nextState.isDungeonMode ||
    prevState.dungeonSessions !== nextState.dungeonSessions ||
    prevState.charName !== nextState.charName ||
    prevState.charClass !== nextState.charClass ||
    prevState.todayXP !== nextState.todayXP ||
    prevState.todayMinutes !== nextState.todayMinutes ||
    prevState.todayDate !== nextState.todayDate ||
    prevState.hasClaimedLogin !== nextState.hasClaimedLogin ||
    prevState.hp !== nextState.hp ||
    prevState.maxHp !== nextState.maxHp ||
    prevState.equippedTitle !== nextState.equippedTitle ||
    JSON.stringify(prevState.achievements) !== JSON.stringify(nextState.achievements) ||
    JSON.stringify(prevState.ownedTitles) !== JSON.stringify(nextState.ownedTitles) ||
    JSON.stringify(prevState.pomodoroSettings) !== JSON.stringify(nextState.pomodoroSettings) ||
    JSON.stringify(prevState.equippedEquipment) !== JSON.stringify(nextState.equippedEquipment) ||
    prevDeviceLabel !== deviceLabel;

  if (charactersChanged) {
    diff.characters = {
      gold: nextState.gold, total_xp: nextState.totalXP, total_gold_earned: nextState.totalGoldEarned,
      total_sessions: nextState.totalSessions, total_minutes: nextState.totalMinutes,
      combat_level: nextState.combatLevel, combat_xp: nextState.combatXP, streak: nextState.streak,
      best_streak: nextState.bestStreak, last_study_date: nextState.lastStudyDate,
      wilderness_wins: nextState.wildernessWins, combo: nextState.combo,
      dungeon_progress: nextState.dungeonProgress, is_dungeon_mode: nextState.isDungeonMode,
      dungeon_sessions: nextState.dungeonSessions, char_name: nextState.charName,
      char_class: nextState.charClass, today_xp: nextState.todayXP, today_minutes: nextState.todayMinutes,
      today_date: nextState.todayDate, has_claimed_login: nextState.hasClaimedLogin,
      hp: nextState.hp, max_hp: nextState.maxHp, equipped_title: nextState.equippedTitle,
      achievements: nextState.achievements, owned_titles: nextState.ownedTitles,
      pomodoro_settings: nextState.pomodoroSettings, equipped_equipment: nextState.equippedEquipment,
      device_label: deviceLabel,
    };
  }

  const prevSessionIds = new Set((prevState?.history || []).map((s) => s.id));
  const newSessions = nextState.history.filter((s) => !prevSessionIds.has(s.id));
  if (newSessions.length > 0) {
    diff.sessions_insert = newSessions.map((s) => ({
      id: s.id,
      skill_name: s.skillName, session_date: s.date, duration: s.duration, xp: s.xp, gold: s.gold,
      notes: s.notes, subskill_tag: s.subskillTag, wilderness: s.wilderness, ai_chronicle: s.aiChronicle,
    }));
  }

  const skillsDiff = diffArrayById(prevState?.skills, nextState.skills);
  if (skillsDiff.upsert.length > 0) diff.skills_upsert = skillsDiff.upsert.map((sk) => ({ id: sk.id, name: sk.name, level: sk.level, xp: sk.xp, emoji: sk.emoji, prestige: sk.prestige, tags: sk.tags }));
  if (skillsDiff.deleteIds.length > 0) diff.skills_delete = skillsDiff.deleteIds;

  const invDiff = diffArrayById(prevState?.inventory, nextState.inventory);
  if (invDiff.upsert.length > 0) diff.inventory_upsert = invDiff.upsert.map((i) => ({ id: i.id, name: i.name, emoji: i.emoji, description: i.desc, buff: i.buff, price: i.price, is_equipment: i.isEquipment, charges: i.charges, max_charges: i.maxCharges, rarity: i.rarity }));
  if (invDiff.deleteIds.length > 0) diff.inventory_delete = invDiff.deleteIds;

  const habitsDiff = diffArrayById(prevState?.habits, nextState.habits);
  if (habitsDiff.upsert.length > 0) diff.habits_upsert = habitsDiff.upsert.map((h) => ({ id: h.id, title: h.title, notes: h.notes, up: h.up, down: h.down, difficulty: h.difficulty, up_count: h.upCount, down_count: h.downCount, streak: h.streak, tags: h.tags }));
  if (habitsDiff.deleteIds.length > 0) diff.habits_delete = habitsDiff.deleteIds;

  const dailiesDiff = diffArrayById(prevState?.dailies, nextState.dailies);
  if (dailiesDiff.upsert.length > 0) diff.dailies_upsert = dailiesDiff.upsert.map((d) => ({ id: d.id, title: d.title, notes: d.notes, difficulty: d.difficulty, completed: d.completed, streak: d.streak, repeats: d.repeats, every: d.every, tags: d.tags, checklist: d.checklist, value: d.value, created_at: d.createdAt }));
  if (dailiesDiff.deleteIds.length > 0) diff.dailies_delete = dailiesDiff.deleteIds;

  const todosDiff = diffArrayById(prevState?.todos, nextState.todos);
  if (todosDiff.upsert.length > 0) diff.todos_upsert = todosDiff.upsert.map((t) => ({ id: t.id, title: t.title, notes: t.notes, difficulty: t.difficulty, completed: t.completed, tags: t.tags, checklist: t.checklist, created_at: t.createdAt, completed_at: t.completedAt }));
  if (todosDiff.deleteIds.length > 0) diff.todos_delete = todosDiff.deleteIds;

  return Object.keys(diff).length > 0 ? diff : null;
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
  const lastFlushedStateRef = useRef<CharacterState | null>(null);
  const lastFlushedDeviceLabelRef = useRef<string | null>(null);

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
          const ts = await pushRemoteSave(user!.id, gameState);
          const diff = buildDiff(null, gameState, lastFlushedDeviceLabelRef.current);
          if (diff) await supabase.rpc('flush_state', { p_diff: diff });
          lastFlushedStateRef.current = gameState;
          lastFlushedDeviceLabelRef.current = (typeof window !== 'undefined' 
            ? (localStorage.getItem('herolog_device_label') || 'Dispositivo sem nome') 
            : 'Dispositivo sem nome');
          if (ts) { setLocalUpdatedAt(ts); setSyncStatus('idle'); } else { setSyncStatus('error'); }
          return;
        }

        const remoteDate = new Date(remote.updated_at).getTime();
        const localUpdatedAt = getLocalUpdatedAt();
        const localDate = localUpdatedAt ? new Date(localUpdatedAt).getTime() : 0;

        if (remoteDate <= localDate) {
          lastFlushedStateRef.current = gameState;
          lastFlushedDeviceLabelRef.current = (typeof window !== 'undefined' 
            ? (localStorage.getItem('herolog_device_label') || 'Dispositivo sem nome') 
            : 'Dispositivo sem nome');
          setSyncStatus('idle');
          return;
        }

        const remoteState = await fetchReconstructedRemoteState(user!.id) || normalizeGameState(remote.game_state);

        if (onConflict) {
          setSyncStatus('conflict');
          const choice = await onConflict(remoteState, gameState);
          if (choice === 'remote') {
            setGameState(remoteState);
            saveToLocalStorage(remoteState);
            setLocalUpdatedAt(remote.updated_at);
            lastFlushedStateRef.current = remoteState;
            lastFlushedDeviceLabelRef.current = (typeof window !== 'undefined' 
              ? (localStorage.getItem('herolog_device_label') || 'Dispositivo sem nome') 
              : 'Dispositivo sem nome');
          } else {
            const ts = await pushRemoteSave(user!.id, gameState);
            const diff = buildDiff(remoteState, gameState, lastFlushedDeviceLabelRef.current);
            if (diff) await supabase.rpc('flush_state', { p_diff: diff });
            lastFlushedStateRef.current = gameState;
            lastFlushedDeviceLabelRef.current = (typeof window !== 'undefined' 
              ? (localStorage.getItem('herolog_device_label') || 'Dispositivo sem nome') 
              : 'Dispositivo sem nome');
            if (ts) { setLocalUpdatedAt(ts); setSyncStatus('idle'); } else { setSyncStatus('error'); }
          }
        } else {
          setGameState(remoteState);
          saveToLocalStorage(remoteState);
          setLocalUpdatedAt(remote.updated_at);
          lastFlushedStateRef.current = remoteState;
          lastFlushedDeviceLabelRef.current = (typeof window !== 'undefined' 
            ? (localStorage.getItem('herolog_device_label') || 'Dispositivo sem nome') 
            : 'Dispositivo sem nome');
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
  // 2. A cada mudança de estado: salva local imediato + debounce remoto (flush_state RPC)
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Pula o efeito na montagem inicial (já carregamos do localStorage acima)
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    // Salva local imediatamente
    saveToLocalStorage(gameState);

    // Debounce para o save remoto via RPC flush_state
    if (!user || !isUUID(user.id)) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        const ts = await pushRemoteSave(user.id, gameState);
        const diff = buildDiff(lastFlushedStateRef.current, gameState, lastFlushedDeviceLabelRef.current);
        if (diff) {
          const { error } = await supabase.rpc('flush_state', { p_diff: diff });
          if (error) console.error('[HeroLog] Erro ao executar RPC flush_state:', error.message);
        }
        lastFlushedStateRef.current = gameState;
        lastFlushedDeviceLabelRef.current = (typeof window !== 'undefined' 
          ? (localStorage.getItem('herolog_device_label') || 'Dispositivo sem nome') 
          : 'Dispositivo sem nome');
        if (ts) { setLocalUpdatedAt(ts); setSyncStatus('idle'); } else { setSyncStatus('error'); }
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
    lastFlushedStateRef.current = INITIAL_STATE;
    lastFlushedDeviceLabelRef.current = (typeof window !== 'undefined' 
      ? (localStorage.getItem('herolog_device_label') || 'Dispositivo sem nome') 
      : 'Dispositivo sem nome');
    if (user && isUUID(user.id)) {
      pushRemoteSave(user.id, INITIAL_STATE);
      const diff = buildDiff(null, INITIAL_STATE, lastFlushedDeviceLabelRef.current);
      if (diff) supabase.rpc('flush_state', { p_diff: diff });
    }
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
