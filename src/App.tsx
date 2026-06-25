import { sendMagicLink, signInWithPassword, signOut } from './lib/auth';
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CharacterState,
  Skill,
  InventoryItem,
  Habit,
  Daily,
  Todo,
  BuffType,
} from './types';
import { sound } from './utils/audio';
import { useGameState } from './hooks/useGameState';
import { useAuth } from './hooks/useAuth';
import { AuthGate, SyncIndicator } from './components/AuthGate';

interface CombatLevelUpType {
  type: 'combat';
  oldLevel: number;
  newLevel: number;
  charName: string;
  charClass: string;
}

interface SkillLevelUpType {
  type: 'skill';
  skillName: string;
  emoji: string;
  oldLevel: number;
  newLevel: number;
}

type LevelUpModalType = CombatLevelUpType | SkillLevelUpType;

export interface ActiveSession {
  isActive: boolean;
  skillIdx: number;
  duration: number;    // duração total em ms
  endTime: number;     // Date.now() + duration
  startTime: number;
  isDungeon: boolean;
  dungeonStep: number;
  isWilderness?: boolean;
}

// Tabs
import { HabitsTab } from './components/HabitsTab';
import { DailiesTab } from './components/DailiesTab';
import { TodosTab } from './components/TodosTab';
import { HistoryTab } from './components/HistoryTab';
import { HeatmapTab } from './components/HeatmapTab';
import { QuestsTab } from './components/QuestsTab';
import { ShopTab } from './components/ShopTab';
import { StatsTab } from './components/StatsTab';
import { AchievementsTab } from './components/AchievementsTab';
import { GuideTab } from './components/GuideTab';
import { TitlesTab, TITLE_CATALOG } from './components/TitlesTab';

// Icons
import {
  Swords,
  Timer,
  Flame,
  Coins,
  ShieldAlert,
  Sparkles,
  Settings,
  Plus,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Volume2,
  VolumeX,
  X,
  PlusCircle,
  Clock,
  Sparkle,
  Shield,
  HelpCircle,
  Menu,
  Heart,
  CheckCircle,
  Zap,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';

const STATIC_QUOTES = [
  ['"A vida não examinada não vale a pena ser vivida."', '— Sócrates'],
  ['"Aquele que tem um porquê para viver pode suportar quase qualquer como."', '— Nietzsche'],
  ['"A disciplina é a ponte entre as metas e as realizações."', '— Jim Rohn'],
  ['"Você tem poder sobre sua mente, não sobre eventos externos."', '— Marco Aurélio'],
  ['"No meio da dificuldade reside a oportunidade."', '— Albert Einstein'],
  ['"O obstáculo é o caminho."', '— Ryan Holiday'],
  ['"A única maneira de fazer um ótimo trabalho é amar o que você faz."', '— Steve Jobs'],
];

const SKILL_SUGGESTIONS = [
  { name: 'Estudos', emoji: '📚' },
  { name: 'Foco Profundo', emoji: '🧠' },
  { name: 'Pesquisa', emoji: '🔬' },
  { name: 'Escrita', emoji: '✍️' },
  { name: 'Idiomas', emoji: '🗣️' },
  { name: 'Leitura', emoji: '📖' },
  { name: 'Programação', emoji: '💻' },
  { name: 'Exercícios', emoji: '🏋️' },
  { name: 'Meditação', emoji: '🧘' },
  { name: 'Artes & Pintura', emoji: '🎨' },
  { name: 'Culinária', emoji: '🍳' },
  { name: 'Finanças', emoji: '💰' },
  { name: 'Música', emoji: '🎵' },
  { name: 'Organização', emoji: '📅' },
  { name: 'Jogos & Estratégia', emoji: '🎮' },
  { name: 'Trabalho', emoji: '💼' }
];

const SKILL_EMOJIS = ['📚', '💻', '🧠', '✍️', '🗣️', '🏋️', '🎨', '🍳', '🔬', '🧘', '🎵', '💰', '💼', '🧪', '🛡️', '🎯'];

interface AppProps {
  userId: string;
  signOut: () => Promise<void>;
}

function App({ userId, signOut }: AppProps) {
  // Ref para o onConflict — permite usar setCustomDialog antes de ele ser declarado
  const onConflictRef = useRef<((r: any, l: any) => Promise<'remote' | 'local'>) | null>(null);

  // Master Game State — sync com Supabase via userId
  const { gameState, setGameState, resetGameState, importGameState, syncStatus } = useGameState({
    user: { id: userId },
    onConflict: (remoteState, localState) =>
      onConflictRef.current
        ? onConflictRef.current(remoteState, localState)
        : Promise.resolve<'remote' | 'local'>('remote'),
  });

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<string>('focus');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Epic Level Up Modal Queue and references
  const [levelUpQueue, setLevelUpQueue] = useState<LevelUpModalType[]>([]);
  const lastKnownCombatLevelRef = useRef<number>(gameState.combatLevel);
  const lastKnownSkillLevelsRef = useRef<Record<string, number>>({});
  const isImportingRef = useRef<boolean>(false);

  // Sub-system Timers state
  const [timerDuration, setTimerDuration] = useState<number>(() => {
    try {
      const data = localStorage.getItem('herolog_active_session');
      if (data) {
        const session = JSON.parse(data);
        if (session && session.isActive && session.endTime > Date.now()) {
          return Math.round(session.duration / 1000);
        }
      }
    } catch (e) {}
    return 25 * 60;
  });
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    try {
      const data = localStorage.getItem('herolog_active_session');
      if (data) {
        const session = JSON.parse(data);
        if (session && session.isActive && session.endTime > Date.now()) {
          return Math.max(0, Math.round((session.endTime - Date.now()) / 1000));
        }
      }
    } catch (e) {}
    return 25 * 60;
  });
  const [isRunning, setIsRunning] = useState<boolean>(() => {
    try {
      const data = localStorage.getItem('herolog_active_session');
      if (data) {
        const session = JSON.parse(data);
        if (session && session.isActive && session.endTime > Date.now()) {
          return true;
        }
      }
    } catch (e) {}
    return false;
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pauseCount, setPauseCount] = useState<number>(0);
  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);
  const [customInputMins, setCustomInputMins] = useState<string>('25');
  const [isConfirmingAbandon, setIsConfirmingAbandon] = useState<boolean>(false);
  const [isBreakPrep, setIsBreakPrep] = useState<boolean>(false);
  const [isBreakActive, setIsBreakActive] = useState<boolean>(false);
  const [selectedBreakMins, setSelectedBreakMins] = useState<number>(5);

  // Setup options
  const [selectedSkillIdx, setSelectedSkillIdx] = useState<number>(() => {
    try {
      const data = localStorage.getItem('herolog_active_session');
      if (data) {
        const session = JSON.parse(data);
        if (session && session.isActive) {
          return session.skillIdx;
        }
      }
    } catch (e) {}
    return 0;
  });
  // Ref para garantir que completeFocusQuest sempre leia o skillIdx atual,
  // mesmo quando chamada de dentro de closures stale do setInterval.
  const selectedSkillIdxRef = useRef<number>(0);
  useEffect(() => { selectedSkillIdxRef.current = selectedSkillIdx; }, [selectedSkillIdx]);
  const [isWildernessChecked, setIsWildernessChecked] = useState<boolean>(() => {
    try {
      const data = localStorage.getItem('herolog_active_session');
      if (data) {
        const session = JSON.parse(data);
        if (session && session.isActive) {
          return !!session.isWilderness;
        }
      }
    } catch (e) {}
    return false;
  });
  const [isDungeonMode, setIsDungeonMode] = useState<boolean>(() => {
    try {
      const data = localStorage.getItem('herolog_active_session');
      if (data) {
        const session = JSON.parse(data);
        if (session && session.isActive) {
          return !!session.isDungeon;
        }
      }
    } catch (e) {}
    return false;
  });
  const [dungeonSessions, setDungeonSessions] = useState<number>(() => {
    try {
      const data = localStorage.getItem('herolog_active_session');
      if (data) {
        const session = JSON.parse(data);
        if (session && session.isActive) {
          return session.dungeonStep || 0;
        }
      }
    } catch (e) {}
    return 0;
  });
  const [lastDungeonClearedTime, setLastDungeonClearedTime] = useState<number>(0);
  const [showActionWindowTooltip, setShowActionWindowTooltip] = useState<boolean>(false);
  const [showDungeonTooltip, setShowDungeonTooltip] = useState<boolean>(false);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [muteSfx, setMuteSfx] = useState<boolean>(false);

  // Modals Toggles
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isImportTextOpen, setIsImportTextOpen] = useState<boolean>(false);
  const [pastedSaveText, setPastedSaveText] = useState<string>('');
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState<boolean>(false);
  const [inspectingItem, setInspectingItem] = useState<InventoryItem | null>(null);
  const [newSkillNameInput, setNewSkillNameInput] = useState<string>('');
  const [selectedNewSkillEmoji, setSelectedNewSkillEmoji] = useState<string>('📚');
  const [showSkillsTooltip, setShowSkillsTooltip] = useState<boolean>(false);
  const [inspectingSkillIdx, setInspectingSkillIdx] = useState<number | null>(null);
  const [editSkillName, setEditSkillName] = useState<string>('');
  
  // Game events states
  const [logs, setLogs] = useState<{ id: string; time: string; text: string; highlighted: boolean }[]>([]);
  const [activeScreenEvent, setActiveScreenEvent] = useState<{ text: string; multiplierType: 'xp' | 'gold' | 'instant' } | null>(null);
  const [quoteOfTheDay, setQuoteOfTheDay] = useState<string[]>(STATIC_QUOTES[0]);
  const [isPlayerDead, setIsPlayerDead] = useState<boolean>(false);
  const [isGraceActive, setIsGraceActive] = useState<boolean>(false);
  const [graceSecondsLeft, setGraceSecondsLeft] = useState<number>(3);

  // Reward claim modals Toggles
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isConfirm: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  // Injeta handler de conflito de sync agora que setCustomDialog está disponível
  onConflictRef.current = (_remoteState: any, _localState: any) =>
    new Promise<'remote' | 'local'>((resolve) => {
      setCustomDialog({
        isOpen: true,
        title: '⚡ Save mais recente encontrado',
        message:
          'Encontramos um progresso mais recente salvo na nuvem. ' +
          'Usar o save da nuvem ou manter o progresso local atual?',
        isConfirm: true,
        onConfirm: () => { setCustomDialog(null); resolve('remote'); },
        onCancel: () => resolve('local'),
      });
    });

  const [rewardsModalData, setRewardsModalData] = useState<{
    visible: boolean;
    skillName: string;
    skillIdx: number;
    xpEarned: number;
    goldEarned: number;
    notes: string;
    durationMins: number;
    lootName?: string;
    lootEmoji?: string;
    droppedTitleName?: string;
    droppedTitleEmoji?: string;
    aiChronicleLoading: boolean;
    aiChronicleResult?: string;
    dungeonClearGoldBonus: number;
    hasUsedDoubleLoot: boolean;
    hasUsedFocusElixir: boolean;
    hasUsedRuneFortune: boolean;
    hasUsedCrystalClarity: boolean;
    usedEquipmentIndicesAndCharges: { index: number; charges: number }[];
    lootedItem?: { name: string; emoji: string };
    droppedTitle?: { id: string; name: string; emoji: string };
    isWildernessChecked: boolean;
    isDungeonMode: boolean;
    pauseCount: number;
    comboBonusPercent: number;
  } | null>(null);

  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [completionTag, setCompletionTag] = useState<string>('');
  const [rewardsStep, setRewardsStep] = useState<number>(1);

  // Refs for background loops
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const graceTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const focusEndTimeRef = useRef<number | null>(null);
  const isBreakActiveRef = useRef<boolean>(false);
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const timerDurationRef = useRef(25 * 60);

  // Track Combat and Skill Level Up
  useEffect(() => {
    if (gameState.skills) {
      gameState.skills.forEach(sk => {
        if (lastKnownSkillLevelsRef.current[sk.name] === undefined) {
          lastKnownSkillLevelsRef.current[sk.name] = sk.level;
        }
      });
    }
  }, []);

  useEffect(() => {
    const prevCombat = lastKnownCombatLevelRef.current;
    const currentCombat = gameState.combatLevel;

    if (isImportingRef.current) {
      lastKnownCombatLevelRef.current = currentCombat;
      if (gameState.skills) {
        gameState.skills.forEach(sk => {
          lastKnownSkillLevelsRef.current[sk.name] = sk.level;
        });
      }
      isImportingRef.current = false;
      return;
    }

    // Detect Combat Level Up
    if (currentCombat > prevCombat && prevCombat > 0) {
      setLevelUpQueue(prevQueue => [
        ...prevQueue,
        {
          type: 'combat',
          oldLevel: prevCombat,
          newLevel: currentCombat,
          charName: gameState.charName || 'Aventureiro',
          charClass: gameState.charClass || 'Guerreiro'
        }
      ]);
    }
    lastKnownCombatLevelRef.current = currentCombat;

    // Detect Skills Level Up
    if (gameState.skills) {
      gameState.skills.forEach(sk => {
        const prevSkillLvl = lastKnownSkillLevelsRef.current[sk.name];
        if (prevSkillLvl !== undefined && sk.level > prevSkillLvl && prevSkillLvl > 0) {
          setLevelUpQueue(prevQueue => [
            ...prevQueue,
            {
              type: 'skill',
              skillName: sk.name,
              emoji: sk.emoji || '🎯',
              oldLevel: prevSkillLvl,
              newLevel: sk.level
            }
          ]);
        }
        lastKnownSkillLevelsRef.current[sk.name] = sk.level;
      });
    }
  }, [gameState.combatLevel, gameState.skills, gameState.charName, gameState.charClass]);

  // Play sound when active level up changes
  useEffect(() => {
    if (levelUpQueue.length > 0 && !muteSfx) {
      sound.playLevelUp();
    }
  }, [levelUpQueue.length, muteSfx]);

  // Expose test/debug helpers to window for manual testing in DevTools
  useEffect(() => {
    (window as any).triggerSkillLevelUp = (skillIndex: number = 0) => {
      setGameState(prev => {
        const updatedSkills = prev.skills.map((sk, idx) => {
          if (idx === skillIndex) {
            return { ...sk, level: sk.level + 1 };
          }
          return sk;
        });
        return { ...prev, skills: updatedSkills };
      });
      console.log(`[Quest of Mind] Subiu o nível da habilidade no índice ${skillIndex}!`);
    };

    (window as any).triggerCombatLevelUp = () => {
      setGameState(prev => ({
        ...prev,
        combatLevel: prev.combatLevel + 1
      }));
      console.log("[Quest of Mind] Subiu o nível de combate!");
    };

    (window as any).setSkillLevel = (skillIndex: number, level: number) => {
      setGameState(prev => {
        const updatedSkills = prev.skills.map((sk, idx) => {
          if (idx === skillIndex) {
            return { ...sk, level };
          }
          return sk;
        });
        return { ...prev, skills: updatedSkills };
      });
      console.log(`[Quest of Mind] Nível da habilidade ${skillIndex} definido para ${level}`);
    };

    return () => {
      delete (window as any).triggerSkillLevelUp;
      delete (window as any).triggerCombatLevelUp;
      delete (window as any).setSkillLevel;
    };
  }, []);

  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { timerDurationRef.current = timerDuration; }, [timerDuration]);
  useEffect(() => { isBreakActiveRef.current = isBreakActive; }, [isBreakActive]);

  const completeSessionOnReload = (session: ActiveSession) => {
    localStorage.removeItem('herolog_active_session');

    setGameState(prev => {
      const studiedMinutes = Math.floor(session.duration / (60 * 1000));
      const activeSkillName = prev.skills[session.skillIdx]?.name || 'Código Sagrado';

      // Calculate core rewards
      const baseXP = studiedMinutes * 2;
      const baseGold = studiedMinutes * 3;

      // Apply multipliers setup
      let xpMultiplier = 1.0;
      let goldMultiplier = 1.0;

      // Titles perk multipliers
      const eqTitleId = prev.equippedTitle;
      let titleXpAdd = 0;
      let titleGoldAdd = 0;

      if (eqTitleId === 'LEGEND_GP') titleXpAdd += 0.05;
      if (eqTitleId === 'INFERNO') titleXpAdd += 0.08;
      if (eqTitleId === 'STARBOUND') { titleXpAdd += 0.10; titleGoldAdd += 0.08; }
      if (eqTitleId === 'DRAGONBORN') titleXpAdd += 0.15;
      if (eqTitleId === 'VOIDWALKER') titleXpAdd += 0.20;
      if (eqTitleId === 'THE_WATCHER') { titleXpAdd += 0.25; titleGoldAdd += 0.15; }
      if (eqTitleId === 'TRANSCENDENT') { titleXpAdd += 0.30; titleGoldAdd += 0.20; }
      if (eqTitleId === 'THE_ETERNAL_SCHOLAR') { titleXpAdd += 0.50; titleGoldAdd += 0.30; }

      // Achievements
      if (eqTitleId === 'IRON_WILL') titleXpAdd += 0.05;
      if (eqTitleId === 'DIAMOND_MIND') { titleXpAdd += 0.08; titleGoldAdd += 0.05; }
      if (eqTitleId === 'THE_CENTURY') { titleXpAdd += 0.12; titleGoldAdd += 0.08; }
      if (eqTitleId === 'A_FULL_YEAR') { titleXpAdd += 0.25; titleGoldAdd += 0.15; }
      if (eqTitleId === 'CENTURION') titleXpAdd += 0.05;
      if (eqTitleId === 'THE_OBSESSED') { titleXpAdd += 0.15; titleGoldAdd += 0.10; }
      if (eqTitleId === 'IMMORTAL_SCHOLAR') { titleXpAdd += 0.25; titleGoldAdd += 0.20; }
      if (eqTitleId === 'DEATH-PROOF') {
        if (session.isWilderness) titleXpAdd += 0.25;
      }
      if (eqTitleId === 'DUNGEON_LORD') {
        if (session.isDungeon) titleXpAdd += 0.15;
      }
      if (eqTitleId === 'RAID_VETERAN') {
        if (session.isDungeon) { titleXpAdd += 0.25; titleGoldAdd += 0.20; }
      }
      if (eqTitleId === 'LEGEND_ACH') titleXpAdd += 0.10;
      if (eqTitleId === 'PANTHEON') titleXpAdd += 0.20;
      if (eqTitleId === 'MANIAC') titleXpAdd += 0.10;
      if (eqTitleId === 'IN_THE_ZONE') titleXpAdd += 0.05;
      if (eqTitleId === 'MARATHONER') {
        if (studiedMinutes >= 60) titleXpAdd += 0.15;
      }
      if (eqTitleId === 'XP_GOD') { titleXpAdd += 0.20; titleGoldAdd += 0.10; }
      if (eqTitleId === 'NOCTURNAL') titleXpAdd += 0.15;
      if (eqTitleId === 'ASCENDED') titleXpAdd += 0.10;

      // Drops
      if (eqTitleId === 'BLESSED') { titleXpAdd += 0.08; titleGoldAdd += 0.10; }
      if (eqTitleId === 'SHADOW') titleXpAdd += 0.10;
      if (eqTitleId === 'THE_FORSAKEN') {
        if (session.isWilderness) titleXpAdd += 0.15;
      }
      if (eqTitleId === 'CELESTIAL') { titleXpAdd += 0.20; titleGoldAdd += 0.15; }
      if (eqTitleId === 'THUNDERSTRUCK') {
        if (session.isWilderness) titleXpAdd += 0.25;
        titleGoldAdd += 0.10;
      }
      if (eqTitleId === 'HAUNTED') { titleXpAdd += 0.10; titleGoldAdd += 0.20; }
      if (eqTitleId === 'BLOOD_FORGED') {
        if (session.isDungeon) { titleXpAdd += 0.20; titleGoldAdd += 0.20; }
      }

      xpMultiplier += titleXpAdd;
      goldMultiplier += titleGoldAdd;

      // Class perks
      if (prev.charClass === 'Mage') xpMultiplier += 0.20;
      if (prev.charClass === 'Warrior') goldMultiplier += 0.20;

      // Combo system boosts
      const comboBoost = Math.min(prev.combo * 0.05, 0.50);
      xpMultiplier += comboBoost;

      // Wilderness survival bonuses (+25% extras)
      if (session.isWilderness) {
        xpMultiplier += 0.25;
        goldMultiplier += 0.25;
      }

      // Dungeon Run rewards (+50% XP per minute every session)
      if (session.isDungeon) {
        xpMultiplier += 0.50;
      }

      // Active single use consumables bought from goblin shop check
      const doubleLootIdx = prev.inventory.findIndex(item => item.buff === 'DoubleLoot');
      let hasUsedDoubleLoot = false;
      if (doubleLootIdx >= 0) {
        goldMultiplier *= 2.0;
        hasUsedDoubleLoot = true;
      }

      const focusElixirIdx = prev.inventory.findIndex(item => item.buff === 'FocusElixir');
      let hasUsedFocusElixir = false;
      if (focusElixirIdx >= 0) {
        xpMultiplier += 0.20;
        hasUsedFocusElixir = true;
      }

      const runeFortuneIdx = prev.inventory.findIndex(item => item.buff === 'RuneFortune');
      let hasUsedRuneFortune = false;
      if (runeFortuneIdx >= 0) {
        goldMultiplier *= 2.0;
        hasUsedRuneFortune = true;
      }

      const crystalClarityIdx = prev.inventory.findIndex(item => item.buff === 'CrystalClarity');
      let hasUsedCrystalClarity = false;
      if (crystalClarityIdx >= 0) {
        xpMultiplier *= 2.00;
        hasUsedCrystalClarity = true;
      }

      // --- EQUIPMENT SLOTS ACTIVE BOOSTS ---
      const equipped = prev.equippedEquipment || [null, null, null];
      let usedEquipmentIndicesAndCharges: { index: number; charges: number }[] = [];

      equipped.forEach((item, index) => {
        if (item) {
          let activated = false;
          if (item.buff === 'PixelOwl') {
            xpMultiplier += 0.05;
            activated = true;
          } else if (item.buff === 'DragonQuill') {
            if (studiedMinutes >= 45) {
              xpMultiplier += 0.08;
              activated = true;
            }
          } else if (item.buff === 'CrystalBall') {
            xpMultiplier += 0.10;
            activated = true;
          } else if (item.buff === 'AncientTome') {
            if (studiedMinutes >= 60) {
              xpMultiplier += 0.15;
              activated = true;
            }
          }

          if (activated) {
            const currentCharges = item.charges ?? 8;
            usedEquipmentIndicesAndCharges.push({ index, charges: currentCharges - 1 });
          }
        }
      });

      const finalXP = Math.floor(baseXP * xpMultiplier);
      const finalGold = Math.floor(baseGold * goldMultiplier);

      // Loot rates custom multiplier based on title
      let lootRateMultiplier = 1.0;
      if (eqTitleId === 'VOIDWALKER') lootRateMultiplier += 0.50;
      if (eqTitleId === 'TRANSCENDENT' || eqTitleId === 'CELESTIAL') lootRateMultiplier += 1.00;
      if (eqTitleId === 'IMMORTAL_SCHOLAR') lootRateMultiplier += 0.50;
      if (eqTitleId === 'NOCTURNAL') lootRateMultiplier += 0.30;
      if (eqTitleId === 'SHADOW') lootRateMultiplier += 0.75;

      // Random Loot drops
      const landedLoots: { name: string; emoji: string }[] = [];
      const rollCount = session.isDungeon ? 4 : 1;

      for (let r = 0; r < rollCount; r++) {
        let thresholdChance = session.isDungeon ? 0.40 : (studiedMinutes >= 90 ? 0.70 : studiedMinutes >= 50 ? 0.45 : 0.25);
        thresholdChance = Math.min(0.95, thresholdChance * lootRateMultiplier);
        if (Math.random() < thresholdChance) {
          const lootCatalog = session.isDungeon 
            ? [
                { name: 'Grimório Lendário do Caos 🔮', emoji: '🔮' },
                { name: 'Espada do Foco Inabalável 🗡️', emoji: '🗡️' },
                { name: 'Cálice Sagrado da Sabedoria 🏆', emoji: '🏆' },
                { name: 'Relíquia Secreta Arcana 🔱', emoji: '🔱' },
                { name: 'Pedra Filosofal Rúnica 💎', emoji: '💎' }
              ]
            : [
                { name: 'Grimório de Prata', emoji: '📚' },
                { name: 'Pergaminho Antigo', emoji: '📜' },
                { name: 'Poção Celestina', emoji: '🧪' },
                { name: 'Fécula de Estrelas', emoji: '✨' },
                { name: 'Broche de Ouro', emoji: '🏅' }
              ];
          const lootItem = lootCatalog[Math.floor(Math.random() * lootCatalog.length)];
          landedLoots.push(lootItem);
        }
      }

      let lootedItem: { name: string; emoji: string } | undefined = undefined;
      if (landedLoots.length > 0) {
        lootedItem = {
          name: landedLoots.map(l => l.name).join(', '),
          emoji: landedLoots[0].emoji
        };
      }

      // --- TITLE DROP CHECK ---
      let baseTitleChance = session.isDungeon ? 0.05 : (studiedMinutes >= 50 ? 0.03 : 0.01);
      let titleDropMultiplier = 1.0;
      if (eqTitleId === 'VOIDWALKER') titleDropMultiplier += 0.50;
      if (eqTitleId === 'NOCTURNAL') titleDropMultiplier += 0.30;
      if (eqTitleId === 'SHADOW') titleDropMultiplier += 0.75;

      let finalTitleDropChance = baseTitleChance * titleDropMultiplier;
      let droppedTitle: { id: string; name: string; emoji: string } | undefined = undefined;

      if (Math.random() < finalTitleDropChance) {
        const dropTitlesPool = [
          { id: 'BLESSED', name: 'BLESSED', emoji: '🌸' },
          { id: 'SHADOW', name: 'SHADOW', emoji: '🌑' },
          { id: 'THE_FORSAKEN', name: 'THE FORSAKEN', emoji: '🔮' },
          { id: 'CELESTIAL', name: 'CELESTIAL', emoji: '✨' },
          { id: 'THUNDERSTRUCK', name: 'THUNDERSTRUCK', emoji: '⚡' },
          { id: 'HAUNTED', name: 'HAUNTED', emoji: '👻' },
          { id: 'BLOOD_FORGED', name: 'BLOOD-FORGED', emoji: '🩸' }
        ];

        const currentOwned = prev.ownedTitles || [];
        const filteredPool = dropTitlesPool.filter(t => {
          if (currentOwned.includes(t.id)) return false;
          if (t.id === 'THUNDERSTRUCK' || t.id === 'HAUNTED' || t.id === 'THE_FORSAKEN') {
            return session.isWilderness;
          }
          if (t.id === 'BLOOD_FORGED') {
            return session.isDungeon;
          }
          return true;
        });

        if (filteredPool.length > 0) {
          droppedTitle = filteredPool[Math.floor(Math.random() * filteredPool.length)];
          setTimeout(() => {
            addSystemLog(`✨ SORTUDO UNMISSABLE: O reino abençoou sua constância e você dropou o TÍTULO RARO [${droppedTitle?.name}]!`, true);
          }, 180);
        }
      }

      // Dungeon Run milestone progression calculation
      let dungeonClearGoldBonus = 0;
      if (session.isDungeon) {
        const nextSessions = session.dungeonStep + 1;
        if (nextSessions >= 4) {
          setDungeonSessions(0);
          setIsDungeonMode(false);
          setLastDungeonClearedTime(Date.now());
          setSelectedBreakMins(prev.longBreakMinutes || 15);
          dungeonClearGoldBonus = 2500;
          setTimeout(() => {
            addSystemLog('🏆 EXPLORAÇÃO MASMORRA SUCESSO: Concluiu as 4 sessões heróicas consecutivas! Um bônus monumental místico de +2.500 GP foi adicionado aos teus espólios!', true);
          }, 120);
        } else {
          setDungeonSessions(nextSessions);
          setSelectedBreakMins(5);
          setTimeout(() => {
            addSystemLog(`⚔️ Masmorra Progresso: (${nextSessions}/4) focos consecutivos selados. Só mais ${4 - nextSessions} sessões para a glória eterna!`, true);
          }, 120);
        }
      }

      // Update skills leveling up mechanics
      const updatedSkills = prev.skills.map((sk, idx) => {
        if (idx === session.skillIdx) {
          let prestigeGrowth = 0.25;
          if (eqTitleId === 'DRAGONBORN') prestigeGrowth = 0.25 * 1.25;
          else if (eqTitleId === 'PANTHEON') prestigeGrowth = 0.25 * 1.30;
          else if (eqTitleId === 'THE_ETERNAL_SCHOLAR' || eqTitleId === 'ASCENDED') prestigeGrowth = 0.25 * 1.50;

          const prestigeBonus = 1 + (sk.prestige || 0) * prestigeGrowth;
          const finalXPApplied = Math.round(finalXP * prestigeBonus);
          let updatedXP = sk.xp + finalXPApplied;
          let currentLevel = sk.level;
          let xpRequired = currentLevel * 80;
          
          while (updatedXP >= xpRequired) {
            updatedXP -= xpRequired;
            currentLevel += 1;
            xpRequired = currentLevel * 80;
            setTimeout(() => {
              addSystemLog(`🆙 SUBIU DE NÍVEL: Sua habilidade "${sk.emoji || '🎯'} ${sk.name}" atingiu o Nível ${currentLevel}!`, true);
              if (!muteSfx) sound.playLevelUp();
            }, 100);
          }
          return { ...sk, level: currentLevel, xp: updatedXP };
        }
        return sk;
      });

      // Consume items spent
      const updatedInv = [...prev.inventory];
      if (hasUsedDoubleLoot) {
        const itemIdx = updatedInv.findIndex(i => i.buff === 'DoubleLoot');
        if (itemIdx >= 0) updatedInv.splice(itemIdx, 1);
      }
      if (hasUsedFocusElixir) {
        const itemIdx = updatedInv.findIndex(i => i.buff === 'FocusElixir');
        if (itemIdx >= 0) updatedInv.splice(itemIdx, 1);
      }
      if (hasUsedRuneFortune) {
        const itemIdx = updatedInv.findIndex(i => i.buff === 'RuneFortune');
        if (itemIdx >= 0) updatedInv.splice(itemIdx, 1);
      }
      if (hasUsedCrystalClarity) {
        const itemIdx = updatedInv.findIndex(i => i.buff === 'CrystalClarity');
        if (itemIdx >= 0) updatedInv.splice(itemIdx, 1);
      }

      // Decrement charges of worn equipment
      const updatedEquip = prev.equippedEquipment ? [...prev.equippedEquipment] : [null, null, null];
      usedEquipmentIndicesAndCharges.forEach(({ index, charges }) => {
        if (charges <= 0) {
          const item = updatedEquip[index];
          if (item) {
            setTimeout(() => {
              addSystemLog(`⚠️ O equipamento "${item.emoji} ${item.name}" gastou todas as suas cargas e quebrou!`, true);
            }, 250);
          }
          updatedEquip[index] = null;
        } else {
          const item = updatedEquip[index];
          if (item) {
            updatedEquip[index] = {
              ...item,
              charges: charges
            };
          }
        }
      });

      // Add looted item directly
      if (lootedItem) {
        const randVal = Math.random();
        if (randVal < 0.40) {
          const equipments = [
            {
              name: 'Coruja Pixelada',
              emoji: '🦉',
              desc: 'Equipável: +5% de XP em todas as sessões. (8 Cargas)',
              price: 250,
              buff: 'PixelOwl' as BuffType,
              isEquipment: true,
              charges: 8,
              maxCharges: 8
            },
            {
              name: 'Pena de Dragão',
              emoji: '🪶',
              desc: 'Equipável: +8% de XP em sessões de 45 min+. (8 Cargas)',
              price: 300,
              buff: 'DragonQuill' as BuffType,
              isEquipment: true,
              charges: 8,
              maxCharges: 8
            },
            {
              name: 'Bola de Cristal',
              emoji: '🔮',
              desc: 'Equipável: +10% de XP em todas as sessões. (10 Cargas)',
              price: 400,
              buff: 'CrystalBall' as BuffType,
              isEquipment: true,
              charges: 10,
              maxCharges: 10
            },
            {
              name: 'Tomo Antigo',
              emoji: '📖',
              desc: 'Equipável: +15% de XP em sessões de 60 min+. (8 Cargas)',
              price: 500,
              buff: 'AncientTome' as BuffType,
              isEquipment: true,
              charges: 8,
              maxCharges: 8
            }
          ];

          const eqDrop = equipments[Math.floor(Math.random() * equipments.length)];
          updatedInv.push({
            id: `eq_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            ...eqDrop
          });
          
          setTimeout(() => {
            addSystemLog(`✨ ESPÓLIO LENDÁRIO ENCONTRADO: Você localizou o equipamento "${eqDrop.emoji} ${eqDrop.name}"! Vá à Ficha para equipá-lo.`, true);
          }, 200);
        } else {
          updatedInv.push({
            id: `loot_${Date.now()}`,
            name: lootedItem.name,
            emoji: lootedItem.emoji,
            buff: 'DoubleLoot',
            price: 50,
            desc: 'Espólio colecionável de foco heróico.'
          });
        }
      }

      // Combat level progression
      let combatXPApplied = prev.combatXP + Math.floor(finalXP * 0.4);
      let currentCombatLevel = prev.combatLevel;
      let combatXPRequirement = currentCombatLevel * 100;

      while (combatXPApplied >= combatXPRequirement) {
        combatXPApplied -= combatXPRequirement;
        currentCombatLevel += 1;
        combatXPRequirement = currentCombatLevel * 100;
        setTimeout(() => {
          addSystemLog(`🏆 SUBIDA DE NÍVEL COMBATE: Seus atributos se transbordaram misticamente! Nível de Combate ${currentCombatLevel}!`, true);
          if (!muteSfx) sound.playLevelUp();
        }, 150);
      }

      // Series (Streaks) & Combos sync
      const todayString = new Date().toDateString();
      let newStreak = prev.streak;
      if (prev.lastStudyDate !== todayString) {
        newStreak = prev.streak + 1;
      }
      const newBestStreak = Math.max(newStreak, prev.bestStreak);

      const historyObj = {
        id: `session_${Date.now()}_${Math.random()}`,
        skillName: activeSkillName,
        date: new Date().toLocaleString('pt-BR'),
        duration: studiedMinutes,
        xp: finalXP,
        gold: finalGold + dungeonClearGoldBonus,
        notes: "Sessão concluída em segundo plano e recuperada com sucesso.",
        wilderness: !!session.isWilderness,
      };

      // Achievements validation
      const unlockedAchievements = [...prev.achievements];
      const testAchievements = [
        { id: 'first_quest', targetValue: 1, current: prev.totalSessions + 1 },
        { id: 'streak_3', targetValue: 3, current: newBestStreak },
        { id: 'streak_7', targetValue: 7, current: newBestStreak },
        { id: 'xp_1000', targetValue: 1000, current: prev.totalXP + finalXP }
      ];

      testAchievements.forEach(ach => {
        if (!unlockedAchievements.includes(ach.id) && ach.current >= ach.targetValue) {
          unlockedAchievements.push(ach.id);
          setTimeout(() => {
            addSystemLog(`🏆 CONQUISTA HERÓICA: Desbloqueada rúnica especial [${ach.id.toUpperCase()}]!`, true);
          }, 350);
        }
      });

      if (session.isWilderness && !unlockedAchievements.includes('survive_wilderness')) {
        unlockedAchievements.push('survive_wilderness');
        setTimeout(() => {
          addSystemLog(`🏆 CONQUISTA HERÓICA: Desbloqueaste o selo [Sobrevivente da Wilderness]!`, true);
        }, 360);
      }

      const nextOwnedTitles = [...(prev.ownedTitles || [])];
      if (droppedTitle && !nextOwnedTitles.includes(droppedTitle.id)) {
        nextOwnedTitles.push(droppedTitle.id);
      }

      setTimeout(() => {
        addSystemLog(`✅ Missão divina completa (Auto-Recuperada): ${activeSkillName} | +${finalXP} XP | +${finalGold + dungeonClearGoldBonus} GP ganho.`, true);
        if (!muteSfx) sound.playCoins();
      }, 500);

      return {
        ...prev,
        gold: prev.gold + finalGold + dungeonClearGoldBonus,
        totalGoldEarned: prev.totalGoldEarned + finalGold + dungeonClearGoldBonus,
        totalSessions: prev.totalSessions + 1,
        totalMinutes: prev.totalMinutes + studiedMinutes,
        combatLevel: currentCombatLevel,
        combatXP: combatXPApplied,
        skills: updatedSkills,
        inventory: updatedInv,
        equippedEquipment: updatedEquip,
        history: [historyObj, ...prev.history],
        streak: newStreak,
        bestStreak: newBestStreak,
        lastStudyDate: todayString,
        wildernessWins: prev.wildernessWins + (session.isWilderness ? 1 : 0),
        combo: prev.combo + 1,
        todayMinutes: prev.todayMinutes + studiedMinutes,
        todayXP: prev.todayXP + finalXP,
        achievements: unlockedAchievements,
        ownedTitles: nextOwnedTitles,
      };
    });

    setIsRunning(false);
    setIsPaused(false);
    setIsGraceActive(false);
    setActiveScreenEvent(null);
    setIsBreakPrep(true);
  };

  useEffect(() => {
    try {
      const data = localStorage.getItem('herolog_active_session');
      if (data) {
        const session = JSON.parse(data) as ActiveSession;
        if (session && session.isActive) {
          if (session.endTime > Date.now()) {
            const endTime = session.endTime;
            focusEndTimeRef.current = endTime;
            addSystemLog(`⚔️ Recuperando portal rúnico! Jornada ativa restaurada com sucesso para a habilidade selecionada.`, true);
            
            triggerRandomAmbientEncounterScheduler();

            timerIntervalRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  clearInterval(timerIntervalRef.current!);
                  completeFocusQuest();
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          } else {
            completeSessionOnReload(session);
          }
        }
      }
    } catch (e) {
      console.error('Error recovering active session:', e);
    }
  }, []);

  // ── CORREÇÃO RETROATIVA ──────────────────────────────────────────────────
  // Sessões registradas com o bug do closure stale ficaram com skillName
  // 'Código Sagrado (Programação)' mesmo quando outra skill estava selecionada.
  // Este efeito roda uma única vez após o gameState ser carregado do Supabase
  // e renomeia essas entradas para o nome real da skill usada (lido do
  // herolog_active_session que foi salvo corretamente no localStorage).
  //
  // Estratégia conservadora: só corrige sessões do DIA ATUAL cuja skillName
  // seja a skill de índice 0, e para as quais existe um registro confiável
  // do skillIdx correto via localStorage (herolog_skill_history_fix).
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const FIX_KEY = 'herolog_skill_history_fix_applied_v1';
    if (localStorage.getItem(FIX_KEY)) return; // já rodou

    setGameState(prev => {
      const todayStr = new Date().toDateString();
      const defaultSkillName = prev.skills[0]?.name;
      if (!defaultSkillName) return prev;

      // Pega o nome da skill que deveria ter sido usada hoje (Trabalho = índice da skill "Trabalho")
      // Heurística: se o usuário tem uma skill que não é a skill[0] nas skills cadastradas,
      // verificamos se alguma sessão de hoje tem skillName === skills[0].name, o que indica o bug.
      // Não temos como saber o skillIdx original das sessões já salvas sem mais contexto,
      // então sinalizamos no log para o usuário corrigir manualmente se necessário.
      const buggySessions = prev.history.filter(h => {
        const sessionDate = new Date(h.date).toDateString();
        return sessionDate === todayStr && h.skillName === defaultSkillName;
      });

      if (buggySessions.length === 0) {
        localStorage.setItem(FIX_KEY, '1');
        return prev;
      }

      // Logar aviso para o usuário — correção automática não é segura sem saber
      // qual skill foi realmente usada
      setTimeout(() => {
        addSystemLog(
          `⚠️ FIX: Encontradas ${buggySessions.length} sessão(ões) de hoje registradas com a skill padrão por causa de um bug de closure. ` +
          `O bug foi corrigido para novas sessões. Para corrigir o histórico manualmente, edite as entradas no painel de Histórico.`,
          true
        );
      }, 2000);

      localStorage.setItem(FIX_KEY, '1');
      return prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.history.length > 0 ? gameState.history[0]?.id : null]);

  // Initial welcome and daily updates checking
  useEffect(() => {
    addSystemLog('⚔️ Bem-vindo ao Santuário de HeroLog! Firme sua espada cognitiva e comece a focar.', true);
    
    // Choose Quote of the Day
    const randQuote = STATIC_QUOTES[Math.floor(Math.random() * STATIC_QUOTES.length)];
    setQuoteOfTheDay(randQuote);

    // Reset daily counters if a new day commenced
    const todayStr = new Date().toDateString();
    if (gameState.todayDate !== todayStr) {
      setGameState(prev => {
        let currentStreak = prev.streak;
        
        // Sincronizar séries
        if (prev.lastStudyDate) {
          const lastDateObj = new Date(prev.lastStudyDate);
          const differenceInTime = new Date().getTime() - lastDateObj.getTime();
          const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
          
          if (differenceInDays === 1) {
            // Continua a série de dias
          } else if (differenceInDays > 1) {
            // Check if user is carrying an active StreakShield in inventory
            const shieldIndex = prev.inventory.findIndex(item => item.buff === 'StreakShield');
            if (shieldIndex >= 0) {
              const updatedInv = [...prev.inventory];
              updatedInv.splice(shieldIndex, 1);
              currentStreak = prev.streak; // Preserved streak!
              setTimeout(() => {
                addSystemLog('🛡️ Escudo do Santuário ativado! Sua streak de dias consecutivos está preservada do gelo do esquecimento.', true);
              }, 100);
            } else {
              currentStreak = 0; // Series decays
              setTimeout(() => {
                addSystemLog('⚠️ Sua chama de streak murchou... Dedique-se todos os dias para herdar a constância.', false);
              }, 100);
            }
          }
        }
        
        // --- HABITICA DAILY NEGLECT DAMAGE SECTION ---
        let dailyNeglectDamage = 0;
        let missedCount = 0;
        const updatedDailies = (prev.dailies || []).map(d => {
          if (!d.completed) {
            const { damage } = getDifficultyRewards(d.difficulty);
            dailyNeglectDamage += damage;
            missedCount += 1;
            return { ...d, streak: 0 };
          }
          return { ...d, completed: false };
        });

        let finalHp = prev.hp;
        let shieldIndex = prev.inventory.findIndex(item => item.buff === 'StreakShield');
        let updatedInv = prev.inventory;

        if (missedCount > 0) {
          if (shieldIndex >= 0) {
            updatedInv = [...prev.inventory];
            updatedInv.splice(shieldIndex, 1);
            setTimeout(() => {
              addSystemLog(`🛡️ Escudo de Streak ativado! Oração do Santuário absorveu o choque de ${missedCount} diárias negligenciadas de ontem.`, true);
            }, 150);
          } else {
            let finalDmg = dailyNeglectDamage;
            if (prev.charClass === 'Ranger') finalDmg = Math.max(1, Math.floor(dailyNeglectDamage * 0.7));

            finalHp = Math.max(0, prev.hp - finalDmg);
            if (finalHp === 0) {
              setTimeout(() => {
                setIsPlayerDead(true);
                if (!muteSfx) sound.playDeath();
              }, 100);
            }

            setTimeout(() => {
              addSystemLog(`💀 Dano Solar da Negligência: Deixaste ${missedCount} Diárias incompletas yesterday! Perdeste -${finalDmg} de vitalidade HP.`, false);
            }, 200);
          }
        }

        return {
          ...prev,
          todayDate: todayStr,
          todayMinutes: 0,
          todayXP: 0,
          streak: currentStreak,
          hasClaimedLogin: false,
          hp: finalHp,
          dailies: updatedDailies,
          inventory: updatedInv,
          achievements: (prev.achievements || []).filter(tag => !tag.startsWith('claimed_daily_'))
        };
      });
    }

    // Daily claim gold coins
    setGameState(prev => {
      if (!prev.hasClaimedLogin) {
        const rewardAmount = prev.charClass === 'Warrior' ? 120 : 100;
        setTimeout(() => {
          addSystemLog(`💎 Proclamação Diária: Recebeste +${rewardAmount} GP por adentrar hoje ao Santuário Sagrado!`, true);
          if (!muteSfx) sound.playCoins();
        }, 300);
        return {
          ...prev,
          gold: prev.gold + rewardAmount,
          totalGoldEarned: prev.totalGoldEarned + rewardAmount,
          hasClaimedLogin: true
        };
      }
      return prev;
    });

    // Detect Tab out blur events for Wilderness stakes
    const handleVisChange = () => {
      if (document.hidden) {
        triggerTabAwayInfraction();
      } else {
        if (focusEndTimeRef.current !== null && (isRunningRef.current || isBreakActiveRef.current) && !isPausedRef.current) {
          const now = Date.now();
          const remaining = Math.max(0, Math.round((focusEndTimeRef.current - now) / 1000));
          setTimeLeft(remaining);

          if (remaining <= 0) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            if (isBreakActiveRef.current) {
              setIsBreakActive(false);
              isBreakActiveRef.current = false;
              addSystemLog('✨ Mana totalmente regenerada enquanto você esteve fora! Nova Jornada de Foco disponível.', true);
              setTimeLeft(timerDurationRef.current);
            } else {
              completeFocusQuest();
            }
          }
        }
      }
    };
    
    const handleWindowBlur = () => {
      triggerTabAwayInfraction();
    };

    const handleWindowFocus = () => {
      // If user comes back while grace warning modal is ticking, keep state intact on safe grounds
    };

    document.addEventListener('visibilitychange', handleVisChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (eventIntervalRef.current) clearInterval(eventIntervalRef.current);
      if (graceTimerIntervalRef.current) clearInterval(graceTimerIntervalRef.current);
    };
  }, []);

  // System Logs Handler
  const addSystemLog = (text: string, highlighted = false) => {
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [
      { id: `${Date.now()}_${Math.random()}`, time: timeStr, text, highlighted },
      ...prev.slice(0, 50)
    ]);
  };

  // Setup clock phase details
  const getClockPhase = () => {
    const hr = new Date().getHours();
    if (hr >= 6 && hr < 12) return '🌅 Manhã';
    if (hr >= 12 && hr < 18) return '☀️ Tarde';
    if (hr >= 18 && hr < 21) return '🌆 Entardecer';
    return '🌙 Noite';
  };

  // Timer Control Hooks
  const changeDuration = (minutes: number) => {
    if (isRunning) return;
    setIsCustomTime(false);
    const secs = minutes * 60;
    setTimerDuration(secs);
    setTimeLeft(secs);
  };

  const selectCustomTime = () => {
    if (isRunning) return;
    setIsCustomTime(true);
  };

  const applyCustomTime = () => {
    const minsVal = parseInt(customInputMins);
    if (!minsVal || minsVal < 1 || minsVal > 480) return;
    const secs = minsVal * 60;
    setTimerDuration(secs);
    setTimeLeft(secs);
  };

  // Start Focus Quest Pomodoro
  const startQuestTimer = () => {
    if (gameState.skills.length === 0) {
      addSystemLog('❌ Impeditivo: Você precisa cadastrar e selecionar uma habilidade antes de iniciar su jornada.', false);
      return;
    }

    setIsBreakPrep(false);
    setIsBreakActive(false);
    setIsRunning(true);
    setIsPaused(false);
    setPauseCount(0);
    setIsPlayerDead(false);
    setIsGraceActive(false);

    const activeSkillName = gameState.skills[selectedSkillIdx]?.name || 'Código Sagrado';
    addSystemLog(`⚔️ Jornada de Foco Ativada: Canalizando forças mentais focando em "${activeSkillName}" por ${Math.floor(timerDuration/ 60)}m!`, true);
    
    if (isWildernessChecked) {
      addSystemLog('💀 ALERTA DE PERIGO: Adentraste a Terra Selvagem (Wilderness)! Não minimizes esta janela ou sofreras Morte Cognitiva.', true);
    }

    if (!muteSfx) sound.playFocusBell();

    // Trigger random encounters in intervals
    triggerRandomAmbientEncounterScheduler();

    const endTime = Date.now() + timeLeft * 1000;
    focusEndTimeRef.current = endTime;

    const activeSession: ActiveSession = {
      isActive: true,
      skillIdx: selectedSkillIdx,
      duration: timerDuration * 1000,
      endTime: endTime,
      startTime: Date.now() - (timerDuration - timeLeft) * 1000,
      isDungeon: isDungeonMode,
      dungeonStep: dungeonSessions,
      isWilderness: isWildernessChecked,
    };
    localStorage.setItem('herolog_active_session', JSON.stringify(activeSession));

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((endTime - now) / 1000));
      
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          completeFocusQuest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Pause Focus Quest Pomodoro
  const togglePauseQuest = () => {
    if (!isRunning) return;
    
    if (isPaused) {
      setIsPaused(false);
      addSystemLog(`⚔️ Jornada de Foco retomada do repouso profundo!`);
      
      const endTime = Date.now() + timeLeft * 1000;
      focusEndTimeRef.current = endTime;

      const activeSession: ActiveSession = {
        isActive: true,
        skillIdx: selectedSkillIdx,
        duration: timerDuration * 1000,
        endTime: endTime,
        startTime: Date.now() - (timerDuration - timeLeft) * 1000,
        isDungeon: isDungeonMode,
        dungeonStep: dungeonSessions,
        isWilderness: isWildernessChecked,
      };
      localStorage.setItem('herolog_active_session', JSON.stringify(activeSession));

      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            completeFocusQuest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsPaused(true);
      setPauseCount(prev => prev + 1);
      clearInterval(timerIntervalRef.current!);
      localStorage.removeItem('herolog_active_session');
      addSystemLog(`⏸️ Jornada de Foco congelada nas chagas da meditação.`);
    }
  };

  // Abandon focus quest
  const abandonQuest = () => {
    if (!isConfirmingAbandon) {
      setIsConfirmingAbandon(true);
      addSystemLog('⚠️ Atenção: Clique novamente em "Abandonar" para confirmar a desistência da missão.');
      // Auto-cancel confirmation after 5 seconds if not clicked again
      setTimeout(() => {
        setIsConfirmingAbandon(false);
      }, 5000);
      return;
    }

    safelyClearTimerLoops();
    setTimeLeft(timerDuration);
    setIsRunning(false);
    setIsPaused(false);
    setIsGraceActive(false);
    setIsConfirmingAbandon(false);
    setActiveScreenEvent(null);
    localStorage.removeItem('herolog_active_session');
    addSystemLog('⚠️ Missão abandonada trágicamente pelo aventureiro.');

    if (isDungeonMode) {
      setIsDungeonMode(false);
      setDungeonSessions(0);
      addSystemLog('💀 FRACASSO NA MASMORRA: Ao abandonar, sua expedição na Masmorra colapsou tragicamente e todo o progresso heróico de focos seguidos foi perdido nas cinzas.', true);
    }
  };

  // Safely cleanup background tick loops
  const safelyClearTimerLoops = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (eventIntervalRef.current) clearInterval(eventIntervalRef.current);
    if (graceTimerIntervalRef.current) clearInterval(graceTimerIntervalRef.current);
  };

  // Break/Descanso functions
  const startBreakTimer = (durationMinutes: number) => {
    safelyClearTimerLoops();
    setIsBreakPrep(false);
    setIsBreakActive(true);
    
    const breakDuration = durationMinutes * 60;
    setTimeLeft(breakDuration);
    
    addSystemLog(`🍵 Recuperando mana: Iniciando meditação de descanso de ${durationMinutes} minutos...`, true);
    if (!muteSfx) sound.playFocusBell();

    const endTime = Date.now() + breakDuration * 1000;
    focusEndTimeRef.current = endTime;
    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((endTime - now) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timerIntervalRef.current!);
        setIsBreakActive(false);
        addSystemLog('✨ Mana totalmente regenerada! A vitalidade mística do seu herói foi restaurada. Sinta-se à vontade para iniciar nova Missão de Foco.', true);
        if (!muteSfx) sound.playFocusBell();
        setTimeLeft(timerDuration); // Restaura a duração de foco anterior
      }
    }, 1000);
  };

  const skipBreak = () => {
    safelyClearTimerLoops();
    setIsBreakActive(false);
    setIsBreakPrep(false);
    setTimeLeft(timerDuration); // Restaura a duração de foco anterior
    addSystemLog('⏩ Descanso pulado. Preparando canais ocultos para uma nova Jornada de Foco!');
  };

  // Focus ambient modifiers & Events
  const triggerRandomAmbientEncounterScheduler = () => {
    eventIntervalRef.current = setInterval(() => {
      if (isPaused) return;

      const rolls = [
        { text: '⚡ Ondas Alfa Intensificadas! Bônus de +25% de XP nesta sessão.', multiplierType: 'xp' },
        { text: '💎 Sorte de Alquimista! Você encontrou pepitas místicas: Ouro amplificado.', multiplierType: 'gold' },
        { text: '📚 Sopro de Inspiração Filosófica! Recompensa bônus garantida.', multiplierType: 'instant' }
      ];
      
      // 30% chance of random encounter
      if (Math.random() < 0.3) {
        const event = rolls[Math.floor(Math.random() * rolls.length)];
        setActiveScreenEvent(event as any);
        addSystemLog(`✨ Evento: ${event.text}`, true);
        if (!muteSfx) sound.playCoins();

        // Expire event aura in 15 seconds
        setTimeout(() => {
          setActiveScreenEvent(null);
        }, 15000);
      }
    }, 45000);
  };

  // Wilderness infraction detection
  const triggerTabAwayInfraction = () => {
    // Wilderness must be toggled, timer active, and not already paused or in grace cycle
    if (!isRunning || !isWildernessChecked || isPaused || isGraceActive || isPlayerDead) return;

    // Check if player has the DEATH-PROOF title equipped
    if (gameState.equippedTitle === 'DEATH-PROOF') {
      setIsPaused(true);
      addSystemLog('🛡️ ESCUDO RÚNICO [DEATH-PROOF]: Você se distraiu e saiu do Santuário! A Morte Cognitiva foi convertida em Pausa por causa de o teu título equipado!', true);
      return;
    }

    setIsGraceActive(true);
    setGraceSecondsLeft(3);
    if (!muteSfx) sound.playWildernessWarning();

    addSystemLog('⚠️ INFRAÇÃO COGNITIVA: Você se distraiu e saiu do Santuário! Sombra da Morte se aproxima em 3s!', true);

    let count = 3;
    graceTimerIntervalRef.current = setInterval(() => {
      count--;
      setGraceSecondsLeft(count);
      if (!muteSfx) sound.playWildernessWarning();

      if (count <= 0) {
        clearInterval(graceTimerIntervalRef.current!);
        setIsGraceActive(false);
        // Execute death penalty
        triggerCognitiveDeath();
      }
    }, 1000);
  };

  // Terminate player's session tragically
  const triggerCognitiveDeath = () => {
    safelyClearTimerLoops();
    setIsPlayerDead(true);
    setIsRunning(false);
    setIsPaused(false);
    setIsGraceActive(false);
    setActiveScreenEvent(null);
    setTimeLeft(timerDuration);
    setSessionNotes('');
    localStorage.removeItem('herolog_active_session');

    if (!muteSfx) sound.playDeath();
    addSystemLog('💀 MORTE COGNITIVA: Você falhou no voto de silêncio e foi expulso da Terra Selvagem. Todas recompensas perdidas!', true);
    
    // Streak break penalty
    setGameState(prev => {
      // Ranger has streak decay protection benefits of +15% saving rolls
      const roll = Math.random();
      const saveChance = prev.charClass === 'Ranger' ? 0.15 : 0;
      
      let finalStreak = prev.streak;
      if (roll >= saveChance && prev.streak > 0) {
        finalStreak = 0;
        setTimeout(() => {
          addSystemLog('⚠️ Sua streak de dias ininterruptos de foco colapsou de volta ao zero.', false);
        }, 100);
      } else if (prev.streak > 0) {
        setTimeout(() => {
          addSystemLog('🏹 Esquiva Rápida! Sua agilidade como Ranger salvou sua streak de dias de expirar mesmo na falha da Wilderness!', true);
        }, 100);
      }
      return {
        ...prev,
        streak: finalStreak,
        combo: 0
      };
    });
  };

  // Respawn herói
  const respawnHero = () => {
    setIsPlayerDead(false);
    setGameState(prev => {
      const nextLevel = Math.max(1, prev.combatLevel - 1);
      const goldPenalty = 50;
      const nextGold = Math.max(0, prev.gold - goldPenalty);
      
      return {
        ...prev,
        hp: prev.maxHp,
        combatLevel: nextLevel,
        combatXP: 0,
        gold: nextGold,
      };
    });
    addSystemLog('🛡️ Ressurgindo na capela do Santuário. Sacuda as cinzas do desatenção! Tua integridade (HP) foi totalmente restaurada, mas pagaste com o rebaixamento de 1 Nível de Combate e a perda de -50 GP.', true);
  };

  const handleReturnToFocusCap = () => {
    if (graceTimerIntervalRef.current) clearInterval(graceTimerIntervalRef.current);
    setIsGraceActive(false);
    addSystemLog('🛡️ Retornou a tempo! A aura de estabilidade celestial te acolhe novamente.', true);
  };

  // Complete Study Session successfully
  const completeFocusQuest = async () => {
    safelyClearTimerLoops();
    setIsRunning(false);
    setIsPaused(false);
    setIsGraceActive(false);
    setActiveScreenEvent(null);
    setTimeLeft(timerDuration);
    localStorage.removeItem('herolog_active_session');

    // Usa o ref para garantir o skillIdx correto mesmo em closures stale do setInterval.
    // selectedSkillIdx (estado) pode estar desatualizado quando esta função foi capturada
    // pelo closure do setInterval no início da sessão.
    const currentSkillIdx = selectedSkillIdxRef.current;
    const studiedMinutes = Math.floor(timerDuration / 60);
    const activeSkillName = gameState.skills[currentSkillIdx]?.name || 'Código Sagrado';

    // Calculate core rewards
    const baseXP = studiedMinutes * 2;
    const baseGold = studiedMinutes * 3;

    // Apply multipliers setup
    let xpMultiplier = 1.0;
    let goldMultiplier = 1.0;

    // Titles perk multipliers
    const eqTitleId = gameState.equippedTitle;
    let titleXpAdd = 0;
    let titleGoldAdd = 0;

    if (eqTitleId === 'LEGEND_GP') titleXpAdd += 0.05;
    if (eqTitleId === 'INFERNO') titleXpAdd += 0.08;
    if (eqTitleId === 'STARBOUND') { titleXpAdd += 0.10; titleGoldAdd += 0.08; }
    if (eqTitleId === 'DRAGONBORN') titleXpAdd += 0.15;
    if (eqTitleId === 'VOIDWALKER') titleXpAdd += 0.20;
    if (eqTitleId === 'THE_WATCHER') { titleXpAdd += 0.25; titleGoldAdd += 0.15; }
    if (eqTitleId === 'TRANSCENDENT') { titleXpAdd += 0.30; titleGoldAdd += 0.20; }
    if (eqTitleId === 'THE_ETERNAL_SCHOLAR') { titleXpAdd += 0.50; titleGoldAdd += 0.30; }

    // Achievements
    if (eqTitleId === 'IRON_WILL') titleXpAdd += 0.05;
    if (eqTitleId === 'DIAMOND_MIND') { titleXpAdd += 0.08; titleGoldAdd += 0.05; }
    if (eqTitleId === 'THE_CENTURY') { titleXpAdd += 0.12; titleGoldAdd += 0.08; }
    if (eqTitleId === 'A_FULL_YEAR') { titleXpAdd += 0.25; titleGoldAdd += 0.15; }
    if (eqTitleId === 'CENTURION') titleXpAdd += 0.05;
    if (eqTitleId === 'THE_OBSESSED') { titleXpAdd += 0.15; titleGoldAdd += 0.10; }
    if (eqTitleId === 'IMMORTAL_SCHOLAR') { titleXpAdd += 0.25; titleGoldAdd += 0.20; }
    if (eqTitleId === 'DEATH-PROOF') {
      if (isWildernessChecked) titleXpAdd += 0.25;
    }
    if (eqTitleId === 'DUNGEON_LORD') {
      if (isDungeonMode) titleXpAdd += 0.15;
    }
    if (eqTitleId === 'RAID_VETERAN') {
      if (isDungeonMode) { titleXpAdd += 0.25; titleGoldAdd += 0.20; }
    }
    if (eqTitleId === 'LEGEND_ACH') titleXpAdd += 0.10;
    if (eqTitleId === 'PANTHEON') titleXpAdd += 0.20;
    if (eqTitleId === 'MANIAC') titleXpAdd += 0.10;
    if (eqTitleId === 'IN_THE_ZONE') titleXpAdd += 0.05;
    if (eqTitleId === 'MARATHONER') {
      if (studiedMinutes >= 60) titleXpAdd += 0.15;
    }
    if (eqTitleId === 'XP_GOD') { titleXpAdd += 0.20; titleGoldAdd += 0.10; }
    if (eqTitleId === 'NOCTURNAL') titleXpAdd += 0.15;
    if (eqTitleId === 'ASCENDED') titleXpAdd += 0.10;

    // Drops
    if (eqTitleId === 'BLESSED') { titleXpAdd += 0.08; titleGoldAdd += 0.10; }
    if (eqTitleId === 'SHADOW') titleXpAdd += 0.10;
    if (eqTitleId === 'THE_FORSAKEN') {
      if (isWildernessChecked) titleXpAdd += 0.15;
    }
    if (eqTitleId === 'CELESTIAL') { titleXpAdd += 0.20; titleGoldAdd += 0.15; }
    if (eqTitleId === 'THUNDERSTRUCK') {
      if (isWildernessChecked) titleXpAdd += 0.25;
      titleGoldAdd += 0.10;
    }
    if (eqTitleId === 'HAUNTED') { titleXpAdd += 0.10; titleGoldAdd += 0.20; }
    if (eqTitleId === 'BLOOD_FORGED') {
      if (isDungeonMode) { titleXpAdd += 0.20; titleGoldAdd += 0.20; }
    }

    xpMultiplier += titleXpAdd;
    goldMultiplier += titleGoldAdd;

    // Class perks
    if (gameState.charClass === 'Mage') xpMultiplier += 0.20; // +20% XP
    if (gameState.charClass === 'Warrior') goldMultiplier += 0.20; // +20% Gold

    // Combo system boosts
    const comboBoost = Math.min(gameState.combo * 0.05, 0.50); // capping at +50% XP
    xpMultiplier += comboBoost;

    // Active random events
    if (activeScreenEvent?.multiplierType === 'xp') xpMultiplier += 0.25;
    if (activeScreenEvent?.multiplierType === 'gold') goldMultiplier += 0.50;

    // Wilderness survival bonuses (+25% extras)
    if (isWildernessChecked) {
      xpMultiplier += 0.25;
      goldMultiplier += 0.25;
    }

    // Dungeon Run rewards (+50% XP per minute every session)
    if (isDungeonMode) {
      xpMultiplier += 0.50;
    }

    // Active single use consumables bought from goblin shop check
    const doubleLootIdx = gameState.inventory.findIndex(item => item.buff === 'DoubleLoot');
    let hasUsedDoubleLoot = false;
    if (doubleLootIdx >= 0) {
      goldMultiplier *= 2.0;
      hasUsedDoubleLoot = true;
    }

    const focusElixirIdx = gameState.inventory.findIndex(item => item.buff === 'FocusElixir');
    let hasUsedFocusElixir = false;
    if (focusElixirIdx >= 0) {
      xpMultiplier += 0.20;
      hasUsedFocusElixir = true;
    }

    const runeFortuneIdx = gameState.inventory.findIndex(item => item.buff === 'RuneFortune');
    let hasUsedRuneFortune = false;
    if (runeFortuneIdx >= 0) {
      goldMultiplier *= 2.0;
      hasUsedRuneFortune = true;
    }

    const crystalClarityIdx = gameState.inventory.findIndex(item => item.buff === 'CrystalClarity');
    let hasUsedCrystalClarity = false;
    if (crystalClarityIdx >= 0) {
      xpMultiplier *= 2.00;
      hasUsedCrystalClarity = true;
    }

    // --- EQUIPMENT SLOTS ACTIVE BOOSTS ---
    const equipped = gameState.equippedEquipment || [null, null, null];
    let usedEquipmentIndicesAndCharges: { index: number; charges: number }[] = [];

    equipped.forEach((item, index) => {
      if (item) {
        let activated = false;
        if (item.buff === 'PixelOwl') {
          xpMultiplier += 0.05;
          activated = true;
        } else if (item.buff === 'DragonQuill') {
          if (studiedMinutes >= 45) {
            xpMultiplier += 0.08;
            activated = true;
          }
        } else if (item.buff === 'CrystalBall') {
          xpMultiplier += 0.10;
          activated = true;
        } else if (item.buff === 'AncientTome') {
          if (studiedMinutes >= 60) {
            xpMultiplier += 0.15;
            activated = true;
          }
        }

        if (activated) {
          const currentCharges = item.charges ?? 8;
          usedEquipmentIndicesAndCharges.push({ index, charges: currentCharges - 1 });
        }
      }
    });

    const finalXP = Math.floor(baseXP * xpMultiplier);
    const finalGold = Math.floor(baseGold * goldMultiplier);

    // Loot rates custom multiplier based on title
    let lootRateMultiplier = 1.0;
    if (eqTitleId === 'VOIDWALKER') lootRateMultiplier += 0.50;
    if (eqTitleId === 'TRANSCENDENT' || eqTitleId === 'CELESTIAL') lootRateMultiplier += 1.00;
    if (eqTitleId === 'IMMORTAL_SCHOLAR') lootRateMultiplier += 0.50;
    if (eqTitleId === 'NOCTURNAL') lootRateMultiplier += 0.30;
    if (eqTitleId === 'SHADOW') lootRateMultiplier += 0.75;

    // Random Loot drops (Quad Loot Rolls & 40% Legendary Chance in Dungeon Mode)
    const landedLoots: { name: string; emoji: string }[] = [];
    const rollCount = isDungeonMode ? 4 : 1;

    for (let r = 0; r < rollCount; r++) {
      let thresholdChance = isDungeonMode ? 0.40 : (studiedMinutes >= 90 ? 0.70 : studiedMinutes >= 50 ? 0.45 : 0.25);
      thresholdChance = Math.min(0.95, thresholdChance * lootRateMultiplier);
      if (Math.random() < thresholdChance) {
        const lootCatalog = isDungeonMode 
          ? [
              { name: 'Grimório Lendário do Caos 🔮', emoji: '🔮' },
              { name: 'Espada do Foco Inabalável 🗡️', emoji: '🗡️' },
              { name: 'Cálice Sagrado da Sabedoria 🏆', emoji: '🏆' },
              { name: 'Relíquia Secreta Arcana 🔱', emoji: '🔱' },
              { name: 'Pedra Filosofal Rúnica 💎', emoji: '💎' }
            ]
          : [
              { name: 'Grimório de Prata', emoji: '📚' },
              { name: 'Pergaminho Antigo', emoji: '📜' },
              { name: 'Poção Celestina', emoji: '🧪' },
              { name: 'Fécula de Estrelas', emoji: '✨' },
              { name: 'Broche de Ouro', emoji: '🏅' }
            ];
        const item = lootCatalog[Math.floor(Math.random() * lootCatalog.length)];
        landedLoots.push(item);
      }
    }

    let lootedItem: { name: string; emoji: string } | undefined = undefined;
    if (landedLoots.length > 0) {
      lootedItem = {
        name: landedLoots.map(l => l.name).join(', '),
        emoji: landedLoots[0].emoji
      };
    }

    // --- TITLE DROP CHECK ---
    let baseTitleChance = isDungeonMode ? 0.05 : (studiedMinutes >= 50 ? 0.03 : 0.01);
    let titleDropMultiplier = 1.0;
    if (eqTitleId === 'VOIDWALKER') titleDropMultiplier += 0.50;
    if (eqTitleId === 'NOCTURNAL') titleDropMultiplier += 0.30;
    if (eqTitleId === 'SHADOW') titleDropMultiplier += 0.75;

    let finalTitleDropChance = baseTitleChance * titleDropMultiplier;
    let droppedTitle: { id: string; name: string; emoji: string } | undefined = undefined;

    if (Math.random() < finalTitleDropChance) {
      const dropTitlesPool = [
        { id: 'BLESSED', name: 'BLESSED', emoji: '🌸' },
        { id: 'SHADOW', name: 'SHADOW', emoji: '🌑' },
        { id: 'THE_FORSAKEN', name: 'THE FORSAKEN', emoji: '🔮' },
        { id: 'CELESTIAL', name: 'CELESTIAL', emoji: '✨' },
        { id: 'THUNDERSTRUCK', name: 'THUNDERSTRUCK', emoji: '⚡' },
        { id: 'HAUNTED', name: 'HAUNTED', emoji: '👻' },
        { id: 'BLOOD_FORGED', name: 'BLOOD-FORGED', emoji: '🩸' }
      ];

      const currentOwned = gameState.ownedTitles || [];
      const filteredPool = dropTitlesPool.filter(t => {
        if (currentOwned.includes(t.id)) return false;
        if (t.id === 'THUNDERSTRUCK' || t.id === 'HAUNTED' || t.id === 'THE_FORSAKEN') {
          return isWildernessChecked;
        }
        if (t.id === 'BLOOD_FORGED') {
          return isDungeonMode;
        }
        return true;
      });

      if (filteredPool.length > 0) {
        droppedTitle = filteredPool[Math.floor(Math.random() * filteredPool.length)];
        setTimeout(() => {
          addSystemLog(`✨ SORTUDO UNMISSABLE: O reino abençoou sua constância e você dropou o TÍTULO RARO [${droppedTitle?.name}]!`, true);
        }, 180);
      }
    }

    // Dungeon Run milestone progression calculation
    let dungeonClearGoldBonus = 0;
    if (isDungeonMode) {
      const nextSessions = dungeonSessions + 1;
      if (nextSessions >= 4) {
        dungeonClearGoldBonus = 2500;
      }
    }

    // Set interactive modal elements defaults
    setCompletionNotes(sessionNotes);
    setCompletionTag('');
    setRewardsStep(1);

    // Prepare rewards modal popup
    setRewardsModalData({
      visible: true,
      skillName: activeSkillName,
      skillIdx: currentSkillIdx,
      xpEarned: finalXP,
      goldEarned: finalGold + dungeonClearGoldBonus,
      notes: sessionNotes,
      durationMins: studiedMinutes,
      lootName: lootedItem?.name,
      lootEmoji: lootedItem?.emoji,
      droppedTitleName: droppedTitle?.name,
      droppedTitleEmoji: droppedTitle?.emoji,
      aiChronicleLoading: false,
      aiChronicleResult: undefined,
      dungeonClearGoldBonus,
      hasUsedDoubleLoot,
      hasUsedFocusElixir,
      hasUsedRuneFortune,
      hasUsedCrystalClarity,
      usedEquipmentIndicesAndCharges,
      lootedItem,
      droppedTitle,
      isWildernessChecked,
      isDungeonMode,
      pauseCount,
      comboBonusPercent: Math.round(comboBoost * 100),
    });
  };

  const handleConfirmClaimRewards = (editedNotes: string, selectedTag: string) => {
    if (!rewardsModalData) return;

    const {
      skillIdx,
      xpEarned,
      goldEarned,
      durationMins,
      lootName,
      lootEmoji,
      droppedTitleName,
      droppedTitleEmoji,
      dungeonClearGoldBonus,
      hasUsedDoubleLoot,
      hasUsedFocusElixir,
      hasUsedRuneFortune,
      hasUsedCrystalClarity,
      usedEquipmentIndicesAndCharges,
      lootedItem,
      droppedTitle,
      isWildernessChecked,
      isDungeonMode,
    } = rewardsModalData;

    const activeSkillName = gameState.skills[skillIdx]?.name || 'Código Sagrado';

    // 1. If dungeon run milestones progression calculation is active
    if (isDungeonMode) {
      const nextSessions = dungeonSessions + 1;
      if (nextSessions >= 4) {
        setDungeonSessions(0);
        setIsDungeonMode(false);
        setLastDungeonClearedTime(Date.now());
        setSelectedBreakMins(gameState.longBreakMinutes || 15);
        setTimeout(() => {
          addSystemLog('🏆 EXPLORAÇÃO MASMORRA SUCESSO: Concluiu as 4 sessões heróicas consecutivas! Um bônus monumental místico de +2.500 GP foi adicionado aos teus espólios!', true);
        }, 120);
      } else {
        setDungeonSessions(nextSessions);
        setSelectedBreakMins(5);
        setTimeout(() => {
          addSystemLog(`⚔️ Masmorra Progresso: (${nextSessions}/4) focos consecutivos selados. Só mais ${4 - nextSessions} sessões para a glória eterna!`, true);
        }, 120);
      }
    }

    // 2. Update master state parameters
    setGameState(prev => {
      // 1. Update skills leveling up mechanics (with title prestige adjustments)
      const updatedSkills = prev.skills.map((sk, idx) => {
        if (idx === skillIdx) {
          const eqTitleId = prev.equippedTitle;
          let prestigeGrowth = 0.25;
          if (eqTitleId === 'DRAGONBORN') prestigeGrowth = 0.25 * 1.25;
          else if (eqTitleId === 'PANTHEON') prestigeGrowth = 0.25 * 1.30;
          else if (eqTitleId === 'THE_ETERNAL_SCHOLAR' || eqTitleId === 'ASCENDED') prestigeGrowth = 0.25 * 1.50;

          const prestigeBonus = 1 + (sk.prestige || 0) * prestigeGrowth;
          const finalXPApplied = Math.round(xpEarned * prestigeBonus);
          let updatedXP = sk.xp + finalXPApplied;
          let currentLevel = sk.level;
          let xpRequired = currentLevel * 80;
          
          while (updatedXP >= xpRequired) {
            updatedXP -= xpRequired;
            currentLevel += 1;
            xpRequired = currentLevel * 80;
            setTimeout(() => {
              addSystemLog(`🆙 SUBIU DE NÍVEL: Sua habilidade "${sk.emoji || '🎯'} ${sk.name}" atingiu o Nível ${currentLevel}!`, true);
              if (!muteSfx) sound.playLevelUp();
            }, 100);
          }
          return { ...sk, level: currentLevel, xp: updatedXP };
        }
        return sk;
      });

      // 2. Consume items spent
      const updatedInv = [...prev.inventory];
      if (hasUsedDoubleLoot) {
        const itemIdx = updatedInv.findIndex(i => i.buff === 'DoubleLoot');
        if (itemIdx >= 0) updatedInv.splice(itemIdx, 1);
      }
      if (hasUsedFocusElixir) {
        const itemIdx = updatedInv.findIndex(i => i.buff === 'FocusElixir');
        if (itemIdx >= 0) updatedInv.splice(itemIdx, 1);
      }
      if (hasUsedRuneFortune) {
        const itemIdx = updatedInv.findIndex(i => i.buff === 'RuneFortune');
        if (itemIdx >= 0) updatedInv.splice(itemIdx, 1);
      }
      if (hasUsedCrystalClarity) {
        const itemIdx = updatedInv.findIndex(i => i.buff === 'CrystalClarity');
        if (itemIdx >= 0) updatedInv.splice(itemIdx, 1);
      }

      // Decrement charges of worn equipment or remove if expired
      const updatedEquip = prev.equippedEquipment ? [...prev.equippedEquipment] : [null, null, null];
      usedEquipmentIndicesAndCharges.forEach(({ index, charges }) => {
        if (charges <= 0) {
          const item = updatedEquip[index];
          if (item) {
            setTimeout(() => {
              addSystemLog(`⚠️ O equipamento "${item.emoji} ${item.name}" gastou todas as suas cargas e quebrou!`, true);
            }, 250);
          }
          updatedEquip[index] = null;
        } else {
          const item = updatedEquip[index];
          if (item) {
            updatedEquip[index] = {
              ...item,
              charges: charges
            };
          }
        }
      });

      // Add looted item directly if any drop occurs
      if (lootedItem) {
        const randVal = Math.random();
        if (randVal < 0.40) {
          // Special equippable item drop
          const equipments = [
            {
              name: 'Coruja Pixelada',
              emoji: '🦉',
              desc: 'Equipável: +5% de XP em todas as sessões. (8 Cargas)',
              price: 250,
              buff: 'PixelOwl' as BuffType,
              isEquipment: true,
              charges: 8,
              maxCharges: 8
            },
            {
              name: 'Pena de Dragão',
              emoji: '🪶',
              desc: 'Equipável: +8% de XP em sessões de 45 min+. (8 Cargas)',
              price: 300,
              buff: 'DragonQuill' as BuffType,
              isEquipment: true,
              charges: 8,
              maxCharges: 8
            },
            {
              name: 'Bola de Cristal',
              emoji: '🔮',
              desc: 'Equipável: +10% de XP em todas as sessões. (10 Cargas)',
              price: 400,
              buff: 'CrystalBall' as BuffType,
              isEquipment: true,
              charges: 10,
              maxCharges: 10
            },
            {
              name: 'Tomo Antigo',
              emoji: '📖',
              desc: 'Equipável: +15% de XP em sessões de 60 min+. (8 Cargas)',
              price: 500,
              buff: 'AncientTome' as BuffType,
              isEquipment: true,
              charges: 8,
              maxCharges: 8
            }
          ];

          const eqDrop = equipments[Math.floor(Math.random() * equipments.length)];
          updatedInv.push({
            id: `eq_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            ...eqDrop
          });
          
          setTimeout(() => {
            addSystemLog(`✨ ESPÓLIO LENDÁRIO ENCONTRADO: Você localizou o equipamento "${eqDrop.emoji} ${eqDrop.name}"! Vá à Ficha para equipá-lo.`, true);
          }, 200);
        } else {
          // Regular loot drop
          updatedInv.push({
            id: `loot_${Date.now()}`,
            name: lootedItem.name,
            emoji: lootedItem.emoji,
            buff: 'DoubleLoot', // simple generic buff label for generic loots
            price: 50,
            desc: 'Espólio colecionável de foco heróico.'
          });
        }
      }

      // 3. Combat level progression calculations
      let combatXPApplied = prev.combatXP + Math.floor(xpEarned * 0.4);
      let currentCombatLevel = prev.combatLevel;
      let combatXPRequirement = currentCombatLevel * 100;

      while (combatXPApplied >= combatXPRequirement) {
        combatXPApplied -= combatXPRequirement;
        currentCombatLevel += 1;
        combatXPRequirement = currentCombatLevel * 100;
        setTimeout(() => {
          addSystemLog(`🏆 SUBIDA DE NÍVEL COMBATE: Seus atributos se transbordaram misticamente! Nível de Combate ${currentCombatLevel}!`, true);
          if (!muteSfx) sound.playLevelUp();
        }, 150);
      }

      // 4. Series (Streaks) & Combos sync
      const todayString = new Date().toDateString();
      let newStreak = prev.streak;
      if (prev.lastStudyDate !== todayString) {
        newStreak = prev.streak + 1;
      }
      const newBestStreak = Math.max(newStreak, prev.bestStreak);

      const historyObj = {
        id: `session_${Date.now()}_${Math.random()}`,
        skillName: activeSkillName,
        date: new Date().toLocaleString('pt-BR'),
        duration: durationMins,
        xp: xpEarned,
        gold: goldEarned,
        notes: editedNotes.trim(),
        subskillTag: selectedTag || undefined,
        wilderness: isWildernessChecked,
        aiChronicle: rewardsModalData.aiChronicleResult,
      };

      // Achievements validation check
      const unlockedAchievements = [...prev.achievements];
      const testAchievements = [
        { id: 'first_quest', targetValue: 1, current: prev.totalSessions + 1 },
        { id: 'streak_3', targetValue: 3, current: newBestStreak },
        { id: 'streak_7', targetValue: 7, current: newBestStreak },
        { id: 'xp_1000', targetValue: 1000, current: prev.totalXP + xpEarned }
      ];

      testAchievements.forEach(ach => {
        if (!unlockedAchievements.includes(ach.id) && ach.current >= ach.targetValue) {
          unlockedAchievements.push(ach.id);
          setTimeout(() => {
            addSystemLog(`🏆 CONQUISTA HERÓICA: Desbloqueada rúnica especial [${ach.id.toUpperCase()}]!`, true);
          }, 350);
        }
      });

      if (isWildernessChecked && !unlockedAchievements.includes('survive_wilderness')) {
        unlockedAchievements.push('survive_wilderness');
        setTimeout(() => {
          addSystemLog(`🏆 CONQUISTA HERÓICA: Desbloqueaste o selo [Sobrevivente da Wilderness]!`, true);
        }, 360);
      }

      const nextOwnedTitles = [...(prev.ownedTitles || [])];
      if (droppedTitle && !nextOwnedTitles.includes(droppedTitle.id)) {
        nextOwnedTitles.push(droppedTitle.id);
      }

      return {
        ...prev,
        gold: prev.gold + goldEarned,
        totalGoldEarned: prev.totalGoldEarned + goldEarned,
        totalSessions: prev.totalSessions + 1,
        totalMinutes: prev.totalMinutes + durationMins,
        combatLevel: currentCombatLevel,
        combatXP: combatXPApplied,
        skills: updatedSkills,
        inventory: updatedInv,
        equippedEquipment: updatedEquip,
        history: [historyObj, ...prev.history],
        streak: newStreak,
        bestStreak: newBestStreak,
        lastStudyDate: todayString,
        wildernessWins: prev.wildernessWins + (isWildernessChecked ? 1 : 0),
        combo: prev.combo + 1,
        todayMinutes: prev.todayMinutes + durationMins,
        todayXP: prev.todayXP + xpEarned,
        achievements: unlockedAchievements,
        ownedTitles: nextOwnedTitles,
      };
    });

    addSystemLog(`✅ Missão divina completa! Habilidade: ${activeSkillName} | +${xpEarned} XP | +${goldEarned} GP ganho.`, true);

    // Audio coins chime triggers
    if (!muteSfx) sound.playCoins();

    setSessionNotes('');
    setRewardsModalData(null);
    setIsBreakPrep(true);
  };

  // Claim Daily/Weekly Quest items
  const handleClaimQuestRewards = (goldReward: number, xpReward: number, questId: string) => {
    setGameState(prev => {
      // Apply Combat levels progression too
      let nextXP = prev.combatXP + Math.floor(xpReward * 0.4);
      let nextCombatLevel = prev.combatLevel;
      let combatXPRequirement = nextCombatLevel * 100;

      while (nextXP >= combatXPRequirement) {
        nextXP -= combatXPRequirement;
        nextCombatLevel += 1;
        combatXPRequirement = nextCombatLevel * 100;
        setTimeout(() => {
          addSystemLog(`🆙 COMBAT LEVEL UP GILD: Nível de combate militar heróico subiu para ${nextCombatLevel}!`, true);
          if (!muteSfx) sound.playLevelUp();
        }, 100);
      }

      return {
        ...prev,
        gold: prev.gold + goldReward,
        totalGoldEarned: prev.totalGoldEarned + goldReward,
        totalXP: prev.totalXP + xpReward,
        combatLevel: nextCombatLevel,
        combatXP: nextXP,
        achievements: [...prev.achievements, `claimed_${questId}`]
      };
    });

    addSystemLog(`📜 Contrato da Gilda Resgatado! Moedas +${goldReward} GP e Relíquias +${xpReward} XP depositadas nas sacolas.`, true);
  };

  // Buy item and buffs handlers
  const handleBuyGoblinShopItem = (item: InventoryItem) => {
    setGameState(prev => {
      return {
        ...prev,
        gold: prev.gold - item.price,
        inventory: [...prev.inventory, item]
      };
    });
    addSystemLog(`🎒 Comprado no Bazar: ${item.emoji} "${item.name}" por ${item.price} GP!`, true);
  };

  // --- EQUIPMENT & INVENTORY SYSTEMS HANDLERS ---
  const handleEquipItem = (item: InventoryItem, slotIdx: number) => {
    setGameState(prev => {
      const equipped = prev.equippedEquipment ? [...prev.equippedEquipment] : [null, null, null];
      const inventory = [...prev.inventory];
      
      // Remove item from inventory
      const invIdx = inventory.findIndex(i => i.id === item.id);
      if (invIdx >= 0) {
        inventory.splice(invIdx, 1);
      }
      
      // If there's already an item in that slot, return it to inventory
      const existing = equipped[slotIdx];
      if (existing) {
        inventory.push(existing);
      }
      
      // Equip the new item
      equipped[slotIdx] = { ...item };
      
      return {
        ...prev,
        inventory,
        equippedEquipment: equipped
      };
    });
    
    addSystemLog(`⚔️ EQUIPADO: "${item.emoji} ${item.name}" foi colocado no Espaço de Equipamento ${slotIdx + 1}!`, true);
    if (!muteSfx) sound.playCoins();
  };

  const handleUnequipItem = (slotIdx: number) => {
    setGameState(prev => {
      const equipped = prev.equippedEquipment ? [...prev.equippedEquipment] : [null, null, null];
      const inventory = [...prev.inventory];
      
      const item = equipped[slotIdx];
      if (!item) return prev;
      
      equipped[slotIdx] = null;
      inventory.push(item);
      
      return {
        ...prev,
        inventory,
        equippedEquipment: equipped
      };
    });
    
    addSystemLog('⚔️ DESEQUIPADO: Item retornado para a mochila.', false);
  };

  const handleSellItem = (item: InventoryItem) => {
    // Standard sale: 50% of buying price if equipment, 50 GP if drop
    const sellingPrice = item.isEquipment ? Math.floor(item.price * 0.5) : 50;
    
    setGameState(prev => {
      const inventory = prev.inventory.filter(i => i.id !== item.id);
      return {
        ...prev,
        gold: prev.gold + sellingPrice,
        inventory
      };
    });
    
    addSystemLog(`💰 VENDIDO: Você vendeu "${item.emoji} ${item.name}" por ${sellingPrice} GP!`, true);
    if (!muteSfx) sound.playCoins();
  };

  const handleDiscardItem = (item: InventoryItem) => {
    setGameState(prev => {
      const inventory = prev.inventory.filter(i => i.id !== item.id);
      return {
        ...prev,
        inventory
      };
    });
    addSystemLog(`🎒 DESCARTADO: Você descartou o item "${item.emoji} ${item.name}".`, false);
  };

  const handleDismissLevelUp = () => {
    setLevelUpQueue(prev => prev.slice(1));
  };

  // --- HONORARY TITLES SYSTEMS TRIVIA HANDLERS ---
  const handleEquipTitle = (titleId: string | null) => {
    setGameState(prev => {
      return {
        ...prev,
        equippedTitle: titleId
      };
    });
    if (titleId) {
      addSystemLog(`👑 TÍTULO EQUIPADO: Agora você ostenta o título de [${titleId}]! Seus buffs de passivos agora estão ativos.`, true);
      if (!muteSfx) sound.playCoins();
    } else {
      addSystemLog('👑 TÍTULO REVEZADO: Você desequipou seu título honorário.', false);
    }
  };

  const handleBuyTitle = (titleId: string, price: number) => {
    setGameState(prev => {
      if (prev.gold < price) return prev;
      const nextOwned = [...(prev.ownedTitles || [])];
      if (!nextOwned.includes(titleId)) {
        nextOwned.push(titleId);
      }
      return {
        ...prev,
        gold: prev.gold - price,
        ownedTitles: nextOwned
      };
    });
    addSystemLog(`👑 TÍTULO ADQUIRIDO: Você obteve o brasão honorário de [${titleId}] por ${price} GP!`, true);
    if (!muteSfx) sound.playCoins();
  };

  const handleClaimAchievementTitle = (titleId: string) => {
    setGameState(prev => {
      const nextOwned = [...(prev.ownedTitles || [])];
      if (!nextOwned.includes(titleId)) {
        nextOwned.push(titleId);
      }
      return {
        ...prev,
        ownedTitles: nextOwned
      };
    });
    addSystemLog(`🏆 RESGATE DE SUPREMACIA: Você resgatou e desbloqueou com sucesso o título de Conquista [${titleId}]!`, true);
    if (!muteSfx) sound.playLevelUp();
  };

  // --- HABITICA INTEGRATION TASK ACTIONS ---
  const getDifficultyRewards = (difficulty: 'Trivial' | 'Easy' | 'Medium' | 'Hard') => {
    switch (difficulty) {
      case 'Trivial':
        return { xp: 4, gold: 2, damage: 1 };
      case 'Easy':
        return { xp: 12, gold: 6, damage: 3 };
      case 'Medium':
        return { xp: 28, gold: 14, damage: 7 };
      case 'Hard':
        return { xp: 60, gold: 25, damage: 15 };
      default:
        return { xp: 12, gold: 6, damage: 3 };
    }
  };

  const handleTriggerHabit = (habitId: string, isUp: boolean) => {
    const habit = gameState.habits.find(h => h.id === habitId);
    if (!habit) return;

    const { xp, gold, damage } = getDifficultyRewards(habit.difficulty);

    if (isUp) {
      setGameState(prev => {
        let mulXP = 1.0;
        let mulGold = 1.0;
        if (prev.charClass === 'Mage') mulXP += 0.2;
        if (prev.charClass === 'Warrior') mulGold += 0.2;

        const finalGold = Math.floor(gold * mulGold);
        const finalXP = Math.floor(xp * mulXP);

        let combatXPApplied = prev.combatXP + finalXP;
        let currentCombatLevel = prev.combatLevel;
        let requirement = currentCombatLevel * 100;
        let didLevelUp = false;

        while (combatXPApplied >= requirement) {
          combatXPApplied -= requirement;
          currentCombatLevel += 1;
          requirement = currentCombatLevel * 100;
          didLevelUp = true;
        }

        const nextHp = didLevelUp ? prev.maxHp : prev.hp;

        if (didLevelUp) {
          setTimeout(() => {
            addSystemLog(`🆙 COMBAT LEVEL UP: Nível de combate militar subiu para ${currentCombatLevel}! Vitalidade restaurada!`, true);
            if (!muteSfx) sound.playLevelUp();
          }, 100);
        }

        const updatedHabits = prev.habits.map(h => {
          if (h.id === habitId) {
            return { ...h, upCount: h.upCount + 1, streak: h.streak + 1, lastTriggeredDate: new Date().toDateString() };
          }
          return h;
        });

        return {
          ...prev,
          gold: prev.gold + finalGold,
          totalGoldEarned: prev.totalGoldEarned + finalGold,
          totalXP: prev.totalXP + finalXP,
          combatLevel: currentCombatLevel,
          combatXP: combatXPApplied,
          hp: nextHp,
          habits: updatedHabits
        };
      });

      if (!muteSfx) sound.playCoins();
      addSystemLog(`✨ Prática Virtuosa: Completou o hábito positivo "${habit.title}"! Ganhou +${gold} GP e +${xp} XP.`, true);
    } else {
      setGameState(prev => {
        let finalDamage = damage;
        if (prev.charClass === 'Ranger') finalDamage = Math.max(1, Math.floor(damage * 0.7));

        const nextHp = Math.max(0, prev.hp - finalDamage);
        const didDie = nextHp === 0;

        if (didDie) {
          setTimeout(() => {
            setIsPlayerDead(true);
            if (!muteSfx) sound.playDeath();
          }, 100);
        }

        const updatedHabits = prev.habits.map(h => {
          if (h.id === habitId) {
            return { ...h, downCount: h.downCount + 1, streak: Math.max(0, h.streak - 1), lastTriggeredDate: new Date().toDateString() };
          }
          return h;
        });

        return {
          ...prev,
          hp: nextHp,
          habits: updatedHabits
        };
      });

      if (!muteSfx) {
        try {
          sound.playWildernessWarning();
        } catch {}
      }
      addSystemLog(`⚠️ Desvio Espiritual: Sofreu dano pelo hábito negativo "${habit.title}"! Perdeu -${damage} HP de sua integridade.`, false);
    }
  };

  const handleAddHabit = (newHabit: Omit<Habit, 'id' | 'upCount' | 'downCount' | 'streak'>) => {
    setGameState(prev => {
      const added: Habit = {
        ...newHabit,
        id: `h-${Date.now()}`,
        upCount: 0,
        downCount: 0,
        streak: 0,
      };
      return {
        ...prev,
        habits: [...prev.habits, added]
      };
    });
    addSystemLog(`🔥 Runas Consagradas: Novo hábito "${newHabit.title}" adicionado à sua capela diária!`);
  };

  const handleEditHabit = (edited: Habit) => {
    setGameState(prev => ({
      ...prev,
      habits: prev.habits.map(h => h.id === edited.id ? edited : h)
    }));
    addSystemLog(`⚙️ Runas Alteradas: Hábito "${edited.title}" atualizado.`);
  };

  const handleDeleteHabit = (habitId: string) => {
    setGameState(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== habitId)
    }));
    addSystemLog(`🗑️ Runas Banidas: Hábito removido com sucesso.`);
  };

  const handleToggleDaily = (dailyId: string) => {
    const daily = gameState.dailies.find(d => d.id === dailyId);
    if (!daily) return;

    const isCompleting = !daily.completed;
    const { xp, gold } = getDifficultyRewards(daily.difficulty);

    setGameState(prev => {
      let finalGold = gold;
      let finalXP = xp;
      let updatedDailies = prev.dailies;

      if (isCompleting) {
        let mulXP = 1.0;
        let mulGold = 1.0;
        if (prev.charClass === 'Mage') mulXP += 0.2;
        if (prev.charClass === 'Warrior') mulGold += 0.2;

        finalGold = Math.floor(gold * mulGold);
        finalXP = Math.floor(xp * mulXP);

        updatedDailies = prev.dailies.map(d => {
          if (d.id === dailyId) {
            return { ...d, completed: true, streak: d.streak + 1 };
          }
          return d;
        });

        let combatXPApplied = prev.combatXP + finalXP;
        let currentCombatLevel = prev.combatLevel;
        let requirement = currentCombatLevel * 100;
        let didLevelUp = false;

        while (combatXPApplied >= requirement) {
          combatXPApplied -= requirement;
          currentCombatLevel += 1;
          requirement = currentCombatLevel * 100;
          didLevelUp = true;
        }

        const nextHp = didLevelUp ? prev.maxHp : prev.hp;

        if (didLevelUp) {
          setTimeout(() => {
            addSystemLog(`🆙 COMBAT LEVEL UP: Nível de combate heróico subiu para ${currentCombatLevel}! HP restaurado!`, true);
            if (!muteSfx) sound.playLevelUp();
          }, 100);
        }

        setTimeout(() => {
          addSystemLog(`📅 Voto Diário Cumprido: Concluiu "${daily.title}"! (+${finalGold} GP, +${finalXP} XP, Streak: ${daily.streak + 1} dias)`, true);
          if (!muteSfx) sound.playCoins();
        }, 10);

        return {
          ...prev,
          gold: prev.gold + finalGold,
          totalGoldEarned: prev.totalGoldEarned + finalGold,
          totalXP: prev.totalXP + finalXP,
          combatLevel: currentCombatLevel,
          combatXP: combatXPApplied,
          hp: nextHp,
          dailies: updatedDailies
        };
      } else {
        let mulXP = 1.0;
        let mulGold = 1.0;
        if (prev.charClass === 'Mage') mulXP += 0.2;
        if (prev.charClass === 'Warrior') mulGold += 0.2;

        finalGold = Math.floor(gold * mulGold);
        finalXP = Math.floor(xp * mulXP);

        updatedDailies = prev.dailies.map(d => {
          if (d.id === dailyId) {
            return { ...d, completed: false, streak: Math.max(0, d.streak - 1) };
          }
          return d;
        });

        let combatXPApplied = prev.combatXP - finalXP;
        let currentCombatLevel = prev.combatLevel;

        while (combatXPApplied < 0 && currentCombatLevel > 1) {
          currentCombatLevel -= 1;
          const requirement = currentCombatLevel * 100;
          combatXPApplied += requirement;
        }
        if (combatXPApplied < 0) combatXPApplied = 0;

        setTimeout(() => {
          addSystemLog(`↩️ Reversão de Voto: Diária "${daily.title}" desmarcada. Perdidos -${finalGold} GP e -${finalXP} XP.`);
        }, 10);

        return {
          ...prev,
          gold: Math.max(0, prev.gold - finalGold),
          totalGoldEarned: Math.max(0, prev.totalGoldEarned - finalGold),
          totalXP: Math.max(0, prev.totalXP - finalXP),
          combatLevel: currentCombatLevel,
          combatXP: combatXPApplied,
          dailies: updatedDailies
        };
      }
    });
  };

  const handleToggleDailyChecklistItem = (dailyId: string, itemId: string) => {
    setGameState(prev => {
      const updatedDailies = prev.dailies.map(d => {
        if (d.id === dailyId) {
          const updatedChecklist = d.checklist.map(item => {
            if (item.id === itemId) {
              return { ...item, completed: !item.completed };
            }
            return item;
          });
          return { ...d, checklist: updatedChecklist };
        }
        return d;
      });
      return {
        ...prev,
        dailies: updatedDailies
      };
    });
  };

  const handleAddDaily = (newDaily: Omit<Daily, 'id' | 'completed' | 'checklist'> & { checklist: string[] }) => {
    setGameState(prev => {
      const formattedChecklist = newDaily.checklist.map((text, idx) => ({
        id: `dc-${Date.now()}-${idx}`,
        text,
        completed: false
      }));

      const added: Daily = {
        id: `d-${Date.now()}`,
        title: newDaily.title,
        notes: newDaily.notes,
        difficulty: newDaily.difficulty,
        completed: false,
        streak: newDaily.streak,
        repeats: newDaily.repeats,
        every: newDaily.every,
        tags: newDaily.tags,
        checklist: formattedChecklist,
      };

      return {
        ...prev,
        dailies: [...prev.dailies, added]
      };
    });
    addSystemLog(`📅 Novo Voto de Diária Consagrado: "${newDaily.title}"!`);
  };

  const handleEditDaily = (edited: Daily) => {
    setGameState(prev => ({
      ...prev,
      dailies: prev.dailies.map(d => d.id === edited.id ? edited : d)
    }));
    addSystemLog(`⚙️ Diária Modificada: "${edited.title}" atualizada.`);
  };

  const handleDeleteDaily = (dailyId: string) => {
    setGameState(prev => ({
      ...prev,
      dailies: prev.dailies.filter(d => d.id !== dailyId)
    }));
    addSystemLog(`🗑️ Voto de Diária Aniquilado.`);
  };

  const handleToggleTodo = (todoId: string) => {
    const todo = gameState.todos.find(t => t.id === todoId);
    if (!todo) return;

    const isCompleting = !todo.completed;
    const { xp, gold } = getDifficultyRewards(todo.difficulty);

    setGameState(prev => {
      let finalGold = gold;
      let finalXP = xp;
      let updatedTodos = prev.todos;

      if (isCompleting) {
        let mulXP = 1.0;
        let mulGold = 1.0;
        if (prev.charClass === 'Mage') mulXP += 0.2;
        if (prev.charClass === 'Warrior') mulGold += 0.2;

        finalGold = Math.floor(gold * mulGold);
        finalXP = Math.floor(xp * mulXP);

        updatedTodos = prev.todos.map(t => {
          if (t.id === todoId) {
            return { ...t, completed: true };
          }
          return t;
        });

        let combatXPApplied = prev.combatXP + finalXP;
        let currentCombatLevel = prev.combatLevel;
        let requirement = currentCombatLevel * 100;
        let didLevelUp = false;

        while (combatXPApplied >= requirement) {
          combatXPApplied -= requirement;
          currentCombatLevel += 1;
          requirement = currentCombatLevel * 100;
          didLevelUp = true;
        }

        const nextHp = didLevelUp ? prev.maxHp : prev.hp;

        if (didLevelUp) {
          setTimeout(() => {
            addSystemLog(`🆙 COMBAT LEVEL UP: Nível de combate heróico subiu para ${currentCombatLevel}! HP restaurado!`, true);
            if (!muteSfx) sound.playLevelUp();
          }, 100);
        }

        setTimeout(() => {
          addSystemLog(`✔️ Afazer Cumprido: Concluiu aventura "${todo.title}"! (+${finalGold} GP, +${finalXP} XP!)`, true);
          if (!muteSfx) sound.playCoins();
        }, 10);

        return {
          ...prev,
          gold: prev.gold + finalGold,
          totalGoldEarned: prev.totalGoldEarned + finalGold,
          totalXP: prev.totalXP + finalXP,
          combatLevel: currentCombatLevel,
          combatXP: combatXPApplied,
          hp: nextHp,
          todos: updatedTodos
        };
      } else {
        let mulXP = 1.0;
        let mulGold = 1.0;
        if (prev.charClass === 'Mage') mulXP += 0.2;
        if (prev.charClass === 'Warrior') mulGold += 0.2;

        finalGold = Math.floor(gold * mulGold);
        finalXP = Math.floor(xp * mulXP);

        updatedTodos = prev.todos.map(t => {
          if (t.id === todoId) {
            return { ...t, completed: false };
          }
          return t;
        });

        let combatXPApplied = prev.combatXP - finalXP;
        let currentCombatLevel = prev.combatLevel;

        while (combatXPApplied < 0 && currentCombatLevel > 1) {
          currentCombatLevel -= 1;
          const requirement = currentCombatLevel * 100;
          combatXPApplied += requirement;
        }
        if (combatXPApplied < 0) combatXPApplied = 0;

        setTimeout(() => {
          addSystemLog(`↩️ Reversão de Contrato: Afazer "${todo.title}" reaberto. Perdidos -${finalGold} GP e -${finalXP} XP.`);
        }, 10);

        return {
          ...prev,
          gold: Math.max(0, prev.gold - finalGold),
          totalGoldEarned: Math.max(0, prev.totalGoldEarned - finalGold),
          totalXP: Math.max(0, prev.totalXP - finalXP),
          combatLevel: currentCombatLevel,
          combatXP: combatXPApplied,
          todos: updatedTodos
        };
      }
    });
  };

  const handleToggleTodoChecklistItem = (todoId: string, itemId: string) => {
    setGameState(prev => {
      const updatedTodos = prev.todos.map(t => {
        if (t.id === todoId) {
          const updatedChecklist = t.checklist.map(item => {
            if (item.id === itemId) {
              return { ...item, completed: !item.completed };
            }
            return item;
          });
          return { ...t, checklist: updatedChecklist };
        }
        return t;
      });
      return {
        ...prev,
        todos: updatedTodos
      };
    });
  };

  const handleAddTodo = (newTodo: Omit<Todo, 'id' | 'completed' | 'checklist'> & { checklist: string[] }) => {
    setGameState(prev => {
      const formattedChecklist = newTodo.checklist.map((text, idx) => ({
        id: `tc-${Date.now()}-${idx}`,
        text,
        completed: false
      }));

      const added: Todo = {
        id: `t-${Date.now()}`,
        title: newTodo.title,
        notes: newTodo.notes,
        difficulty: newTodo.difficulty,
        completed: false,
        tags: newTodo.tags,
        checklist: formattedChecklist,
      };

      return {
        ...prev,
        todos: [...prev.todos, added]
      };
    });
    addSystemLog(`📜 Novo Contrato / Afazer em mãos: "${newTodo.title}"!`);
  };

  const handleEditTodo = (edited: Todo) => {
    setGameState(prev => ({
      ...prev,
      todos: prev.todos.map(t => t.id === edited.id ? edited : t)
    }));
    addSystemLog(`⚙️ Afazer Editado: "${edited.title}" atualizado.`);
  };

  const handleDeleteTodo = (todoId: string) => {
    setGameState(prev => ({
      ...prev,
      todos: prev.todos.filter(t => t.id !== todoId)
    }));
    addSystemLog(`🗑️ Contrato de Afazer Destruído.`);
  };

  // Character modifications handlers
  const handleApplyCharacterSetupChanges = (name: string, characterClass: 'Mage' | 'Warrior' | 'Ranger') => {
    const longBreakInput = document.getElementById('long-break-fld') as HTMLInputElement;
    let longBreakMins = longBreakInput ? parseInt(longBreakInput.value, 10) : (gameState.longBreakMinutes || 15);
    if (isNaN(longBreakMins) || longBreakMins < 1) longBreakMins = 15;
    if (longBreakMins > 120) longBreakMins = 120;

    setGameState(prev => ({
      ...prev,
      charName: name.trim().length > 0 ? name.trim() : prev.charName,
      charClass: characterClass,
      longBreakMinutes: longBreakMins
    }));

    addSystemLog(`⚙️ Assinatura do herói guardada nas runas templárias: [${name}] como [${characterClass}] | Descanso Longo: ${longBreakMins} min!`);
    setIsSettingsOpen(false);
  };

  // Skills Manager actions
  const handleAddCustomSkillWithEmoji = (nameInput: string, emojiInput: string) => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    if (gameState.skills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      addSystemLog('❌ Erro: Alguma de suas Habilidades já possui este nome exato.');
      return;
    }

    setGameState(prev => {
      const addedSkill: Skill = { name: trimmed, level: 1, xp: 0, emoji: emojiInput, prestige: 0 };
      return {
        ...prev,
        skills: [...prev.skills, addedSkill]
      };
    });

    addSystemLog(`${emojiInput} Nova habilidade de foco incorporada: "${trimmed}"`, true);
  };

  const handleAddTagToSkill = (skillIdx: number, newTag: string) => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    setGameState(prev => {
      const copySk = [...prev.skills];
      const sk = copySk[skillIdx];
      if (sk) {
        const currentTags = sk.tags || [];
        if (currentTags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
          return prev; // already exists
        }
        copySk[skillIdx] = {
          ...sk,
          tags: [...currentTags, trimmed]
        };
      }
      return { ...prev, skills: copySk };
    });
    addSystemLog(`🏷️ Subskill "${trimmed}" adicionada com sucesso!`);
  };

  const handleRemoveTagFromSkill = (skillIdx: number, tagIdx: number) => {
    const skillName = gameState.skills[skillIdx]?.name;
    const tagName = gameState.skills[skillIdx]?.tags?.[tagIdx];
    setGameState(prev => {
      const copySk = [...prev.skills];
      const sk = copySk[skillIdx];
      if (sk && sk.tags) {
        const newTags = [...sk.tags];
        newTags.splice(tagIdx, 1);
        copySk[skillIdx] = {
          ...sk,
          tags: newTags
        };
      }
      return { ...prev, skills: copySk };
    });
    if (tagName) addSystemLog(`🗑️ Subskill "${tagName}" removida de "${skillName}".`);
  };

  const handleRenameSkill = (idx: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      addSystemLog('❌ Erro: O nome da habilidade não pode estar em branco.');
      return;
    }
    if (gameState.skills.some((s, sIdx) => sIdx !== idx && s.name.toLowerCase() === trimmed.toLowerCase())) {
      addSystemLog('❌ Erro: Outra habilidade de seu grimório já possui este nome exato.');
      return;
    }
    setGameState(prev => {
      const copySk = [...prev.skills];
      if (copySk[idx]) {
        copySk[idx] = { ...copySk[idx], name: trimmed };
      }
      return { ...prev, skills: copySk };
    });
    addSystemLog(`✍️ Habilidade renomeada para "${trimmed}" com sucesso!`);
  };

  const handleAddCustomSkillRegister = () => {
    handleAddCustomSkillWithEmoji(newSkillNameInput, selectedNewSkillEmoji);
    setNewSkillNameInput('');
  };

  const handleQuickAddSkill = (name: string, emoji: string) => {
    handleAddCustomSkillWithEmoji(name, emoji);
  };

  const handleDeleteSkillIndex = (idx: number) => {
    if (gameState.skills.length <= 1) {
      setCustomDialog({
        isOpen: true,
        title: 'Falta de Habilidades',
        message: 'Seu personagem precisa ter pelo menos uma habilidade ativa remanescente!',
        isConfirm: false,
        onConfirm: () => setCustomDialog(null)
      });
      return;
    }

    const removedName = gameState.skills[idx]?.name;
    const removedEmoji = gameState.skills[idx]?.emoji || '🎯';
    setCustomDialog({
      isOpen: true,
      title: 'Esquecer Habilidade?',
      message: `Tem certeza que deseja esquecer a habilidade "${removedEmoji} ${removedName}"? Todo o seu aprendizado e XP acumulados nela se perderão permanentemente.`,
      isConfirm: true,
      onConfirm: () => {
        setCustomDialog(null);
        setGameState(prev => {
          const copySk = [...prev.skills];
          copySk.splice(idx, 1);
          return {
            ...prev,
            skills: copySk
          };
        });

        setSelectedSkillIdx(0);
        addSystemLog(`🗑️ Esqueceu a Habilidade: "${removedEmoji} ${removedName}"`);
      }
    });
  };

  const handlePrestigeSkill = (idx: number) => {
    const sk = gameState.skills[idx];
    if (!sk) return;
    if (sk.level < 99) {
      addSystemLog(`⏳ Requisito Insuficiente: A habilidade "${sk.emoji || '🎯'} ${sk.name}" precisa alcançar o Nível 99 para obter Prestígio.`);
      return;
    }

    setCustomDialog({
      isOpen: true,
      title: '👑 Prestígio Transcendental',
      message: `Deseja reiniciar a habilidade "${sk.emoji || '🎯'} ${sk.name}"? Seu Nível voltará para 1 e o XP para 0. Em troca, ela receberá um multiplicador permanente de +25% de XP e um marcador visual exclusivo.`,
      isConfirm: true,
      onConfirm: () => {
        setCustomDialog(null);
        setGameState(prev => {
          const copySk = [...prev.skills];
          const currentPrestige = copySk[idx].prestige || 0;
          copySk[idx] = {
            ...copySk[idx],
            level: 1,
            xp: 0,
            prestige: currentPrestige + 1
          };
          return {
            ...prev,
            skills: copySk
          };
        });

        addSystemLog(`👑 PRESTÍGIO ALCANÇADO: Sua habilidade "${sk.emoji || '🎯'} ${sk.name}" alcançou o Prestígio Nível ${(sk.prestige || 0) + 1}! Bônus de XP definitivo ativo para esta habilidade!`, true);
        if (!muteSfx) sound.playLevelUp();
      }
    });
  };

  // Restart campaign entirely
  const handleSanctizeCampaignData = () => {
    setCustomDialog({
      isOpen: true,
      title: '🚨 Purgação Total',
      message: 'Deseja redefinir TODA a sua jornada heróica? Seus níveis, históricos, ouros e conquistas se converterão permanentemente em poeira.',
      isConfirm: true,
      onConfirm: () => {
        setCustomDialog({
          isOpen: true,
          title: '⚠️ Tem certeza ABSOLUTA?',
          message: 'Esta ação desafia as leis de reversão rúnica e não poderá ser desfeita.',
          isConfirm: true,
          onConfirm: () => {
            setCustomDialog(null);
            isImportingRef.current = true;
            resetGameState();
            setSelectedSkillIdx(0);
            setIsWildernessChecked(false);
            setSessionNotes('');
            setTimeLeft(25 * 60);
            setTimerDuration(25 * 60);
            setIsRunning(false);
            setIsPaused(false);
            setIsSettingsOpen(false);
            addSystemLog('🌀 Linha do tempo purgada. Sua jornada reinicia do anonimato.', true);
          }
        });
      }
    });
  };

  // Export campaign JSON file
  const handleExportCampaignJSON = () => {
    try {
      const dataStr = JSON.stringify(gameState, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `herolog_save_${gameState.charName || 'aventureiro'}_${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      addSystemLog('💾 Progresso de campanha exportado com sucesso para um arquivo JSON!', true);
    } catch (err) {
      addSystemLog('❌ Erro desastroso ao exportar os dados da campanha.', true);
    }
  };

  // Import campaign JSON file
  const handleImportCampaignJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object' &&
            typeof parsed.charClass === 'string' && typeof parsed.gold === 'number') {
          isImportingRef.current = true;
          const restoredState = importGameState(parsed);
          setIsSettingsOpen(false);
          
          setCustomDialog({
            isOpen: true,
            title: '📜 Gravação Restaurada!',
            message: `Os pergaminhos lendários de ${restoredState.charName || 'Aventureiro'} foram aplicados às runas com sucesso!`,
            isConfirm: false,
            onConfirm: () => setCustomDialog(null)
          });
          addSystemLog(`🔮 Portal Cósmico: Conexão bem-sucedida! Registro do aventureiro ${restoredState.charName} foi importado com sucesso.`, true);
        } else {
          throw new Error('Conteúdo inválido');
        }
      } catch (err) {
        setCustomDialog({
          isOpen: true,
          title: '⚠️ Runas Corrompidas',
          message: 'O arquivo transmitido não pôde ser decifrado pelo Santuário. Certifique-se de carregar um arquivo JSON de gravação legítimo do HeroLog.',
          isConfirm: false,
          onConfirm: () => setCustomDialog(null)
        });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input element
  };

  // Copy save string to clipboard
  const handleCopySaveToClipboard = () => {
    try {
      const dataStr = JSON.stringify(gameState);
      navigator.clipboard.writeText(dataStr).then(() => {
        setCustomDialog({
          isOpen: true,
          title: '📋 Código Copiado!',
          message: 'Seu código de progresso foi copiado para a área de transferência! Cole-o em um bloco de notas ou envie para você mesmo para guardar seu progresso.',
          isConfirm: false,
          onConfirm: () => setCustomDialog(null)
        });
        addSystemLog('📋 Progresso de campanha copiado para a área de transferência!', true);
      }).catch(() => {
        // Fallback for browsers/WebViews that block clipboard context
        const fallbackTextarea = document.createElement('textarea');
        fallbackTextarea.value = dataStr;
        document.body.appendChild(fallbackTextarea);
        fallbackTextarea.select();
        document.execCommand('copy');
        document.body.removeChild(fallbackTextarea);
        
        setCustomDialog({
          isOpen: true,
          title: '📋 Código Copiado (Aparelho Antigo)!',
          message: 'Seu código de progresso foi copiado para a área de transferência! Cole-o para guardar sua jornada.',
          isConfirm: false,
          onConfirm: () => setCustomDialog(null)
        });
      });
    } catch (err) {
      addSystemLog('❌ Erro ao copiar progresso para a área de transferência.', true);
    }
  };

  // Import save from pasted string
  const handleImportSaveFromText = (saveText: string) => {
    if (!saveText || !saveText.trim()) return;
    try {
      const parsed = JSON.parse(saveText.trim());
      if (parsed && typeof parsed === 'object' &&
          typeof parsed.charClass === 'string' && typeof parsed.gold === 'number') {
        isImportingRef.current = true;
        const restoredState = importGameState(parsed);
        setIsSettingsOpen(false);
        
        setCustomDialog({
          isOpen: true,
          title: '📜 Gravação Restaurada!',
          message: `Os pergaminhos lendários de ${restoredState.charName || 'Aventureiro'} foram aplicados às runas com sucesso!`,
          isConfirm: false,
          onConfirm: () => setCustomDialog(null)
        });
        addSystemLog(`🔮 Código Rúnico: Registro do aventureiro ${restoredState.charName} foi importado com sucesso.`, true);
      } else {
        throw new Error('Conteúdo inválido');
      }
    } catch (err) {
      setCustomDialog({
        isOpen: true,
        title: '⚠️ Runas Corrompidas',
        message: 'O texto inserido não pôde ser decifrado pelo Santuário. Certifique-se de colar o código de progresso completo e sem alterações.',
        isConfirm: false,
        onConfirm: () => setCustomDialog(null)
      });
    }
  };

  return (
    <div className="min-h-screen bg-quest-deep text-amber-100 font-sans flex flex-col antialiased relative overflow-x-hidden select-none">
      
      {/* Background celestial particles reflection effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/20 via-transparent to-transparent pointer-events-none" />

      {/* HEADER BAR */}
      <header className="sticky top-0 bg-quest-panel/95 border-b-2 border-amber-500/20 px-4 py-3 flex justify-between items-center z-40 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="text-amber-400 hover:text-amber-200 p-1 mr-1.5 lg:hidden cursor-pointer flex items-center justify-center rounded bg-stone-950/25 border border-amber-500/10"
            title="Menu místico"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="text-xl md:text-2xl animate-spin" style={{ animationDuration: '8s' }}>⚔️</span>
          <div>
            <h1 className="font-serif font-black text-amber-400 text-sm md:text-base tracking-widest uppercase">
              HeroLog
            </h1>
            <p className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono hidden md:block">
              RPG Pomodoro Gamificado
            </p>
          </div>
        </div>

        {/* Global indicators pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-stone-900/60 border border-amber-500/15 py-1 px-2.5 rounded text-xs text-amber-400 font-mono font-bold font-serif shadow-inner">
            <Coins className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>{gameState.gold} GP</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-stone-900/60 border border-amber-500/15 py-1 px-2.5 rounded text-xs text-amber-300/80 font-serif shadow-inner">
            <span>{getClockPhase()}</span>
          </div>

          <button
            onClick={() => setMuteSfx(!muteSfx)}
            className="w-8 h-8 rounded bg-stone-950/40 border border-amber-500/10 text-amber-200/60 hover:text-amber-400 hover:border-amber-400 transition-all flex items-center justify-center cursor-pointer"
          >
            {muteSfx ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 rounded bg-stone-950/40 border border-amber-500/10 text-amber-200/60 hover:text-amber-400 hover:border-amber-400 transition-all flex items-center justify-center cursor-pointer"
            title="Ajustes de Campanha"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* PHILOSOPHICAL BANNER */}
      <div className="bg-gradient-to-r from-quest-card via-stone-950/40 to-quest-card border-b border-amber-500/5 py-2 px-4 text-center text-[11px] md:text-xs text-amber-100/50 italic leading-relaxed font-serif tracking-wide">
        {quoteOfTheDay[0]} <span className="text-amber-400/80 font-mono text-[10px] uppercase font-bold tracking-widest scale-90 inline-block ml-1">{quoteOfTheDay[1]}</span>
      </div>

      {/* PRIMARY TWO-COLUMN INTEGRATED GRID */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        
        {/* LEFT SIDEBAR - NAVIGATION CABINET */}
        <aside
          className={`bg-quest-panel/95 border border-amber-500/15 rounded-lg py-4 px-3 shadow-[0_12px_45px_rgba(0,0,0,0.65)] relative z-30 transition-all duration-200 lg:col-span-3 lg:translate-x-0 lg:static lg:w-auto lg:h-auto ${
            isMobileSidebarOpen 
              ? 'fixed inset-y-0 left-0 w-64 translate-x-0 z-50 bg-stone-950/98 border-r border-amber-500/30 flex flex-col justify-between' 
              : 'hidden lg:flex lg:flex-col lg:justify-between'
          }`}
        >
          <div className="space-y-5">
            {/* Sidebar header (visible in mobile slide-out) */}
            <div className="flex items-center justify-between border-b border-amber-500/15 pb-2.5 lg:hidden px-1.5">
              <span className="font-serif font-black text-amber-400 text-xs uppercase tracking-widest flex items-center gap-1.5">
                ⚔️ Navegação Mística
              </span>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="text-amber-100/60 hover:text-rose-400 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav Groups */}
            <div className="space-y-4">
              {/* Group 1: Jornada de Foco */}
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold text-amber-500/50 px-2 font-mono tracking-widest">⚔️ Jornada do Foco</p>
                <button
                  onClick={() => { setActiveTab('focus'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'focus' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-200 hover:bg-stone-900/10'
                  }`}
                >
                  <Timer className="w-4 h-4 text-amber-500/70" />
                  TROMPETA (POMODORO)
                </button>
              </div>

              {/* Group 2: Disciplina Diária (Habitica) */}
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold text-amber-500/50 px-2 font-mono tracking-widest">⚡ Disciplina Diária</p>
                <button
                  onClick={() => { setActiveTab('habits'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'habits' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-200 hover:bg-stone-900/10'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400/80" />
                  Capela de Hábitos
                </button>
                <button
                  onClick={() => { setActiveTab('dailies'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'dailies' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-200 hover:bg-stone-900/10'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-sky-400/80" />
                  TAREFAS DIÁRIAS
                </button>
                <button
                  onClick={() => { setActiveTab('todos'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'todos' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-200 hover:bg-stone-900/10'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400/80" />
                  TO DO LIST
                </button>
              </div>

              {/* Group 3: Bazar & Guilda */}
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold text-amber-500/50 px-2 font-mono tracking-widest">🛒 Recompensas</p>
                <button
                  onClick={() => { setActiveTab('shop'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'shop' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-200 hover:bg-stone-900/10'
                  }`}
                >
                  <Coins className="w-4 h-4 text-amber-400/80" />
                  Bazar de Mystara (Loja)
                </button>
                <button
                  onClick={() => { setActiveTab('titles'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'titles' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-200 hover:bg-stone-900/10'
                  }`}
                >
                  <Award className="w-4 h-4 text-rose-400/80" />
                  Brasões & Títulos
                </button>
                <button
                  onClick={() => { setActiveTab('quests'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'quests' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-200 hover:bg-stone-900/10'
                  }`}
                >
                  <Layers className="w-4 h-4 text-purple-400/80" />
                  Contratos da Gilda
                </button>
              </div>

              {/* Group 4: Registros Rúnicos */}
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold text-amber-500/50 px-2 font-mono tracking-widest">📖 Arquivos Crônicos</p>
                <button
                  onClick={() => { setActiveTab('history'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'history' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-200 hover:bg-stone-900/10'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-yellow-600/70" />
                  Crônicas Diárias
                </button>
                <button
                  onClick={() => { setActiveTab('heatmap'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'heatmap' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-200 hover:bg-stone-900/10'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-500/50" />
                  Heatmap
                </button>
                <button
                  onClick={() => { setActiveTab('stats'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'stats' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-200 hover:bg-stone-900/10'
                  }`}
                >
                  <Shield className="w-4 h-4 text-emerald-550/60" />
                  Ficha Corporal
                </button>
                <button
                  onClick={() => { setActiveTab('achievements'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'achievements' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-200 hover:bg-stone-900/10'
                  }`}
                >
                  <Award className="w-4 h-4 text-rose-500/50" />
                  Feitos de Alma
                </button>
                <button
                  onClick={() => { setActiveTab('guide'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'guide' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-200 hover:bg-stone-900/10'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-amber-400/40" />
                  Tutorial
                </button>
              </div>
            </div>
          </div>

          {/* Quick stats series footer inside sidebar */}
          <div className="border-t border-amber-500/10 pt-3 mt-4 space-y-1.5 px-1 font-mono text-[9px] text-amber-100/40">
            <div className="flex justify-between">
              <span>Streak Geral:</span>
              <strong className="text-amber-400 font-bold">{gameState.streak} dias</strong>
            </div>
            <div className="flex justify-between">
              <span>Multiplicador Combo:</span>
              <strong className="text-emerald-400 font-bold">{gameState.combo}x</strong>
            </div>
            <div className="flex justify-between">
              <span>Focos Iniciados:</span>
              <strong className="text-purple-400 font-bold">{gameState.totalSessions}x</strong>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay scrim */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* RIGHT WORKSPACE COLUMN */}
        <main className="lg:col-span-9 flex flex-col gap-6 w-full">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              {/* TARGET VIEWPORT TABS */}
              
              {activeTab === 'focus' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full md:items-start">
                  
                  {/* LEFT SUB-COLUMN: THE TEMPLE CHAMBER & POMODORO TIMER CORE */}
                  <section className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.7)] md:col-span-7 flex flex-col justify-between relative">
                    
                    {/* Header Title Section Banner */}
                    <div className="bg-gradient-to-r from-amber-500/5 to-purple-500/5 border-b border-amber-500/10 p-3.5 flex justify-center items-center relative">
                      <h2 className="font-serif font-black text-xs md:text-sm text-amber-400 tracking-wider uppercase flex items-center justify-center gap-2 text-center">
                        <Timer className="w-4 h-4 text-amber-500" />
                        TROMPETA DE FOCO
                      </h2>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowActionWindowTooltip(!showActionWindowTooltip);
                        }}
                        className="absolute right-3.5 w-4.5 h-4.5 rounded-full border border-amber-500/30 text-amber-400/80 hover:text-amber-200 flex items-center justify-center text-[10px] font-bold hover:bg-amber-500/10 transition-all cursor-pointer"
                        title="Ajuda do Painel"
                      >
                        ?
                      </button>

                      {showActionWindowTooltip && (
                        <div className="absolute right-4 top-12 bg-stone-950/95 border border-amber-500/40 p-4 rounded shadow-2xl z-50 text-xs text-amber-200 font-serif max-w-sm leading-relaxed space-y-2">
                          <div className="flex justify-between items-center pb-1 border-b border-amber-500/10">
                            <strong className="text-amber-400 uppercase tracking-widest text-[11px] flex items-center gap-1">
                              Trompeta de foco (POMODORO)
                            </strong>
                            <button 
                              onClick={() => setShowActionWindowTooltip(false)}
                              className="text-amber-100/40 hover:text-amber-200 font-bold font-mono text-sm cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                          <p className="text-[11px] text-amber-100/80 leading-relaxed font-sans normal-case">
                            O painel principal de controle. Escolha o tipo de missão, defina uma duração e clique em "Iniciar Missão de Foco". Você ganha XP a cada minuto que estuda.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-center gap-3 md:gap-4 py-2">
                      
                      {/* Choose focus skill active dropdown option */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block">
                          Foco Ativo na Habilidade:
                        </label>
                        {gameState.skills.length > 0 ? (
                           <div className="relative">
                            <select
                              disabled={isRunning}
                              value={selectedSkillIdx}
                              onChange={(e) => setSelectedSkillIdx(parseInt(e.target.value))}
                              className="w-full bg-stone-950/80 border border-amber-500/20 text-amber-200 px-3 py-2 rounded font-serif text-sm focus:outline-none focus:border-amber-400 transition-all select-none appearance-none pr-10 cursor-pointer disabled:opacity-50"
                            >
                              {gameState.skills.map((sk, idx) => (
                                <option key={idx} value={idx}>
                                  {sk.emoji || '🎯'} {sk.name} (Nível {sk.level}){sk.prestige ? ` ✨ [Prestígio ${'★'.repeat(sk.prestige)}]` : ''}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-amber-400 opacity-60">
                              ▼
                            </div>
                           </div>
                        ) : (
                          <button
                            onClick={() => setIsSkillsModalOpen(true)}
                            className="w-full py-2 bg-stone-900 border border-dashed border-amber-500/20 text-xs text-amber-400 rounded hover:border-amber-400 transition-all font-serif italic cursor-pointer"
                          >
                            + Adicione sua primeira Habilidade Estudo
                          </button>
                        )}
                      </div>

                      {/* Random screen interactive event notifier */}
                      <div className={`${activeScreenEvent ? 'h-8' : 'h-1.5 md:h-2'} flex items-center justify-center transition-all duration-300`}>
                        <AnimatePresence>
                          {activeScreenEvent && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="bg-amber-400/10 border border-amber-400/30 px-4 py-1.5 rounded text-amber-300 text-xs tracking-wider flex items-center gap-1.5 font-bold font-serif shadow-lg animate-pulse"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>{activeScreenEvent.text}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* TIMER CLOCK VIEWPORT */}
                      {isBreakPrep ? (
                        <div className="text-center py-8 px-5 border border-emerald-500/35 bg-stone-950/70 rounded-lg space-y-5 shadow-inner relative overflow-hidden animate-fade-in my-3">
                          {/* Ambient green portal flow background */}
                          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                          
                          <div className="relative z-10 space-y-2">
                            <span className="text-emerald-500 text-[10px] tracking-[0.25em] uppercase font-serif font-black block">Foco Concluído com Glória!</span>
                            <h3 className="text-lg md:text-xl font-serif font-black text-stone-100 tracking-wide uppercase">
                              MUITO BEM! HORA DE RECOBRAR SUAS FORÇAS
                            </h3>
                            <p className="text-xs text-stone-100/50 max-w-sm mx-auto leading-relaxed font-serif">
                              Sua mente completou a jornada sagrada ({Math.round(timerDuration / 60)} min). Escolha seu tempo de recuperação:
                            </p>
                          </div>

                          {!isDungeonMode && (
                            <div className="relative z-10 space-y-2 max-w-xs mx-auto">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedBreakMins(5)}
                                    className={`w-full py-2.5 text-xs text-center border font-serif rounded tracking-widest select-none transition-all cursor-pointer ${
                                      selectedBreakMins === 5
                                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-bold scale-[1.02]'
                                        : 'border-stone-800 text-stone-100/50 hover:text-stone-200 hover:bg-stone-900/10'
                                    }`}
                                  >
                                    5 MIN
                                  </button>
                                  <span className="text-[10px] text-stone-500 font-serif block text-center">(padrão)</span>
                                </div>
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedBreakMins(gameState.longBreakMinutes || 15)}
                                    className={`w-full py-2.5 text-xs text-center border font-serif rounded tracking-widest select-none transition-all cursor-pointer ${
                                      selectedBreakMins === (gameState.longBreakMinutes || 15)
                                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-bold scale-[1.02]'
                                        : 'border-stone-800 text-stone-100/50 hover:text-stone-200 hover:bg-stone-900/10'
                                    }`}
                                  >
                                    {(gameState.longBreakMinutes || 15)} MIN
                                  </button>
                                  <span className="text-[10px] text-stone-500 font-serif block text-center">(descanso longo)</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="relative z-10 flex flex-col gap-3.5 max-w-xs mx-auto pt-4">
                            <button
                              onClick={() => startBreakTimer(selectedBreakMins)}
                              className="w-full py-3.5 text-sm font-serif font-black uppercase text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400 rounded tracking-widest hover:scale-101 active:scale-99 cursor-pointer select-none shadow-[2px_4px_rgba(16,185,129,0.3)] transition-all shadow-lg text-center font-bold"
                            >
                              ☕ Iniciar Descanso
                            </button>
                            
                            <button
                              onClick={skipBreak}
                              className="text-amber-500/80 hover:text-amber-400 text-[11px] font-serif uppercase tracking-widest transition-all cursor-pointer bg-transparent border-none py-1 hover:underline"
                            >
                              ⏩ Pular descanso e focar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-5 relative flex flex-col items-center justify-center">
                          {/* Rotating glowing sun backdrop */}
                          <div
                            className={`absolute w-44 h-44 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full border border-dashed transition-all duration-1000 ${
                              isBreakActive
                                ? 'border-emerald-500/20 animate-spin scale-110'
                                : isRunning
                                  ? timeLeft <= 60
                                    ? 'border-red-500/25 animate-spin scale-110 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                                    : 'border-amber-400/20 animate-spin scale-110'
                                  : 'border-amber-500/5 animate-none'
                            }`}
                            style={{ animationDuration: '25s' }}
                          />

                          <div className="relative z-10">
                            {/* Digit Displays */}
                            <span className={`text-6xl md:text-7xl lg:text-8xl font-mono font-bold tracking-widest select-none transition-colors duration-300 ${
                                isPaused 
                                  ? 'text-amber-500/70' 
                                  : isBreakActive
                                    ? 'text-emerald-400 font-extrabold shadow-[2px_2px_25px_rgba(16,185,129,0.3)] scale-105'
                                    : isRunning 
                                      ? timeLeft <= 60
                                        ? 'text-red-500 font-extrabold shadow-[2px_2px_25px_rgba(239,68,68,0.45)] animate-pulse scale-105'
                                        : 'text-amber-300 font-extrabold shadow-[2px_2px_20px_rgba(245,217,122,0.15)] scale-105'
                                      : 'text-amber-200/75'
                              }`}
                            >
                              {String(Math.floor(timeLeft / 60)).padStart(2, '0')}
                              <span className={timeLeft <= 60 && isRunning && !isPaused ? "text-red-500" : isBreakActive ? "text-emerald-400" : "animate-pulse"}>:</span>
                              {String(timeLeft % 60).padStart(2, '0')}
                            </span>

                            <p className={`text-xs md:text-sm tracking-[0.12em] uppercase font-serif mt-3 flex items-center justify-center gap-2 font-black leading-tight ${isBreakActive ? 'text-emerald-400' : 'text-amber-300'}`}>
                              <Sparkle className={`w-3.5 h-3.5 ${isRunning || isBreakActive ? 'animate-spin' : ''}`} />
                              {isBreakActive 
                                ? 'RECUPERANDO MANA' 
                                : isPaused 
                                  ? 'REPOUSO DA MISSÃO' 
                                  : isRunning 
                                    ? (isDungeonMode 
                                      ? `⚔️ EXPLORANDO MASMORRA (${dungeonSessions}/4) ⚔️` 
                                      : isWildernessChecked 
                                        ? '⚔️ SOBREVIDA WILDERNESS ⚔️' 
                                        : 'MISSÃO DE FOCO ATIVA') 
                                    : 'PRONTO PARA COMEÇAR'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* QUICK PRE-SET TIMEOUTCARDS SELECTION */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-2">
                          <button
                            disabled={isRunning || isBreakActive}
                            onClick={() => changeDuration(25)}
                            className={`py-1.5 text-xs text-center border font-serif rounded tracking-widest select-none transition-all cursor-pointer ${
                              !isCustomTime && timerDuration === 25 * 60
                                ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-bold'
                                : 'border-amber-500/10 text-amber-100/40 hover:text-amber-200 hover:bg-stone-900/50'
                            }`}
                          >
                            25MIN
                          </button>
                          <button
                            disabled={isRunning || isBreakActive}
                            onClick={() => changeDuration(50)}
                            className={`py-1.5 text-xs text-center border font-serif rounded tracking-widest select-none transition-all cursor-pointer ${
                              !isCustomTime && timerDuration === 50 * 60
                                ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-bold'
                                : 'border-amber-500/10 text-amber-100/40 hover:text-amber-200 hover:bg-stone-900/50'
                            }`}
                          >
                            50MIN
                          </button>
                          <button
                            disabled={isRunning || isBreakActive}
                            onClick={() => changeDuration(90)}
                            className={`py-1.5 text-xs text-center border font-serif rounded tracking-widest select-none transition-all cursor-pointer ${
                              !isCustomTime && timerDuration === 90 * 60
                                ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-bold'
                                : 'border-amber-500/10 text-amber-100/40 hover:text-amber-200 hover:bg-stone-900/50'
                            }`}
                          >
                            90MIN
                          </button>
                          <button
                            disabled={isRunning || isBreakActive}
                            onClick={selectCustomTime}
                            className={`py-1.5 text-xs text-center border font-serif rounded tracking-widest select-none transition-all cursor-pointer ${
                              isCustomTime
                                ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-bold'
                                : 'border-amber-500/10 text-amber-100/40 hover:text-amber-200 hover:bg-stone-900/50'
                            }`}
                          >
                            CUSTOM
                          </button>
                        </div>

                        {isCustomTime && !isRunning && !isBreakActive && (
                          <div className="flex gap-2 items-center bg-stone-950/40 p-2 border border-amber-500/15 rounded">
                            <input
                              type="number"
                              value={customInputMins}
                              onChange={(e) => setCustomInputMins(e.target.value)}
                              placeholder="Minutos"
                              className="flex-1 bg-stone-900 border border-amber-500/10 px-2 py-1 text-center font-mono text-sm text-yellow-300 rounded focus:outline-none focus:border-amber-500"
                              min="1"
                              max="480"
                            />
                            <button
                              onClick={applyCustomTime}
                              className="px-4 py-1.5 bg-amber-500/15 border border-amber-400 hover:bg-amber-400 hover:text-black font-serif text-[11px] uppercase tracking-wider rounded transition-all cursor-pointer"
                            >
                              Fixar
                            </button>
                          </div>
                        )}
                      </div>

                      {/* TRANSIT CONTROL PLAYER TRIGGERS */}
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          {isBreakActive ? (
                            <button
                              onClick={skipBreak}
                              className="flex-1 py-3 text-sm font-serif font-black uppercase text-stone-950 bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300 hover:from-green-400 hover:to-emerald-200 border border-emerald-400 rounded tracking-widest hover:scale-101 active:scale-99 cursor-pointer select-none shadow-[2px_4px_rgba(16,185,129,0.3)] transition-all shadow-lg text-center font-bold animate-pulse"
                            >
                              ☕ Pular Descanso & Voltar ao Foco
                            </button>
                          ) : !isRunning ? (
                            <button
                              onClick={startQuestTimer}
                              className="flex-1 py-3 text-sm font-serif font-black uppercase text-stone-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-yellow-400 hover:to-amber-200 border border-amber-400 rounded tracking-widest hover:scale-101 active:scale-99 cursor-pointer select-none shadow-[2px_4px_rgba(200,162,60,0.3)] transition-all shadow-lg text-center"
                            >
                              ▶ Iniciar Missão de Foco
                            </button>
                          ) : (
                            <div className="flex-1 flex gap-2">
                              <button
                                onClick={togglePauseQuest}
                                className={`flex-1 py-3 text-sm font-serif font-black uppercase rounded border tracking-widest transition-all cursor-pointer ${
                                  isPaused 
                                    ? 'bg-purple-900/10 border-purple-500 text-purple-300' 
                                    : 'bg-stone-950/40 border-amber-500/30 text-amber-300'
                                }`}
                              >
                                {isPaused ? '▶ Retomar Missão' : '⏸️ Pausar Missão'}
                              </button>
                              <button
                                onClick={abandonQuest}
                                className={`px-4 py-3 text-xs rounded transition-all cursor-pointer ${
                                  isConfirmingAbandon
                                    ? 'bg-red-600 border border-red-400 text-white font-bold animate-pulse'
                                    : 'bg-red-950/40 border border-red-500/30 hover:bg-red-950 hover:text-red-300 text-red-400'
                                }`}
                              >
                                {isConfirmingAbandon ? 'Confirmar?' : 'Abandonar'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* DUNGEON MODE TRIGGER BUTTON */}
                        <div className="flex gap-2 items-center relative z-20">
                          <button
                            disabled={isRunning}
                            onClick={() => {
                              if (Date.now() - lastDungeonClearedTime < 2 * 60 * 60 * 1000) {
                                const remainingSecs = Math.max(0, Math.ceil((2 * 60 * 60 * 1000 - (Date.now() - lastDungeonClearedTime)) / 1000));
                                const mins = Math.floor(remainingSecs / 60) % 60;
                                const hrs = Math.floor(remainingSecs / 3600);
                                addSystemLog(`⏳ Cooldown Ativo: A masmorra está sob recarga celestial por mais ${hrs}h ${mins}m.`);
                                return;
                              }
                              setIsDungeonMode(!isDungeonMode);
                              if (!isDungeonMode) {
                                setIsWildernessChecked(false); // Can't be combined with Wilderness
                                addSystemLog('⚔️ Incursão por Masmorra Ativada! Comprometa-se a realizar 4 focos seguidos sem abandonar para adquirir GP bônus.');
                              } else {
                                addSystemLog('⚔️ Missão em Masmorra Desativada.');
                              }
                            }}
                            className={`flex-1 py-2.5 px-3 rounded text-xs gap-2 font-serif font-bold uppercase transition-all tracking-wider flex items-center justify-between border cursor-pointer select-none disabled:opacity-50 ${
                              isDungeonMode
                                ? 'bg-purple-900 border-purple-400 text-purple-100 font-extrabold shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                                : 'bg-purple-950/20 border-purple-500/20 text-purple-300 hover:bg-purple-950/40 hover:border-purple-500/40'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>⚔️</span>
                              <span>
                                {isDungeonMode 
                                  ? `Explorando Masmorra (${dungeonSessions}/4)` 
                                  : 'Entrar na Masmorra'
                                }
                              </span>
                            </div>
                            {Date.now() - lastDungeonClearedTime < 2 * 60 * 60 * 1000 ? (
                              <span className="text-[9px] font-mono opacity-65">⏳ Recarga</span>
                            ) : isDungeonMode ? (
                              <span className="text-[9px] bg-purple-700 text-white px-1.5 py-0.2 rounded font-mono animate-pulse">ATIVO</span>
                            ) : (
                              <span className="text-[9px] text-purple-400/70 font-mono">Bônus +2.500 GP</span>
                            )}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDungeonTooltip(!showDungeonTooltip);
                            }}
                            className="w-10 h-10 rounded border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs hover:bg-purple-500/10 transition-all cursor-pointer bg-purple-950/10"
                            title="Ajuda sobre a Masmorra"
                          >
                            ?
                          </button>

                          {showDungeonTooltip && (
                            <div className="absolute left-0 bottom-12 w-full bg-stone-950/95 border border-purple-500/40 p-4 rounded shadow-2xl z-50 text-xs text-purple-100 font-serif leading-relaxed space-y-2">
                              <div className="flex justify-between items-center pb-1 border-b border-purple-500/10">
                                <strong className="text-purple-400 uppercase tracking-widest text-[11px] flex items-center gap-1">
                                  ⚔️ Incursão em Masmorra
                                </strong>
                                <button 
                                  onClick={() => setShowDungeonTooltip(false)}
                                  className="text-purple-100/40 hover:text-purple-200 font-bold font-mono text-sm cursor-pointer"
                                >
                                  ×
                                </button>
                              </div>
                              <p className="text-[11px] text-purple-200/80 leading-relaxed font-sans normal-case">
                                <strong>Regras da Jornada:</strong> Comprometa-se a realizar <strong>4 sessões consecutivas</strong> de foco sem abandonar. <br />
                                <strong>Recompensas Magnas:</strong> +50% de XP por minuto em cada sessão, rolos de saque quadruplicados (Quad Loot), 40% de chance de saque Lendário e um bônus monumental de <strong>+2.500 GP</strong> ao concluir as 4 sessões.<br />
                                <strong>Recarga:</strong> Tempo de recarga de 2 horas após a conclusão. Não acumulável com o Modo Terra Selvagem.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* HARSH WILDERNESS MODE TOGGLE TRIGGER */}
                      <div className="border-t border-amber-500/10 pt-4 mt-1 flex justify-between items-center bg-stone-950/10 p-3 rounded border border-amber-500/5">
                        <div className="flex items-start gap-2.5 max-w-[80%]">
                          <ShieldAlert className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isWildernessChecked ? 'text-red-500 animate-pulse' : 'text-amber-100/30'}`} />
                          <div>
                            <h4 className="text-xs font-serif font-bold text-amber-100/90 flex items-center gap-1.5">
                              Modo Terra Selvagem (Wilderness)
                              {isWildernessChecked && (
                                <span className="text-[9px] bg-red-950 border border-red-500/40 text-red-500 px-1 rounded uppercase animate-pulse">Ativo</span>
                              )}
                            </h4>
                            <p className="text-[10px] text-amber-100/50 leading-relaxed font-serif">
                              Voto cognitivo severo. Minimizar a aba convoca a morte e falha de bônus automaticamente. Sobreviventes ganham <strong className="text-amber-400">+25% de XP & GP extras</strong>.
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={isRunning}
                            checked={isWildernessChecked}
                            onChange={(e) => {
                              setIsWildernessChecked(e.target.checked);
                              if (e.target.checked) addSystemLog('🛡️ Ajuste: Terra Selvagem selecionada para a próxima Missão!');
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-stone-900 border border-amber-500/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-red-500 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-amber-600 peer-checked:after:bg-red-500 after:border-amber-500 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-red-900/30 peer-checked:border-red-500/40" />
                        </label>
                      </div>

                    </div>

                    {/* ACTIVE CONTRATS / QUESTS OVERVIEW */}
                    {(() => {
                      const state = gameState;
                      const dailies = [
                        {
                          id: 'daily_1',
                          name: 'Devotamento Diário',
                          summary: 'Sessão de estudo hoje',
                          desc: 'Complete pelo menos uma sessão de estudo hoje.',
                          progress: state.todayMinutes > 0 ? 1 : 0,
                          target: 1,
                        },
                        {
                          id: 'daily_2',
                          name: 'Diligência Extrema',
                          summary: '50 min de foco total',
                          desc: 'Acumule 50 minutos de estudo concentrado hoje.',
                          progress: Math.min(state.todayMinutes, 50),
                          target: 50,
                        },
                        {
                          id: 'daily_3',
                          name: 'Ouro do Conhecimento',
                          summary: 'Sessão em Wilderness',
                          desc: 'Estude na perigosa floresta de Wilderness hoje.',
                          progress: state.history.some(h => {
                            const todayStr = new Date().toLocaleDateString('pt-BR');
                            return h.date.includes(todayStr) && h.wilderness;
                          }) ? 1 : 0,
                          target: 1,
                        }
                      ];

                      const guilds = [
                        {
                          id: 'guild_1',
                          name: 'Iniciado da Guilda',
                          desc: 'Atinja Combat Level 5 ou superior.',
                          progress: Math.min(state.combatLevel, 5),
                          target: 5,
                        },
                        {
                          id: 'guild_2',
                          name: 'Maratona Mágica',
                          desc: 'Conclua um total de 12 sessões acumuladas.',
                          progress: Math.min(state.totalSessions, 12),
                          target: 12,
                        },
                        {
                          id: 'guild_3',
                          name: 'Campeão da Constância',
                          desc: 'Atinja ou supere uma série recorde de 3 dias de estudo.',
                          progress: Math.min(state.bestStreak, 3),
                          target: 3,
                        }
                      ];

                      const unclaimedGuilds = guilds.filter(g => !state.achievements.includes(`claimed_${g.id}`));
                      let closestGuildQuest = null;
                      if (unclaimedGuilds.length > 0) {
                        closestGuildQuest = unclaimedGuilds.reduce((prev, current) => {
                          const prevPct = prev.progress / prev.target;
                          const currPct = current.progress / current.target;
                          return currPct > prevPct ? current : prev;
                        });
                      }

                      return (
                        <div className="p-4 bg-stone-950/20 border-t border-amber-500/10 space-y-3">
                          <div className="flex justify-between items-center bg-stone-950/30 px-2.5 py-1.5 rounded border border-amber-500/5">
                            <span className="text-[10px] uppercase font-serif font-black tracking-widest text-[#E2B054] flex items-center gap-1.5 leading-none">
                              📜 MURAL DE CONTRATOS ATIVOS
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('quests');
                                setIsMobileSidebarOpen(false);
                              }}
                              className="text-[9px] font-serif font-bold uppercase tracking-wider text-amber-500 hover:text-amber-300 transition-colors flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              Painel de Contratos →
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-0.5">
                            {/* Column 1: Daily Quests Summary */}
                            <div className="space-y-2 bg-stone-950/40 p-2.5 rounded-lg border border-amber-500/10">
                              <span className="text-[9px] uppercase font-serif tracking-widest text-[#E2B054]/60 font-semibold block mb-1">
                                🎯 Proclamações do Dia
                              </span>
                              <div className="space-y-1.5 text-xs">
                                {dailies.map((q) => {
                                  const isCompleted = q.progress >= q.target;
                                  const isClaimed = state.achievements.includes(`claimed_${q.id}`);
                                  return (
                                    <div key={q.id} className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0" title={q.desc}>
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                          isClaimed 
                                            ? 'bg-stone-600' 
                                            : isCompleted 
                                              ? 'bg-amber-400 animate-pulse' 
                                              : 'bg-amber-500/30'
                                        }`} />
                                        <span className={`truncate font-serif font-medium text-[11px] ${
                                          isClaimed 
                                            ? 'text-amber-100/30 line-through' 
                                            : isCompleted 
                                              ? 'text-[#E2B054]' 
                                              : 'text-amber-100/60'
                                        }`}>
                                          {q.summary}
                                        </span>
                                      </div>
                                      <span className={`font-mono text-[10px] flex-shrink-0 ${
                                        isCompleted ? 'text-amber-400 font-bold' : 'text-amber-100/30'
                                      }`}>
                                        {q.progress}/{q.target}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Column 2: Closest Guild Quest */}
                            <div className="bg-stone-950/40 p-2.5 rounded-lg border border-amber-500/10 flex flex-col justify-between">
                              <div>
                                <span className="text-[9px] uppercase font-serif tracking-widest text-[#E2B054]/60 font-semibold block mb-1">
                                  🛡️ Tese de Campanha de Guilda
                                </span>
                                {closestGuildQuest ? (
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <h5 className="font-serif font-bold text-[#E2B054] text-[11px] truncate select-none" title={closestGuildQuest.desc}>
                                          {closestGuildQuest.name}
                                        </h5>
                                        <p className="text-[10px] text-amber-100/65 font-sans leading-tight mt-0.5 select-none whitespace-normal">
                                          {closestGuildQuest.desc}
                                        </p>
                                      </div>
                                      <span className="font-mono text-[10px] text-amber-400 font-bold flex-shrink-0">
                                        {closestGuildQuest.progress}/{closestGuildQuest.target}
                                      </span>
                                    </div>
                                    <div className="space-y-1 pt-1.5">
                                      <div className="h-1.5 w-full bg-stone-900 border border-amber-500/5 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                                          style={{ width: `${(closestGuildQuest.progress / closestGuildQuest.target) * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="py-2 text-center flex flex-col justify-center items-center h-full">
                                    <span className="text-[10px] text-emerald-400 font-serif font-semibold">🏆 Todas as teses conquistadas!</span>
                                    <span className="text-[8px] text-amber-100/30 font-serif mt-0.5">Glória eterna para a sua dinastia!</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  </section>

                  {/* RIGHT SUB-COLUMN: HERO PROFILE & ACTIVE SKILLS SHEET */}
                  <section className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.7)] md:col-span-5 flex flex-col justify-between">
                    <div className="p-4 bg-gradient-to-r from-amber-500/5 to-purple-500/5 border-b border-amber-500/10 flex justify-between items-center">
                      <h2 className="font-serif font-black text-xs md:text-sm text-amber-400 tracking-wider uppercase flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-500" />
                        Ficha de Personagem
                      </h2>
                      <button
                        onClick={() => setIsSkillsModalOpen(true)}
                        className="text-[10px] uppercase font-bold text-amber-400 hover:text-amber-200 border border-amber-500/20 px-2 py-0.5 rounded cursor-pointer"
                      >
                        + Gerenciar
                      </button>
                    </div>

                    <div className="p-5 flex-1 space-y-5">
                      {/* REDESIGNED TWO-COLUMN RPG LAYOUT */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-stretch">
                        
                        {/* LEFT COLUMN: AVATAR & PERSONAL STATS */}
                        <div className="sm:col-span-5 flex flex-col justify-between bg-stone-950/20 border border-amber-500/10 p-3.5 rounded-lg">
                          <div className="flex flex-col items-center">
                            <div className="text-5xl md:text-6xl w-24 h-24 bg-stone-950 rounded-xl border-2 border-amber-500/40 flex items-center justify-center shadow-[0_4px_25px_rgba(226,176,84,0.18)] select-none relative overflow-hidden group self-center">
                              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/40 via-transparent to-transparent pointer-events-none" />
                              <span className="relative z-10 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] transform group-hover:scale-110 transition-transform duration-300">
                                {gameState.charClass === 'Mage' ? '🧙' : gameState.charClass === 'Warrior' ? '⚔️' : '🏹'}
                              </span>
                            </div>
                          </div>

                          {/* Personal Non-Combat Stats */}
                          <div className="space-y-2 mt-4">
                            <div className="bg-stone-950/40 border border-amber-500/10 p-2.5 rounded text-center transition-all hover:bg-stone-950/60 shadow-sm">
                              <div className="text-[9px] text-amber-100/40 uppercase tracking-[0.12em] font-serif flex items-center justify-center gap-1 select-none">
                                <span>🔥</span> Sequência Atual
                              </div>
                              <div className="text-xs font-mono font-black text-amber-400 mt-1">{gameState.streak} {gameState.streak === 1 ? 'dia' : 'dias'}</div>
                              <div className="text-[8.5px] text-stone-500 font-normal font-sans tracking-wide mt-0.5 select-none">(Recorde: {gameState.bestStreak}d)</div>
                            </div>
                            
                            <div className="bg-stone-950/40 border border-amber-500/10 p-2.5 rounded text-center transition-all hover:bg-stone-950/60 shadow-sm">
                              <div className="text-[9px] text-amber-100/40 uppercase tracking-[0.12em] font-serif flex items-center justify-center gap-1 select-none">
                                <span>⏱️</span> Foco Total
                              </div>
                              <div className="text-xs font-mono font-black text-amber-400 mt-1">
                                {Math.floor(gameState.totalMinutes / 60)}h{String(gameState.totalMinutes % 60).padStart(2, '0')}m
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: IDENTITY & PROGRESSION BARS */}
                        <div className="sm:col-span-7 flex flex-col justify-between space-y-4">
                          
                          {/* Identity Card */}
                          <div className="bg-stone-950/20 border border-amber-500/10 p-3.5 rounded-lg flex flex-col justify-center gap-1">
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2">
                                <h3 className="font-serif font-black text-base md:text-lg text-amber-200 tracking-wide uppercase leading-tight truncate">
                                  {gameState.charName}
                                </h3>
                                {gameState.equippedTitle && (() => {
                                  const found = TITLE_CATALOG.find(t => t.id === gameState.equippedTitle);
                                  if (!found) return null;
                                  return (
                                    <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 font-serif uppercase font-black text-[8px] px-1.5 py-0.5 rounded tracking-wider select-none animate-pulse shrink-0">
                                      {found.emoji} {found.name}
                                    </span>
                                  );
                                })()}
                              </div>
                              <p className="text-[10px] md:text-[11px] font-bold text-purple-400 tracking-widest uppercase font-serif">
                                {gameState.charClass === 'Mage' ? '🧙 Mago d\'Arraia' : gameState.charClass === 'Warrior' ? '🛡️ Guerreiro de Aço' : '🏹 Patrulheiro Silvestre'}
                              </p>
                            </div>
                          </div>

                          {/* Progression Box - Combat Level & Combat XP */}
                          <div className="bg-stone-950/25 border border-amber-500/10 p-3.5 rounded-lg shadow-inner space-y-3.5">
                            {/* RPG Plaque-style Combat Level Display */}
                            <div className="relative bg-gradient-to-r from-stone-950 via-purple-950/30 to-stone-950 border border-amber-500/25 p-2.5 rounded-md flex items-center justify-between shadow-inner select-none font-serif h-[38px] overflow-hidden group">
                              <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-amber-500/35"></span>
                              <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-amber-500/35"></span>
                              <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-amber-500/35"></span>
                              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-amber-500/35"></span>
                              <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-amber-200/90 font-black tracking-widest">
                                <span>⚔️</span>
                                <span>NÍVEL DE COMBATE</span>
                              </div>
                              <div className="flex-1 border-b border-dotted border-amber-500/20 mx-2 self-center h-1"></div>
                              <div className="text-[11px] font-mono font-black text-[#E2B054] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 group-hover:scale-105 transition-transform">
                                {gameState.combatLevel}
                              </div>
                            </div>

                            {/* Combat Experience Progress (XP) */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-baseline text-[8.5px] font-sans font-bold">
                                <span className="text-amber-100/40 uppercase tracking-widest font-serif flex items-center gap-1">✨ XP (Experiência de Combate)</span>
                                <span className="text-emerald-400 font-mono text-[8.5px]">
                                  {gameState.combatXP} / {gameState.combatLevel * 100}
                                </span>
                              </div>
                              <div className="h-2 w-full bg-stone-900 border border-amber-500/5 rounded overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                                  style={{ width: `${(gameState.combatXP / (gameState.combatLevel * 100)) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Survival HP Status */}
                          <div className="bg-stone-950/20 border border-amber-500/10 p-3.5 rounded-lg space-y-1">
                            <div className="flex justify-between items-baseline text-[8.5px] font-sans font-bold">
                              <span className="text-rose-400 uppercase tracking-widest font-serif flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" /> HP (PONTOS DE VIDA)
                              </span>
                              <span className="text-rose-400 font-mono text-[8.5px]">
                                {gameState.hp} / {gameState.maxHp}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-stone-900 border border-amber-500/5 rounded overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300 fill-rose-500"
                                style={{ width: `${(gameState.hp / gameState.maxHp) * 100}%` }}
                              />
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* QUICK SKILLS STATUS LISTS */}
                      <div className="space-y-3 relative">
                        <h4 className="text-[10px] font-serif font-bold tracking-wider uppercase text-amber-100/40 pb-1 border-b border-amber-500/5 flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span>Habilidades</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowSkillsTooltip(!showSkillsTooltip);
                              }}
                              className="w-4 h-4 rounded-full border border-amber-500/25 text-amber-400/70 hover:text-amber-200 flex items-center justify-center text-[9px] font-bold hover:bg-amber-500/10 transition-all cursor-pointer"
                              title="Ajuda sobre Habilidades"
                            >
                              ?
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 select-none">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsSkillsModalOpen(true);
                              }}
                              className="px-2 py-0.5 bg-[#C29544] hover:bg-[#d1a654] text-stone-950 text-[8px] font-black uppercase tracking-wide rounded cursor-pointer transition-all hover:scale-105 active:scale-95"
                              title="Criar ou Excluir Habilidades"
                            >
                              + MANAGE
                            </button>
                            <span className="text-[9px] font-mono opacity-60 font-bold">{gameState.skills.length} Ativas</span>
                          </div>
                        </h4>

                        {showSkillsTooltip && (
                          <div className="absolute right-0 top-6 w-full bg-stone-950/98 border border-amber-500/40 p-4 rounded shadow-2xl z-50 text-xs text-amber-200 font-serif leading-relaxed space-y-2">
                            <div className="flex justify-between items-center pb-1 border-b border-amber-500/10">
                              <strong className="text-amber-400 uppercase tracking-widest text-[10px] flex items-center gap-1">
                                🧠 Treino de Habilidades (Skills)
                              </strong>
                              <button 
                                onClick={() => setShowSkillsTooltip(false)}
                                className="text-amber-100/40 hover:text-amber-200 font-bold font-mono text-sm cursor-pointer"
                              >
                                ×
                              </button>
                            </div>
                            <p className="text-[11px] text-amber-100/80 leading-relaxed font-sans normal-case">
                              Habilidades ganham nível à medida que você estuda e ganha XP. Ao alcançar o <strong>Nível 99</strong>, você pode ativar o <strong>Prestígio</strong> — reiniciando o progresso para o nível de volta para 1 em troca de um multiplicador heróico de <strong>+25% extra de XP permanente</strong> para essa habilidade.
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                          {gameState.skills.map((sk, idx) => {
                            const reqXP = sk.level * 80;
                            const percent = Math.min((sk.xp / reqXP) * 100, 100);
                            const isTimerSelected = selectedSkillIdx === idx;

                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  setSelectedSkillIdx(idx);
                                }}
                                className={`relative bg-stone-950/40 border-2 rounded p-2.5 flex flex-col items-center justify-between text-center transition-all cursor-pointer h-[115px] select-none group min-w-0 ${
                                  isTimerSelected 
                                    ? 'border-[#C29544] bg-amber-500/[0.04] shadow-[0_0_12px_rgba(194,149,68,0.15)] scale-[1.01]' 
                                    : 'border-amber-500/10 hover:border-amber-500/30'
                                }`}
                              >
                                {/* Top-right edit settings button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspectingSkillIdx(idx);
                                    setEditSkillName(sk.name);
                                  }}
                                  className="absolute top-1 right-1 text-amber-500/50 hover:text-[#C29544] transition-all cursor-pointer text-[10px] hover:scale-120 p-0.5"
                                  title="Editar Habilidade & Subskills"
                                >
                                  ⚙️
                                </button>

                                {/* Central Skill Emoji - Click opens configuration modal */}
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspectingSkillIdx(idx);
                                    setEditSkillName(sk.name);
                                  }}
                                  className="text-2xl p-1 bg-stone-900/60 rounded-md border border-amber-500/10 hover:border-[#C29544] hover:bg-stone-900 transition-all active:scale-95 flex items-center justify-center w-10 h-10 cursor-pointer mb-1 select-none"
                                  title="Clique no ícone para gerenciar ou editar"
                                >
                                  {sk.emoji || '🎯'}
                                </div>

                                {/* Name & Lv */}
                                <div className="w-full flex flex-col justify-center items-center min-w-0">
                                  <span className="text-[10px] font-serif font-extrabold text-amber-250 tracking-wide uppercase truncate w-full px-0.5">
                                    {sk.name}
                                  </span>
                                  <div className="text-[10px] font-mono text-[#E2B054] font-black mt-0.5">
                                    Lv {sk.level} {sk.prestige && sk.prestige > 0 ? '👑'.repeat(sk.prestige) : ''}
                                  </div>
                                </div>

                                {/* Progress bar at bottom */}
                                <div className="w-full mt-1.5">
                                  <div className="h-1 w-full bg-stone-950 rounded overflow-hidden" title={`XP: ${sk.xp} / ${reqXP}`}>
                                    <div
                                      className="h-full bg-[#C29544] transition-all duration-300"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ACTIVE EQUIPMENT SLOTS (3 total) */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-serif font-bold tracking-wider uppercase text-amber-100/40 pb-0.5 border-b border-amber-500/5">
                          🛡️ Equipamentos Equipados (3 Slots)
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {[0, 1, 2].map((slotIdx) => {
                            const eqItem = (gameState.equippedEquipment || [null, null, null])[slotIdx];
                            return (
                              <div
                                key={slotIdx}
                                className={`aspect-square bg-stone-950/40 border ${
                                  eqItem ? 'border-amber-500/30 bg-amber-500/[0.04]' : 'border-dashed border-amber-500/10'
                                } rounded flex flex-col items-center justify-center p-1 relative transition-all`}
                              >
                                {eqItem ? (
                                  <>
                                    <span className="text-xl select-none" title={eqItem.desc}>{eqItem.emoji}</span>
                                    <span className="text-[8px] font-bold text-amber-200 truncate max-w-full text-center px-1" title={eqItem.name}>
                                      {eqItem.name}
                                    </span>
                                    <span className="text-[7px] font-mono text-emerald-400 font-bold" title="Cargas Restantes">
                                      🔋 {eqItem.charges}/{eqItem.maxCharges || 8}
                                    </span>
                                    
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnequipItem(slotIdx);
                                      }}
                                      className="absolute -top-1 -right-1 bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-200 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold cursor-pointer transition-all active:scale-95 animate-fade-in"
                                      title="Desequipar"
                                    >
                                      ×
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[8px] text-amber-100/20 font-serif italic text-center leading-tight">
                                    Slot {slotIdx + 1}<br/>Vazio
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* BUFFS AND ACTIVE POTIONS */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-serif font-bold tracking-wider uppercase text-amber-100/40 pb-0.5 border-b border-amber-500/5">
                          Bênçãos & Elixires Ativos
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {gameState.inventory.filter(i => ['DoubleLoot', 'FocusElixir', 'CrystalClarity', 'RuneFortune', 'StreakShield'].includes(i.buff)).length > 0 ? (
                            gameState.inventory
                              .filter(i => ['DoubleLoot', 'FocusElixir', 'CrystalClarity', 'RuneFortune', 'StreakShield'].includes(i.buff))
                              .map((item, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-serif font-bold bg-purple-950/40 border border-purple-500/30 text-purple-300 px-2.5 py-0.5 rounded flex items-center gap-1 shadow"
                                  title={item.desc}
                                >
                                  <span>{item.emoji}</span>
                                  <span>{item.name}</span>
                                </span>
                              ))
                          ) : (
                            <span className="text-[10px] italic text-amber-100/30 font-serif">Não há bençãos ativas. Vá ao Bazar de Mystara</span>
                          )}
                        </div>
                      </div>

                      {/* COLLECTED BAG ITEMS VIEWPORT */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-serif font-bold tracking-wider uppercase text-amber-100/40 pb-0.5 border-b border-amber-500/5">
                          Mochila de Relíquias & Itens
                        </h4>
                        <div className="grid grid-cols-5 gap-1.5 max-h-[120px] overflow-y-auto pr-0.5">
                          {gameState.inventory.filter(i => !['DoubleLoot', 'FocusElixir', 'CrystalClarity', 'RuneFortune', 'StreakShield'].includes(i.buff)).length > 0 ? (
                            gameState.inventory
                              .filter(i => !['DoubleLoot', 'FocusElixir', 'CrystalClarity', 'RuneFortune', 'StreakShield'].includes(i.buff))
                              .map((item, idx) => (
                                <div
                                  key={item.id || idx}
                                  onClick={() => setInspectingItem(item)}
                                  className={`aspect-square bg-stone-900 border ${item.isEquipment ? 'border-amber-500/40 bg-amber-500/[0.03] hover:border-amber-400' : 'border-amber-500/10 hover:border-amber-500/30'} rounded flex items-center justify-center text-xl cursor-pointer transition-all active:scale-95`}
                                  title={`${item.name} — Clique para interagir`}
                                >
                                  {item.emoji}
                                </div>
                              ))
                          ) : (
                            <div className="col-span-5 text-[10px] italic text-amber-100/35 font-serif py-1 animate-pulse">
                              Mochila vazia. Drops ocorrem ao concluir focos ou compre no Bazar.
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    <div className="p-3 bg-stone-950/25 border-t border-amber-500/5 h-20 text-center flex flex-col justify-center">
                      <div className="flex justify-center gap-3 text-xs font-mono font-bold">
                        <span className="text-amber-400">🔥 Streak: {gameState.streak} dias</span>
                        <span className="text-emerald-400">⚡ Combo: {gameState.combo}x</span>
                        <span className="text-purple-400">🏆 Focos: {gameState.totalSessions} incursões</span>
                      </div>
                      <p className="text-[9px] text-amber-100/30 mt-1 uppercase font-serif">A consistência esculpe heróis misticamente</p>
                    </div>
                  </section>
                  
                </div>
              )}

              {activeTab === 'habits' && (
                <HabitsTab
                  habits={gameState.habits || []}
                  onTriggerHabit={handleTriggerHabit}
                  onAddHabit={handleAddHabit}
                  onEditHabit={handleEditHabit}
                  onDeleteHabit={handleDeleteHabit}
                />
              )}

              {activeTab === 'dailies' && (
                <DailiesTab
                  dailies={gameState.dailies || []}
                  onToggleDaily={handleToggleDaily}
                  onToggleChecklistItem={handleToggleDailyChecklistItem}
                  onAddDaily={handleAddDaily}
                  onEditDaily={handleEditDaily}
                  onDeleteDaily={handleDeleteDaily}
                />
              )}

              {activeTab === 'todos' && (
                <TodosTab
                  todos={gameState.todos || []}
                  onToggleTodo={handleToggleTodo}
                  onToggleChecklistItem={handleToggleTodoChecklistItem}
                  onAddTodo={handleAddTodo}
                  onEditTodo={handleEditTodo}
                  onDeleteTodo={handleDeleteTodo}
                />
              )}

              {activeTab === 'history' && (
                <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
                  <h3 className="font-serif font-black text-xs md:text-sm text-amber-400 tracking-wider uppercase mb-4 flex items-center gap-2 pb-2.5 border-b border-amber-500/10">
                    <BookOpen className="w-4 h-4 text-amber-400" /> Diário de Bordo (Crônicas e Histórico)
                  </h3>
                  <HistoryTab history={gameState.history} />
                </div>
              )}

              {activeTab === 'heatmap' && (
                <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
                  <h3 className="font-serif font-black text-xs md:text-sm text-amber-400 tracking-wider uppercase mb-4 flex items-center gap-2 pb-2.5 border-b border-amber-500/10">
                    <Calendar className="w-4 h-4 text-amber-450" /> Calendário de Constância (Heatmap)
                  </h3>
                  <HeatmapTab history={gameState.history} streak={gameState.streak} />
                </div>
              )}

              {activeTab === 'quests' && (
                <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
                  <h3 className="font-serif font-black text-xs md:text-sm text-purple-400 tracking-wider uppercase mb-4 flex items-center gap-2 pb-2.5 border-b border-amber-500/10">
                    <Layers className="w-4 h-4 text-purple-400" /> Contratos da Guilda Escolar (Quests)
                  </h3>
                  <QuestsTab state={gameState} onClaimQuestReward={handleClaimQuestRewards} />
                </div>
              )}

              {activeTab === 'shop' && (
                <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
                  <h3 className="font-serif font-black text-xs md:text-sm text-amber-400 tracking-wider uppercase mb-4 flex items-center gap-2 pb-2.5 border-b border-amber-500/10">
                    <Coins className="w-4 h-4 text-amber-500" /> Bazar de Mystara (Loja)
                  </h3>
                  <ShopTab gold={gameState.gold} inventory={gameState.inventory} onBuyItem={handleBuyGoblinShopItem} />
                </div>
              )}

              {activeTab === 'titles' && (
                <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
                  <h3 className="font-serif font-black text-xs md:text-sm text-[#f43f5e] tracking-wider uppercase mb-4 flex items-center gap-2 pb-2.5 border-b border-amber-500/10">
                    <Award className="w-4 h-4 text-[#f43f5e]" /> Brasões & Títulos de Foco
                  </h3>
                  <TitlesTab
                    state={gameState}
                    onEquipTitle={handleEquipTitle}
                    onBuyTitle={handleBuyTitle}
                    onClaimAchievementTitle={handleClaimAchievementTitle}
                  />
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
                  <h3 className="font-serif font-black text-xs md:text-sm text-emerald-400 tracking-wider uppercase mb-4 flex items-center gap-2 pb-2.5 border-b border-amber-500/10">
                    <Shield className="w-4 h-4 text-emerald-400" /> Atributos Totais & Análise Avançada
                  </h3>
                  <StatsTab state={gameState} />
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
                  <h3 className="font-serif font-black text-xs md:text-sm text-rose-400 tracking-wider uppercase mb-4 flex items-center gap-2 pb-2.5 border-b border-amber-500/10">
                    <Award className="w-4 h-4 text-rose-500" /> Rol de Feitos Lendários (Badges)
                  </h3>
                  <AchievementsTab state={gameState} />
                </div>
              )}

              {activeTab === 'guide' && (
                <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
                  <h3 className="font-serif font-black text-xs md:text-sm text-amber-400 tracking-wider uppercase mb-4 flex items-center gap-2 pb-2.5 border-b border-amber-500/10">
                    <HelpCircle className="w-4 h-4 text-amber-400" /> Pergaminho Ancestral de Regras & Instruções
                  </h3>
                  <GuideTab />
                </div>
              )}
              
            </motion.div>
          </AnimatePresence>

          {/* CHRONIC REAL-TIME LOG RECORDS FEED */}
          <div className="border border-amber-500/15 bg-stone-950/90 text-amber-100/70 p-3.5 h-[130px] rounded-lg overflow-y-auto select-text relative shadow-inner z-10 w-full">
            <div className="absolute top-1.5 right-3 text-[9px] uppercase font-bold text-amber-400 font-serif select-none">Registros Celestiais (Logs)</div>
            <div className="space-y-1 text-xs font-mono">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className={log.highlighted ? 'text-amber-200 font-bold' : 'text-amber-100/40'}>
                    <span className="text-amber-400/50 mr-2">[{log.time}]</span>
                    <span>{log.text}</span>
                  </div>
                ))
              ) : (
                <div className="text-amber-100/30 italic">Nenhum sussurro celestial registrado até o momento...</div>
              )}
            </div>
          </div>
          
        </main>
      </div>

      {/* FOOTER */}
      <footer className="text-center py-6 text-[10px] text-amber-100/25 tracking-widest font-serif uppercase relative z-10 max-w-4xl mx-auto border-t border-amber-500/5 mt-5">
        HeroLog © 2026 — Um santuário meditativo do aventureiro cognitivo.
      </footer>

      {/* GAME OVER DEATH OVERLAY IF THEY SWITCHED TABS UNDER WILDERNESS */}
      <AnimatePresence>
        {isPlayerDead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-950/95 z-50 flex flex-col items-center justify-center text-center p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 10 }}
              className="space-y-6 max-w-md"
            >
              <div className="text-7xl">💀</div>
              <h2 className="text-red-500 font-serif font-black text-4xl md:text-5xl tracking-widest animate-pulse">
                VOCÊ MORREU
              </h2>
              <p className="text-amber-200 text-sm md:text-base font-serif leading-relaxed">
                Você quebrou o sagrado compasso do foco mental ao abandonar temporáriamente estes perímetros na Terra Selvagem (Wilderness)!
              </p>
              <p className="text-stone-400 text-xs italic">
                Sua mente vagou, e a força das distrações colapsou sua série de foco acumulada. XP e moedas acumuladas nesta jornada evaporaram nas brumas.
              </p>
              <button
                onClick={respawnHero}
                className="w-full py-4 bg-gradient-to-r from-red-700 to-red-900 border-2 border-red-500 text-red-100 font-serif font-bold tracking-widest text-sm rounded shadow-[0_4px_15px_rgba(239,68,68,0.4)] cursor-pointer select-none active:scale-95 transition-all uppercase"
              >
                Ressurgir (Respawn)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WILDERNESS GRACE CHANCE COUNTER WARNING MODAL */}
      <AnimatePresence>
        {isGraceActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-950/70 z-45 flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-quest-panel border-2 border-red-500 max-w-sm rounded p-6 shadow-[0_0_30px_rgba(239,68,68,0.3)] space-y-4"
            >
              <h3 className="text-red-500 font-serif font-bold uppercase tracking-wider text-lg animate-pulse">
                Sombra de Distração Detectada!
              </h3>
              <p className="text-amber-100/90 text-xs md:text-sm font-serif leading-relaxed">
                A Terra Selvagem (Wilderness) detectou sua distração mental! Acesse esta interface imediatamente antes do colapso do portal!
              </p>
              <div className="text-5xl font-mono font-black text-red-500 animate-ping text-center">
                {graceSecondsLeft}
              </div>
              <button
                onClick={handleReturnToFocusCap}
                className="w-full py-2 bg-stone-900 border border-red-500/50 hover:bg-stone-800 text-red-300 font-serif text-xs rounded uppercase tracking-wider cursor-pointer"
              >
                Selar Portal de Foco
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPLETED QUEST REWARDS POPUP WITH COHESIVE RPG TEMPLATE AS IN THE SCREENSHOT */}
      <AnimatePresence>
        {rewardsModalData?.visible && (() => {
          const hasLoot = !!(rewardsModalData.lootName || rewardsModalData.droppedTitleName);

          return (
            <div className="fixed inset-0 bg-black/85 z-50 flex items-start justify-center p-4 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-quest-panel border-2 border-[#C29544] max-w-lg w-full rounded shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar my-auto py-4 px-1 animate-fadeIn"
              >
                {rewardsStep === 1 && (
                  <div>
                    {/* Header Title alignment matching screenshot */}
                    <div className="pt-4 pb-2 text-center select-none">
                      <h2 className="text-[#E2B054] font-serif font-black text-xl md:text-2xl tracking-[0.15em] uppercase flex items-center justify-center gap-2">
                        ⚔️ MISSÃO CONCLUÍDA ⚔️
                      </h2>
                      <div className="mt-3 flex flex-col items-center justify-center gap-1">
                        <span className="text-amber-400 font-extrabold text-sm md:text-base tracking-widest font-serif drop-shadow-[0_2px_8px_rgba(226,176,84,0.35)]">
                          ★ CLASSIFICAÇÃO {(() => {
                            if (rewardsModalData.isWildernessChecked && rewardsModalData.pauseCount === 0) return "S+";
                            if (rewardsModalData.pauseCount === 0) return "S";
                            if (rewardsModalData.pauseCount === 1) return "A";
                            if (rewardsModalData.pauseCount <= 2) return "B";
                            if (rewardsModalData.pauseCount <= 4) return "C";
                            return "F";
                          })()} ★
                        </span>
                        <span className="text-[10px] text-amber-100/40 font-mono tracking-widest uppercase">
                          {(() => {
                            if (rewardsModalData.isWildernessChecked && rewardsModalData.pauseCount === 0) return "Sobrevivente Cognitivo — Lenda";
                            if (rewardsModalData.pauseCount === 0) return "Sem Pausas — Lendário";
                            if (rewardsModalData.pauseCount === 1) return "Pausa Única — Heróico";
                            if (rewardsModalData.pauseCount <= 2) return "Foco Estável — Exquisito";
                            if (rewardsModalData.pauseCount <= 4) return "Distração Parcial — Comum";
                            return "Pausas Constantes — Instável";
                          })()}
                        </span>
                      </div>
                      <div className="w-[85%] mx-auto border-b border-amber-500/15 mt-4 mb-4"></div>
                    </div>

                    {/* Grid of session stats with perfect space-between spacing */}
                    <div className="w-[85%] mx-auto space-y-4 font-serif text-xs md:text-sm text-[#A2A7A6] tracking-wide mb-6">
                      <div className="flex justify-between items-center py-2 border-b border-amber-500/5">
                        <span className="uppercase text-left font-serif tracking-widest text-[#9F9F9F] text-[10px]">DURAÇÃO DE MEDITAÇÃO</span>
                        <span className="text-[#E2B054] font-bold font-serif text-right">{rewardsModalData.durationMins} MIN</span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-amber-500/5">
                        <span className="uppercase text-left font-serif tracking-widest text-[#9F9F9F] text-[10px]">SEQUÊNCIA DE CHAMA</span>
                        <span className="text-[#F14D2A] font-bold text-right flex items-center justify-end gap-1 font-serif">
                           🔥 {gameState.streak || 1} {gameState.streak === 1 ? 'DIA' : 'DIAS'}
                        </span>
                      </div>

                      {rewardsModalData.comboBonusPercent > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-amber-500/5 text-[#F14D2A]">
                          <span className="uppercase text-left font-serif font-black tracking-widest text-[10px]">🔥 BÔNUS DE MULTIPLICADOR COMBO</span>
                          <span className="font-bold text-right">+{rewardsModalData.comboBonusPercent}%</span>
                        </div>
                      )}

                      {/* XP and GP Gains Box */}
                      <div className="mt-6 bg-stone-900/40 border border-amber-500/10 rounded-lg p-4 grid grid-cols-2 gap-4 divide-x divide-amber-500/10 text-center">
                        <div className="space-y-1">
                          <div className="text-[10px] text-amber-100/40 uppercase tracking-widest text-center">EXPERIÊNCIA ADQUIRIDA</div>
                          <div className="text-emerald-400 font-extrabold font-mono text-base md:text-lg drop-shadow-[0_2px_6px_rgba(52,211,153,0.25)]">
                            ⚡ +{rewardsModalData.xpEarned} XP
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-amber-100/40 uppercase tracking-widest text-center">OURO ARRECADADO</div>
                          <div className="text-[#E2B054] font-extrabold font-mono text-base md:text-lg drop-shadow-[0_2px_6px_rgba(226,176,84,0.25)]">
                            💎 +{rewardsModalData.goldEarned} GP
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-[85%] mx-auto pt-4 pb-4">
                      <button
                        onClick={() => {
                          if (hasLoot) {
                            setRewardsStep(2);
                          } else {
                            setRewardsStep(3);
                          }
                        }}
                        className="w-full py-3 bg-[#c29544] hover:bg-[#d1a654] active:bg-[#b0863a] text-stone-950 font-serif font-black tracking-widest uppercase rounded border border-[#E9C37A] cursor-pointer select-none shadow-[0_4px_12px_rgba(194,149,68,0.25)] transition-all active:scale-[0.98] text-center text-xs md:text-sm"
                      >
                        REIVINDICAR RECOMPENSAS →
                      </button>
                    </div>
                  </div>
                )}

                {rewardsStep === 2 && (
                  <div>
                    {/* Exquisite drop screen */}
                    <div className="pt-4 pb-2 text-center select-none animate-fadeIn">
                      <span className="text-3xl animate-bounce inline-block filter drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">🎁</span>
                      <h2 className="text-purple-400 font-serif font-black text-lg md:text-xl tracking-[0.2em] uppercase mt-2">
                        TESOURO CONQUISTADO
                      </h2>
                      <p className="text-[9px] text-amber-100/40 font-serif italic mt-1 uppercase tracking-widest">O destino agraciou sua persistência</p>
                      <div className="w-[85%] mx-auto border-b border-purple-500/20 mt-4 mb-4"></div>
                    </div>

                    <div className="w-[85%] mx-auto space-y-4 mb-6">
                      {rewardsModalData.lootName && (
                        <div className="bg-gradient-to-b from-purple-950/40 via-stone-950 to-stone-950 border border-purple-500/30 p-5 rounded-lg text-center relative overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.15)] select-none">
                          <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-purple-500/40"></span>
                          <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-purple-500/40"></span>
                          <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-purple-500/40"></span>
                          <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-purple-500/40"></span>
                          
                          <div className="text-5xl my-2 select-none filter drop-shadow-[0_0_12px_rgba(168,85,247,0.4)] transform hover:scale-110 transition-transform cursor-default inline-block">
                            {rewardsModalData.lootEmoji || '🎒'}
                          </div>
                          
                          <h3 className="text-purple-300 font-bold text-base md:text-lg tracking-wider uppercase font-serif mt-1">
                            {rewardsModalData.lootName}
                          </h3>
                          
                          <span className="inline-block px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-[9px] font-mono font-bold uppercase tracking-widest mt-1 my-2">
                             RARIDADE: EXQUISITO
                          </span>
                          
                          <p className="text-[10px] md:text-xs text-amber-100/60 leading-relaxed font-serif max-w-xs mx-auto italic mt-1">
                            "Um fragmento estelar condensado, guardado nos arquivos da alma como lembrança de sua pura determinação mística."
                          </p>
                        </div>
                      )}

                      {rewardsModalData.droppedTitleName && (
                        <div className="bg-gradient-to-b from-yellow-950/40 via-stone-950 to-stone-950 border border-yellow-500/40 p-5 rounded-lg text-center relative overflow-hidden shadow-[0_0_25px_rgba(234,179,8,0.25)] select-none">
                          <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-500/40"></span>
                          <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-500/40"></span>
                          <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-yellow-500/40"></span>
                          <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-500/40"></span>
                          
                          <div className="text-4xl my-2 select-none filter drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] transform hover:scale-110 transition-transform cursor-default inline-block animate-pulse">
                            {rewardsModalData.droppedTitleEmoji || '👑'}
                          </div>
                          
                          <h3 className="text-yellow-400 font-black text-sm md:text-base tracking-widest uppercase font-serif mt-1">
                            {rewardsModalData.droppedTitleName}
                          </h3>
                          
                          <span className="inline-block px-2.5 py-0.5 bg-yellow-500/15 border border-yellow-500/30 rounded-full text-[#E2B054] text-[9px] font-mono font-bold uppercase tracking-widest mt-1 my-2">
                            👑 TÍTULO RARO OBTIDO!
                          </span>
                          
                          <p className="text-[10px] md:text-xs text-amber-100/50 leading-relaxed font-serif max-w-xs mx-auto italic mt-1">
                            "Este epíteto imortal atesta perante os deuses teu foco inabalável. Pode ser equipado na tela de Títulos."
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="w-[85%] mx-auto pt-4 pb-4">
                      <button
                        onClick={() => setRewardsStep(3)}
                        className="w-full py-3 bg-[#c29544] hover:bg-[#d1a654] active:bg-[#b0863a] text-stone-950 font-serif font-black tracking-widest uppercase rounded border border-[#E9C37A] cursor-pointer select-none shadow-[0_4px_12px_rgba(194,149,68,0.25)] transition-all active:scale-[0.98] text-center text-xs md:text-sm"
                      >
                        CONFIRMAR TESOURO & CONTINUAR →
                      </button>
                    </div>
                  </div>
                )}

                {rewardsStep === 3 && (
                  <div>
                    {/* Chronicle of exploration */}
                    <div className="pt-4 pb-2 text-center select-none animate-fadeIn">
                      <h2 className="text-[#E2B054] font-serif font-black text-lg md:text-xl tracking-[0.2em] uppercase">
                        📜 CRÔNICA DA MISSÃO
                      </h2>
                      <p className="text-[9px] text-amber-100/40 font-serif italic mt-1 uppercase tracking-widest">
                        Registre suas memórias nas tábuas do conhecimento
                      </p>
                      <div className="w-[85%] mx-auto border-b border-amber-500/15 mt-4 mb-4"></div>
                    </div>

                    <div className="w-[85%] mx-auto space-y-6 text-left">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-serif font-black tracking-widest text-[#E2B054]/75 flex items-center gap-1.5 leading-none">
                          📋 NOTAS DO SÁBIO / REFLEXÕES FINAIS
                        </label>
                        <textarea
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                          placeholder="O herói recorda as revelações adquiridas sob este foco..."
                          className="w-full bg-stone-950/85 border border-[#C29544]/25 rounded-lg p-3 text-xs text-amber-200 placeholder-amber-100/25 focus:border-[#E2B054] focus:outline-none custom-scrollbar resize-none font-serif h-24 shadow-inner"
                        />
                      </div>

                      <div className="space-y-2 pt-2 border-t border-amber-500/5">
                        <label className="text-[10px] uppercase font-serif font-black tracking-widest text-[#E2B054]/75 flex items-center gap-1.5 leading-none">
                          🏷️ ESPECIALIZAÇÃO TREINADA (VINCULAR SUBSKILL)
                        </label>
                        {(() => {
                          const currentSkillTags = gameState.skills[rewardsModalData.skillIdx]?.tags || [];
                          if (currentSkillTags.length === 0) {
                            return (
                              <div className="text-[10px] text-[#A2A7A6]/60 italic p-3 bg-black/30 border border-amber-500/10 rounded font-serif py-2 leading-relaxed">
                                Nenhuma subskill cadastrada para a habilidade ativa "{rewardsModalData.skillName}". Para cadastrar, feche esta tela e clique em Habilidades no topo para Gerenciar Subskills.
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-wrap gap-1.5 p-2 bg-stone-950/50 border border-amber-500/10 rounded-lg max-h-28 overflow-y-auto custom-scrollbar">
                              {currentSkillTags.map((tag) => {
                                const isSelected = completionTag === tag;
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setCompletionTag(isSelected ? '' : tag)}
                                    className={`px-3 py-1 text-xs rounded transition-all cursor-pointer font-serif border ${
                                      isSelected
                                        ? 'bg-[#E2B054]/25 border-[#E2B054] text-[#E2B054] font-bold scale-[1.03] shadow-[0_0_10px_rgba(245,158,11,0.20)]'
                                        : 'bg-stone-900/60 border border-amber-500/5 text-amber-100/40 hover:border-amber-500/25 hover:text-amber-100/80'
                                    }`}
                                  >
                                    {tag} {isSelected && '✓'}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="w-[85%] mx-auto pt-6 pb-4">
                      <button
                        onClick={() => handleConfirmClaimRewards(completionNotes, completionTag)}
                        className="w-full py-3 bg-[#c29544] hover:bg-[#d1a654] active:bg-[#b0863a] text-stone-950 font-serif font-black tracking-widest uppercase rounded border border-[#E9C37A] cursor-pointer select-none shadow-[0_4px_12px_rgba(194,149,68,0.25)] transition-all active:scale-[0.98] text-center text-xs md:text-sm"
                      >
                        ⚙️ SELAR RITUAL & CONCLUIR MISSÃO →
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* FLOATING DETAILED MENU FOR A SKILL (CLICK ICON OR CARD EDGE) */}
      <AnimatePresence>
        {inspectingSkillIdx !== null && gameState.skills[inspectingSkillIdx] && (() => {
          const sk = gameState.skills[inspectingSkillIdx];
          const reqXP = sk.level * 80;
          const percent = Math.min((sk.xp / reqXP) * 105, 100);

          return (
            <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-b from-[#1c1812] to-[#0c0a08] border-2 border-[#C29544] max-w-md w-full rounded shadow-[0_0_35px_rgba(194,149,68,0.25)] p-6 relative space-y-5 text-amber-105 font-serif"
              >
                {/* Close Button top-right */}
                <button
                  onClick={() => setInspectingSkillIdx(null)}
                  className="absolute top-4 right-4 text-amber-400/50 hover:text-amber-100 cursor-pointer text-2xl font-bold font-mono transition-transform hover:scale-110"
                  title="Fechar"
                >
                  ×
                </button>

                {/* Skill Header Info */}
                <div className="flex flex-col items-center text-center space-y-2.5 select-none pt-2">
                  <div className="text-4xl p-3 bg-stone-950 border-2 border-[#C29544] rounded-full w-20 h-20 flex items-center justify-center shadow-[0_0_20px_rgba(194,149,68,0.30)] animate-pulse">
                    {sk.emoji || '🎯'}
                  </div>
                  <div>
                    <h3 className="text-[#E2B054] font-black text-xl tracking-[0.1em] uppercase font-serif">
                      ⚜ PORTAL DA HABILIDADE ⚜
                    </h3>
                    <p className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono">Aura Mental & Especialização Mística</p>
                  </div>
                  <div className="w-[60%] border-b border-amber-500/10"></div>
                </div>

                {/* EDIT SKILL NAME SECTION */}
                <div className="space-y-2 text-left bg-stone-950/40 border border-amber-500/10 p-3.5 rounded-lg relative overflow-hidden">
                  <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-amber-500/30"></span>
                  <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-amber-500/30"></span>
                  
                  <label className="text-[10px] uppercase font-bold tracking-widest text-amber-100/60 block font-serif leading-none">
                    🧭 Renomear Habilidade
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editSkillName}
                      onChange={(e) => setEditSkillName(e.target.value)}
                      placeholder="Nome da habilidade"
                      className="flex-1 bg-stone-950 border border-amber-500/20 rounded px-3 py-1.5 text-xs text-amber-100 placeholder-amber-100/20 focus:outline-none focus:border-[#C29544] font-sans"
                    />
                    <button
                      onClick={() => {
                        handleRenameSkill(inspectingSkillIdx, editSkillName);
                      }}
                      className="px-4 py-1.5 bg-[#C29544]/20 hover:bg-[#C29544]/45 border border-[#C29544]/40 text-amber-300 font-bold uppercase tracking-wider text-[10px] rounded cursor-pointer transition-all active:scale-[0.98]"
                    >
                      Salvar
                    </button>
                  </div>
                </div>

                {/* SKILL XP PROGRESS & LEVEL */}
                <div className="space-y-3 bg-stone-950/40 border border-amber-500/10 p-3.5 rounded-lg relative overflow-hidden">
                  <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-amber-500/30"></span>
                  <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-amber-500/30"></span>

                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-[#9F9F9F]">
                    <span>🎯 Sintonização Mental</span>
                    <span className="text-[#E2B054] font-bold font-mono text-xs">Lv {sk.level} {sk.prestige && sk.prestige > 0 ? '👑'.repeat(sk.prestige) : ''}</span>
                  </div>

                  {/* Large visual progress bar */}
                  <div className="space-y-1.5">
                    <div className="h-3 w-full bg-stone-950 rounded-full overflow-hidden border border-amber-500/20 shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 via-[#C29544] to-yellow-400 transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono text-amber-100/35">
                      <span>{sk.xp} / {reqXP} XP</span>
                      <span>{percent.toFixed(0)}% para evolução</span>
                    </div>
                  </div>

                  {sk.level >= 99 && (
                    <button
                      onClick={() => {
                        handlePrestigeSkill(inspectingSkillIdx);
                        setInspectingSkillIdx(null);
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-stone-950 text-[10px] font-black uppercase tracking-widest py-1.5 rounded font-serif shadow mt-1 animate-pulse cursor-pointer text-center"
                    >
                      👑 Alcançar Prestígio (Resetar a Nível 1 & Ganhar +25% XP Definitivo)
                    </button>
                  )}
                </div>

                {/* SUBSKILLS / FOCUS TAGS SECTION */}
                <div className="space-y-3 bg-stone-950/40 border border-amber-500/10 p-3.5 rounded-lg relative overflow-hidden">
                  <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-amber-500/30"></span>
                  <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-amber-500/30"></span>

                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-amber-100/60 leading-none">
                    <span>🏷️ Especialidades Vinculadas (Subskills)</span>
                    <span className="font-mono text-[9px] opacity-60">({(sk.tags || []).length} ativas)</span>
                  </div>

                  {/* List of subskills inside modal */}
                  {(!sk.tags || sk.tags.length === 0) ? (
                    <p className="text-[10px] italic text-amber-100/25 p-1 font-serif">Nenhuma subskill vinculada para foco.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 select-none custom-scrollbar pb-1">
                      {sk.tags.map((tag, tagIx) => (
                        <span key={tagIx} className="px-2.5 py-1 bg-amber-500/5 border border-amber-500/15 hover:border-amber-500/30 text-amber-200 text-[10px] rounded flex items-center gap-1 font-sans transition-all">
                          ✨ {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTagFromSkill(inspectingSkillIdx, tagIx)}
                            className="text-amber-100/40 hover:text-red-400 font-extrabold ml-1 cursor-pointer transition-colors"
                            title={`Remover subskill ${tag}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nova subskill (ex: React, Civil...)"
                      id="modal-new-subskill-input"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          const val = input.value.trim();
                          if (val) {
                            handleAddTagToSkill(inspectingSkillIdx, val);
                            input.value = '';
                          }
                        }
                      }}
                      className="flex-1 bg-stone-950 border border-amber-500/10 rounded px-3 py-1 text-xs text-amber-100 placeholder-amber-100/20 focus:outline-none focus:border-amber-400 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('modal-new-subskill-input') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          handleAddTagToSkill(inspectingSkillIdx, input.value.trim());
                          input.value = '';
                        }
                      }}
                      className="px-3 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 text-amber-300 text-xs font-bold rounded cursor-pointer transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Footer confirm */}
                <div className="pt-2">
                  <button
                    onClick={() => setInspectingSkillIdx(null)}
                    className="w-full py-3 bg-[#c29544] hover:bg-[#d1a654] active:bg-[#b0863a] text-stone-950 font-serif font-black tracking-widest uppercase rounded border border-[#E9C37A] cursor-pointer select-none shadow-[0_4px_12px_rgba(194,149,68,0.20)] transition-all active:scale-[0.98] text-center text-xs"
                  >
                    CONFIRMAR & FECHAR PORTAL
                  </button>
                </div>

              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* SKILLS AND ATTRIBUTE MANAGER MODAL POPUP */}
      <AnimatePresence>
        {isSkillsModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-quest-panel border-2 border-amber-500/30 max-w-lg w-full rounded-lg shadow-2xl overflow-hidden my-8"
            >
              <div className="bg-quest-panel border-b border-amber-500/15 p-4 flex justify-between items-center">
                <h3 className="font-serif font-bold text-amber-400 uppercase tracking-widest text-sm flex items-center gap-2">
                  <span>⚔️ Gerenciar Habilidades</span>
                </h3>
                <button
                  onClick={() => setIsSkillsModalOpen(false)}
                  className="text-amber-100/40 hover:text-amber-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                
                {/* TOOLTIP BANNER EXPLAINING SKILLS AND PRESTIGE */}
                <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-lg p-3.5 space-y-1.5">
                  <span className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-bold block">👑 Mecânica de Prestígio</span>
                  <p className="text-[11px] text-amber-100/70 leading-relaxed font-sans normal-case">
                    Habilidades evoluem à medida que você ganha XP. Cada foco alimenta a habilidade selecionada. Ao alcançar o <strong>Nível 99</strong>, você pode ativar o <strong>Prestígio</strong> — reiniciando o progresso para o nível de volta para 1 em troca de um multiplicador heróico de <strong>+25% extra de XP permanente</strong> para essa habilidade.
                  </p>
                </div>

                {/* ACTIVE SKILLS LIST */}
                <div className="space-y-2.5">
                  <span className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block">Habilidades Ativas:</span>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                    {gameState.skills.map((sk, idx) => {
                      const reqXP = sk.level * 80;
                      const percent = Math.min((sk.xp / reqXP) * 100, 100);

                      return (
                        <div
                          key={idx}
                          className="bg-stone-950/40 border border-amber-500/10 p-3 rounded hover:border-amber-500/30 transition-all space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 truncate max-w-[70%]">
                              <span className="text-lg">{sk.emoji || '🎯'}</span>
                              <strong className="text-amber-200 font-serif text-sm truncate">{sk.name}</strong>
                              {sk.prestige && sk.prestige > 0 ? (
                                <span className="text-yellow-400 text-[10px] font-bold" title={`Prestígio Nível ${sk.prestige}`}>
                                  👑{'★'.repeat(sk.prestige)}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-amber-400 font-bold font-mono text-[10px]">Nível {sk.level}</span>
                              <button
                                onClick={() => handleDeleteSkillIndex(idx)}
                                className="text-[10px] uppercase tracking-wider text-red-400/70 hover:text-red-400 font-bold font-serif px-1 py-0.5 cursor-pointer"
                                title="Esquecer Habilidade"
                              >
                                Esquecer
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="h-1.5 w-full bg-stone-950 rounded overflow-hidden">
                              <div
                                className="h-full bg-amber-500 transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-amber-100/30 font-mono">
                              <span>Progresso: {sk.xp} / {reqXP} XP</span>
                              {sk.prestige ? <span className="text-yellow-505 font-semibold font-sans">Bônus: +{sk.prestige * 25}% XP</span> : null}
                            </div>
                          </div>

                          {/* Subskills / Tags inline manager under progress bar */}
                          <div className="pt-1.5 border-t border-amber-500/5 space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] uppercase font-serif tracking-wider text-amber-100/40">
                              <span>Subskills (Tags de Foco):</span>
                            </div>
                            {(!sk.tags || sk.tags.length === 0) ? (
                              <div className="text-[9px] text-amber-100/25 italic">Nenhuma subskill cadastrada para esta habilidade.</div>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {sk.tags.map((tg, tIdx) => (
                                  <span key={tIdx} className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[9px] rounded flex items-center gap-1 font-sans">
                                    {tg}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTagFromSkill(idx, tIdx)}
                                      className="text-amber-100/40 hover:text-red-400 font-extrabold ml-0.5 cursor-pointer text-[9px]"
                                      title={`Remover subskill ${tg}`}
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-1">
                              <input
                                type="text"
                                placeholder="Criar subskill (ex: Direito Processual, React, CSS...)"
                                id={`new-subskill-tag-input-${idx}`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value.trim();
                                    if (val) {
                                      handleAddTagToSkill(idx, val);
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                                className="flex-1 bg-stone-950/50 border border-amber-500/10 rounded px-2 py-0.5 text-[10px] text-amber-100 placeholder-amber-100/15 focus:outline-none focus:border-amber-400 font-sans"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById(`new-subskill-tag-input-${idx}`) as HTMLInputElement;
                                  if (input && input.value.trim()) {
                                    handleAddTagToSkill(idx, input.value.trim());
                                    input.value = '';
                                  }
                                }}
                                className="px-2 py-0.5 bg-amber-500/15 hover:bg-amber-550 border border-amber-500/20 text-amber-300 hover:text-amber-100 text-[10px] font-bold rounded cursor-pointer transition-all"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {sk.level >= 99 && (
                            <button
                              type="button"
                              onClick={() => handlePrestigeSkill(idx)}
                              className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-stone-950 text-[10px] font-black uppercase tracking-widest py-1.5 rounded font-serif shadow animate-pulse cursor-pointer text-center"
                            >
                              👑 Alcançar Prestígio (Resetar a Nível 1 & Ganhar +25% XP Definitivo)
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ADD NEW CUSTOM SKILL */}
                <div className="border-t border-amber-500/10 pt-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block">
                      Selecione um Ícone/Emoji para a Habilidade:
                    </label>
                    <div className="flex flex-wrap gap-1.5 bg-stone-950/30 p-2.5 rounded border border-amber-500/10">
                      {SKILL_EMOJIS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setSelectedNewSkillEmoji(em)}
                          className={`w-7 h-7 text-sm flex items-center justify-center rounded transition-all cursor-pointer hover:bg-amber-500/15 ${
                            selectedNewSkillEmoji === em
                              ? 'bg-amber-500/20 border border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                              : 'bg-stone-900/45 border border-transparent text-stone-400'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block">
                      Criar Habilidade de Foco Personalizada:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkillNameInput}
                        onChange={(e) => setNewSkillNameInput(e.target.value)}
                        placeholder="Ex: Alquimia de Dados, Exercícios Físicos..."
                        className="flex-1 bg-stone-950/80 border border-amber-500/20 rounded px-3 py-2 text-xs text-amber-100 placeholder-amber-100/15 focus:outline-none focus:border-amber-400"
                        maxLength={30}
                      />
                      <button
                        onClick={handleAddCustomSkillRegister}
                        className="px-4 py-2 bg-amber-500/15 border border-amber-400 text-amber-300 text-xs font-serif uppercase tracking-widest hover:bg-amber-400 hover:text-stone-950 rounded transition-all cursor-pointer"
                      >
                        Gravar
                      </button>
                    </div>
                  </div>
                </div>

                {/* QUICK ADD SUGGESTIONS */}
                <div className="border-t border-amber-500/10 pt-4 space-y-2.5">
                  <label className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block">
                    Sugestões Rápidas:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {SKILL_SUGGESTIONS.map((sug, sIdx) => {
                      const alreadyHas = gameState.skills.some(s => s.name.toLowerCase() === sug.name.toLowerCase());
                      return (
                        <button
                          key={sIdx}
                          disabled={alreadyHas}
                          onClick={() => handleQuickAddSkill(sug.name, sug.emoji)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-serif transition-all rounded leading-tight text-left ${
                            alreadyHas
                              ? 'bg-stone-900/25 border-stone-800/40 text-amber-100/25 cursor-not-allowed select-none'
                              : 'bg-stone-950/50 border-amber-500/5 text-amber-200 hover:bg-amber-500/10 hover:border-amber-400 cursor-pointer'
                          }`}
                        >
                          <span className="text-sm">{sug.emoji}</span>
                          <span className="truncate">{sug.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => setIsSkillsModalOpen(false)}
                  className="w-full py-2.5 bg-stone-900 border border-amber-500/20 hover:border-amber-400 font-serif text-xs text-amber-400 uppercase tracking-widest rounded cursor-pointer"
                >
                  Concluir e Retornar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CAMERA SETTINGS AND OPTIONS POPUP */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-quest-panel border-2 border-amber-500/20 max-w-md w-full rounded-lg shadow-2xl overflow-hidden my-auto"
            >
              <div className="bg-quest-panel border-b border-amber-500/15 p-4 flex justify-between items-center">
                <h3 className="font-serif font-bold text-amber-400 uppercase tracking-widest text-sm">
                  Ajustes Sagrados de Campanha
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-amber-100/40 hover:text-amber-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
                
                {/* Hero identity details */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block mb-1">
                      Apelido Heráldico do Aventureiro:
                    </label>
                    <input
                      id="hero-name-fld"
                      type="text"
                      defaultValue={gameState.charName}
                      className="w-full bg-stone-950/80 border border-amber-500/20 rounded px-3 py-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                      maxLength={24}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block mb-1">
                      Descanso Longo (min) [1-120]:
                    </label>
                    <input
                      id="long-break-fld"
                      type="number"
                      min={1}
                      max={120}
                      defaultValue={gameState.longBreakMinutes ?? 15}
                      className="w-full bg-stone-950/80 border border-amber-500/20 rounded px-3 py-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block mb-1">
                      Selecione sua Classe de Prestígio (Bônus Diferentes):
                    </label>
                    
                    <div className="grid grid-cols-3 gap-2.5">
                      {/* Mage */}
                      <div
                        onClick={() => {
                          const nameFld = (document.getElementById('hero-name-fld') as HTMLInputElement)?.value;
                          handleApplyCharacterSetupChanges(nameFld, 'Mage');
                        }}
                        className={`p-3 border rounded text-center cursor-pointer transition-all ${
                          gameState.charClass === 'Mage' 
                            ? 'bg-amber-500/[0.04] border-amber-400' 
                            : 'bg-stone-900 border-amber-500/5 opacity-55'
                        }`}
                      >
                        <span className="text-2xl block mb-1">🧙</span>
                        <strong className="text-[10px] uppercase tracking-wider font-serif text-amber-200 block">Mago</strong>
                        <span className="text-[9px] text-purple-400 block">+20% XP</span>
                      </div>

                      {/* Warrior */}
                      <div
                        onClick={() => {
                          const nameFld = (document.getElementById('hero-name-fld') as HTMLInputElement)?.value;
                          handleApplyCharacterSetupChanges(nameFld, 'Warrior');
                        }}
                        className={`p-3 border rounded text-center cursor-pointer transition-all ${
                          gameState.charClass === 'Warrior' 
                            ? 'bg-amber-500/[0.04] border-amber-400' 
                            : 'bg-stone-900 border-amber-500/5 opacity-55'
                        }`}
                      >
                        <span className="text-2xl block mb-1">⚔️</span>
                        <strong className="text-[10px] uppercase tracking-wider font-serif text-amber-200 block">Guerreiro</strong>
                        <span className="text-[9px] text-amber-400 block">+20% Ouro</span>
                      </div>

                      {/* Ranger */}
                      <div
                        onClick={() => {
                          const nameFld = (document.getElementById('hero-name-fld') as HTMLInputElement)?.value;
                          handleApplyCharacterSetupChanges(nameFld, 'Ranger');
                        }}
                        className={`p-3 border rounded text-center cursor-pointer transition-all ${
                          gameState.charClass === 'Ranger' 
                            ? 'bg-amber-500/[0.04] border-amber-400' 
                            : 'bg-stone-900 border-amber-500/5 opacity-55'
                        }`}
                      >
                        <span className="text-2xl block mb-1">🏹</span>
                        <strong className="text-[10px] uppercase tracking-wider font-serif text-amber-200 block">Patrulheiro</strong>
                        <span className="text-[9px] text-emerald-400 block">+15% Streak</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Backup / Restore campaign JSON data */}
                <div className="border-t border-amber-500/10 pt-4 space-y-3">
                  <span className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block">Backup Rúnico da Campanha</span>
                  
                  {/* File approach */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-amber-100/30 block mb-0.5 font-mono">OPÇÃO 1: Arquivo JSON (Para Computador/Navegador)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleExportCampaignJSON}
                        className="py-1.5 bg-stone-900 border border-amber-500/20 hover:border-amber-400 hover:text-amber-300 text-amber-400 text-[10px] font-serif uppercase tracking-widest rounded transition-all cursor-pointer font-bold flex items-center justify-center gap-1"
                      >
                        📥 Exportar
                      </button>
                      <label className="py-1.5 bg-stone-900 border border-amber-500/20 hover:border-amber-400 hover:text-amber-300 text-amber-400 text-[10px] font-serif uppercase tracking-widest rounded transition-all cursor-pointer font-bold flex items-center justify-center gap-1 text-center">
                        📤 Importar
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportCampaignJSON}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Clipboard text approach */}
                  <div className="space-y-1.5 bg-stone-950/40 p-2.5 rounded border border-amber-500/5">
                    <span className="text-[9px] text-amber-200/40 block font-mono">OPÇÃO 2: Registro por Código (Ideal para Android / APK)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleCopySaveToClipboard}
                        className="py-1.5 bg-stone-900 border border-amber-500/20 hover:border-amber-400 hover:text-amber-300 text-amber-400 text-[10px] font-serif uppercase tracking-wider rounded transition-all cursor-pointer font-bold flex items-center justify-center gap-1"
                      >
                        📋 Copiar Progresso
                      </button>
                      <button
                        onClick={() => {
                          setPastedSaveText('');
                          setIsImportTextOpen(true);
                        }}
                        className="py-1.5 bg-stone-900 border border-amber-500/20 hover:border-amber-400 hover:text-amber-300 text-amber-400 text-[10px] font-serif uppercase tracking-wider rounded transition-all cursor-pointer font-bold flex items-center justify-center gap-1"
                      >
                        🔮 Restaurar Código
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hard purge button triggers reset */}
                <div className="border-t border-amber-500/10 pt-4 space-y-1.5">
                  <span className="text-[10px] uppercase font-serif tracking-widest text-red-500 block">Zona de Expurgo Violento</span>
                  <button
                    onClick={handleSanctizeCampaignData}
                    className="w-full py-2 bg-red-950/20 border border-red-500/40 hover:bg-red-950 text-red-400 text-xs font-serif uppercase tracking-widest rounded transition-all cursor-pointer font-bold"
                  >
                    ⚠️ Purgar Todos Dados da Gravação
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-amber-500/10 pt-4 space-y-1.5">
                  <span className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block">Conta</span>
                  <button
                    onClick={signOut}
                    className="w-full py-2 bg-stone-900 border border-stone-700 hover:border-red-500/40 text-stone-400 hover:text-red-400 text-xs font-serif uppercase tracking-widest rounded transition-all cursor-pointer"
                  >
                    Sair da conta (logout)
                  </button>
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      const nameFld = (document.getElementById('hero-name-fld') as HTMLInputElement)?.value;
                      handleApplyCharacterSetupChanges(nameFld, gameState.charClass);
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-serif font-black uppercase tracking-widest text-xs rounded cursor-pointer select-none"
                  >
                    Salvar Ajustes
                  </button>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 bg-stone-900 border border-amber-500/10 font-serif text-xs text-amber-100/40 uppercase tracking-widest rounded"
                  >
                    Sair
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RPG CUSTOM CONFIRM/ALERT DIALOG (Prevents iframe blocking) */}
      <AnimatePresence>
        {customDialog && customDialog.isOpen && (
          <div className="fixed inset-0 bg-black/85 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-950 border-2 border-amber-500/40 max-w-sm w-full rounded-lg shadow-2xl p-6 space-y-4 text-center font-sans animate-fade-in"
              id="rpg-confirm-dialog"
            >
              <div className="flex justify-center">
                <span className="text-3xl text-amber-400">📜</span>
              </div>
              <h4 className="font-serif font-bold text-amber-400 uppercase tracking-widest text-sm" id="rpg-dialog-title">
                {customDialog.title}
              </h4>
              <p className="text-xs text-amber-100/80 leading-relaxed font-mono" id="rpg-dialog-message">
                {customDialog.message}
              </p>
              
              <div className="flex gap-3 pt-2 justify-center">
                {customDialog.isConfirm ? (
                  <>
                    <button
                      id="rpg-dialog-btn-confirm"
                      onClick={() => {
                        customDialog.onConfirm();
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 text-xs font-serif uppercase tracking-widest rounded cursor-pointer font-bold transition-all min-w-[80px]"
                    >
                      Confirmar
                    </button>
                    <button
                      id="rpg-dialog-btn-cancel"
                      onClick={() => {
                        const cancel = customDialog?.onCancel;
                        setCustomDialog(null);
                        cancel?.();
                      }}
                      className="px-4 py-2 bg-stone-900 border border-amber-500/20 hover:border-amber-500/40 text-amber-100/60 text-xs font-serif uppercase tracking-widest rounded cursor-pointer transition-all min-w-[80px]"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    id="rpg-dialog-btn-ok"
                    onClick={() => {
                      customDialog.onConfirm();
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 text-xs font-serif uppercase tracking-widest rounded cursor-pointer font-bold transition-all min-w-[80px]"
                  >
                    OK
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CAMPAIGN IMPORT DIALOG (FOR ANDROID AND ANY DEVICE PASTE WORKFLOW) */}
      <AnimatePresence>
        {isImportTextOpen && (
          <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-950 border-2 border-amber-500/40 max-w-sm w-full rounded-lg shadow-2xl p-5 space-y-4 font-sans animate-fade-in flex flex-col"
              id="rpg-import-text-dialog"
            >
              <div className="flex justify-center">
                <span className="text-3xl text-amber-400">🔮</span>
              </div>
              <div className="text-center">
                <h4 className="font-serif font-bold text-amber-400 uppercase tracking-widest text-sm">
                  Restaurar Código Rúnico
                </h4>
                <p className="text-[11px] text-amber-100/70 mt-1 leading-relaxed">
                  Cole abaixo o conjunto completo de runas do seu progresso de campanha exportado anteriormente:
                </p>
              </div>

              <textarea
                value={pastedSaveText}
                onChange={(e) => setPastedSaveText(e.target.value)}
                placeholder="Cole aqui o longo código de progresso..."
                className="w-full h-32 p-2.5 bg-stone-900 border border-amber-500/30 text-amber-100 placeholder-amber-100/25 text-xs rounded font-mono focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 select-text cursor-text resize-none"
              />

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    handleImportSaveFromText(pastedSaveText);
                    setIsImportTextOpen(false);
                  }}
                  disabled={!pastedSaveText.trim()}
                  className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-300 disabled:from-stone-800 disabled:to-stone-800 disabled:text-amber-100/30 text-stone-950 text-xs font-serif uppercase tracking-widest rounded cursor-pointer font-bold transition-all text-center"
                >
                  Confirmar Runas
                </button>
                <button
                  onClick={() => setIsImportTextOpen(false)}
                  className="px-4 py-2 bg-stone-900 border border-amber-500/20 hover:border-amber-500/40 text-amber-100/60 text-xs font-serif uppercase tracking-widest rounded cursor-pointer transition-all text-center"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ITEM INSPECTION MODAL */}
      <AnimatePresence>
        {inspectingItem && (
          <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-950 border border-amber-500/20 max-w-sm w-full rounded-lg shadow-2xl overflow-hidden font-sans"
            >
              <div className="p-4 bg-gradient-to-b from-stone-900 to-stone-950 border-b border-amber-500/10 flex items-center gap-3">
                <span className="text-3xl select-none">{inspectingItem.emoji}</span>
                <div>
                  <h4 className="font-serif font-black text-amber-400 uppercase tracking-widest text-sm">
                    {inspectingItem.name}
                  </h4>
                  <span className="text-[9px] font-mono uppercase text-amber-100/40">
                    {inspectingItem.isEquipment ? '🛡️ Equipamento Legendário' : '🎒 Relíquia Colecionável'}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <p className="text-xs text-amber-100/80 leading-relaxed font-serif">
                  {inspectingItem.desc}
                </p>

                {inspectingItem.isEquipment && (
                  <div className="bg-amber-500/[0.04] border border-amber-500/20 p-2.5 rounded-lg text-center space-y-1">
                    <span className="text-[10px] uppercase font-serif text-amber-400 block tracking-wider">📦 Informações de Durabilidade</span>
                    <span className="text-sm font-mono font-bold text-emerald-400 block">
                      🔋 {inspectingItem.charges} / {inspectingItem.maxCharges || 8} Cargas
                    </span>
                    <span className="text-[9px] text-amber-100/50 block font-serif">
                      Perde 1 de durabilidade toda vez que for ativado ao completar uma sessão de foco.
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  {inspectingItem.isEquipment && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-mono block text-amber-100/30">Selecione o espaço para equipar:</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[0, 1, 2].map((slotIdx) => (
                          <button
                            key={slotIdx}
                            onClick={() => {
                              handleEquipItem(inspectingItem, slotIdx);
                              setInspectingItem(null);
                            }}
                            className="py-1.5 px-2 bg-stone-900 hover:bg-amber-500 hover:text-stone-950 border border-amber-500/20 rounded text-[10px] font-serif font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                          >
                            Slot {slotIdx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-amber-500/5">
                    <button
                      onClick={() => {
                        handleSellItem(inspectingItem);
                        setInspectingItem(null);
                      }}
                      className="flex-1 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 rounded text-xs font-serif font-bold uppercase tracking-wider text-center transition-all cursor-pointer"
                    >
                      💰 Vender ({inspectingItem.isEquipment ? Math.floor(inspectingItem.price * 0.5) : 50} GP)
                    </button>
                    <button
                      onClick={() => {
                        handleDiscardItem(inspectingItem);
                        setInspectingItem(null);
                      }}
                      className="py-2 px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 rounded text-xs font-serif uppercase tracking-wider text-center transition-all cursor-pointer"
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-900/40 border-t border-amber-500/10 flex justify-end">
                <button
                  onClick={() => setInspectingItem(null)}
                  className="py-1.5 px-4 bg-stone-900 hover:bg-stone-850 border border-amber-500/20 text-amber-100/70 rounded text-xs font-serif uppercase tracking-wider cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EPIC LEVEL UP & SKILL EVOLUTION POPUP SYSTEM */}
      <AnimatePresence>
        {levelUpQueue.length > 0 && (() => {
          const activeLevelUp = levelUpQueue[0];
          if (activeLevelUp.type === 'combat') {
            return (
              <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 via-transparent to-transparent pointer-events-none" />
                <motion.div
                  initial={{ scale: 0.85, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.85, opacity: 0, y: -30 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 120 }}
                  className="bg-stone-950 border-2 border-amber-500 animate-level-up-glow max-w-sm sm:max-w-md w-full rounded-2xl shadow-[0_0_50px_rgba(226,176,84,0.3)] overflow-hidden font-sans relative"
                  id="levelup-combat-modal"
                >
                  {/* Sparkles / Particles panel */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
                    <div className="absolute inset-0 bg-gradient-radial from-amber-500/10 via-transparent to-transparent opacity-40 animate-aura-pulsing" />
                    {[...Array(16)].map((_, i) => {
                      const shiftX = Math.floor(Math.random() * 240) - 120;
                      const rotate = Math.floor(Math.random() * 360);
                      const duration = 1.5 + Math.random() * 2;
                      const delay = Math.random() * 1.5;
                      const size = 6 + Math.floor(Math.random() * 8);
                      const left = 15 + Math.floor(Math.random() * 70);
                      return (
                        <div
                          key={i}
                          className="absolute bottom-[-20px] text-amber-400 select-none pointer-events-none opacity-0 rising-spark flex items-center justify-center"
                          style={{
                            left: `${left}%`,
                            '--shift-x': shiftX,
                            '--rotate': rotate,
                            '--duration': `${duration}s`,
                            animationDelay: `${delay}s`,
                            fontSize: `${size}px`
                          } as React.CSSProperties}
                        >
                          ✦
                        </div>
                      );
                    })}
                  </div>

                  {/* Content wrapper */}
                  <div className="relative z-10 p-6 sm:p-8 text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 bg-stone-900 border-2 border-amber-500 rounded-full flex items-center justify-center shadow-lg relative bg-gradient-to-b from-stone-800 to-stone-950">
                        <span className="text-4xl animate-bounce">⚔️</span>
                        <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-[10px] sm:text-xs uppercase font-serif tracking-widest text-[#E2B054] font-black">
                        Você evoluiu!
                      </h3>
                      <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wider text-amber-300 drop-shadow-[0_2px_10px_rgba(226,176,84,0.4)]">
                        LEVEL UP!
                      </h2>
                      <p className="text-sm sm:text-base font-serif font-semibold text-amber-100/90 tracking-wide leading-relaxed">
                        {activeLevelUp.charName.toUpperCase()} ALCANÇOU O <span className="text-[#E2B054] text-lg sm:text-xl font-bold block sm:inline mt-1 sm:mt-0">NÍVEL {activeLevelUp.newLevel}</span>
                      </p>
                      <div className="h-[2px] w-1/3 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto my-3" />
                      <div className="space-y-2 mt-3">
                        <p className="text-xs text-amber-100/60 font-serif italic max-w-xs mx-auto leading-relaxed">
                          O conhecimento fortalece o guerreiro.
                        </p>
                        <p className="text-xs text-amber-100/65 font-serif italic max-w-xs mx-auto leading-relaxed">
                          Continue avançando.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleDismissLevelUp}
                        className="w-full px-8 py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-stone-950 font-serif font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          } else {
            return (
              <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
                <motion.div
                  initial={{ scale: 0.85, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.85, opacity: 0, y: -30 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 120 }}
                  className="bg-stone-950 border-2 border-emerald-500 animate-skill-up-glow max-w-sm sm:max-w-md w-full rounded-2xl shadow-[0_0_50px_rgba(52,211,153,0.25)] overflow-hidden font-sans relative"
                  id="levelup-skill-modal"
                >
                  {/* Sparkles / Particles panel */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
                    <div className="absolute inset-0 bg-gradient-radial from-emerald-500/10 via-transparent to-transparent opacity-40 animate-aura-pulsing" />
                    {[...Array(16)].map((_, i) => {
                      const shiftX = Math.floor(Math.random() * 240) - 120;
                      const rotate = Math.floor(Math.random() * 360);
                      const duration = 1.5 + Math.random() * 2;
                      const delay = Math.random() * 1.5;
                      const size = 6 + Math.floor(Math.random() * 8);
                      const left = 15 + Math.floor(Math.random() * 70);
                      return (
                        <div
                          key={i}
                          className="absolute bottom-[-20px] text-emerald-400 select-none pointer-events-none opacity-0 rising-spark flex items-center justify-center"
                          style={{
                            left: `${left}%`,
                            '--shift-x': shiftX,
                            '--rotate': rotate,
                            '--duration': `${duration}s`,
                            animationDelay: `${delay}s`,
                            fontSize: `${size}px`
                          } as React.CSSProperties}
                        >
                          ✦
                        </div>
                      );
                    })}
                  </div>

                  {/* Content wrapper */}
                  <div className="relative z-10 p-6 sm:p-8 text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 bg-stone-900 border-2 border-emerald-500 rounded-full flex items-center justify-center shadow-lg relative bg-gradient-to-b from-stone-800 to-stone-950">
                        <span className="text-4xl animate-bounce">{activeLevelUp.emoji}</span>
                        <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-[10px] sm:text-xs uppercase font-serif tracking-widest text-[#34D399] font-black">
                        Mente Expandida!
                      </h3>
                      <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wider text-emerald-400 drop-shadow-[0_2px_10px_rgba(52,211,153,0.35)]">
                        MAESTRIA APRIMORADA
                      </h2>
                      <p className="text-xs sm:text-sm font-sans font-medium text-amber-100/90 leading-tight">
                        A habilidade <span className="text-[#34D399] font-bold block mt-0.5">{activeLevelUp.skillName}</span>
                      </p>
                      <p className="text-sm sm:text-base font-serif font-semibold text-amber-200 mt-2">
                        evoluiu para o <span className="text-emerald-400 text-lg sm:text-xl font-black block sm:inline mt-1 sm:mt-0">NÍVEL {activeLevelUp.newLevel}</span>
                      </p>
                      <div className="h-[2px] w-1/3 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mx-auto my-3" />
                      <p className="text-[11px] text-amber-100/50 font-serif italic max-w-xs mx-auto leading-normal">
                        Seus canais sinápticos e sabedoria prática alcançaram um novo patamar de refinamento cognitivo.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleDismissLevelUp}
                        className="w-full px-8 py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-stone-950 font-serif font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          }
        })()}
      </AnimatePresence>

      {/* Indicador de sincronização com Supabase */}
      <SyncIndicator status={syncStatus} />

    </div>
  );
}

export default function AppWithAuth() {
  const { user, loading, sendMagicLink, signOut } = useAuth();

  return (
  <AuthGate
    user={user}
    loading={loading}
    sendMagicLink={sendMagicLink}
    signInWithPassword={signInWithPassword}
    signOut={signOut}
  >
    {({ userId, signOut }) => (
      <App userId={userId} signOut={signOut} />
    )}
  </AuthGate>
);
}
