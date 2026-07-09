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
import { wasDailyScheduledForDate } from './utils/dailyScheduling';

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

// Tabs & Modules
import {
  HabitsTab,
  DailiesTab,
  TodosTab,
  useHabits,
  useDailies,
  useTodos,
  HistoryTab,
  QuestsTab,
  useGuildQuests,
  getRotatingDailyQuests,
  guildQuests,
  isQuestClaimed,
  useQuestProgress,
} from './modules/quests';

import {
  HeatmapTab,
  ShopTab,
  StatsTab,
  AchievementsTab,
  GuideTab,
  TitleShop,
  useShop,
} from './modules/kingdom';

import {
  TitleSelector,
  TITLE_CATALOG,
  useInventory,
  useTitles,
  useCharacter,
  useLevelUp,
  CharacterScreen,
  CharacterSummary,
  InventoryScreen,
} from './modules/character';

import { useSkills, SkillsScreen, QuickSkillsGrid } from './modules/skills';

import {
  FocusModeScreen,
  useFocusSession,
  useTimerControls,
  useBreakTimer,
  useAmbientSound,
  AmbientSoundButton,
  SessionConfig,
  ModeDescriptionModal,
  ModeDescriptionBlock,
} from './modules/focus';

import { BottomNav } from './components/navigation/BottomNav';
import { Modal } from './components/Modal';
import { SkillSelectorModal } from './components/SkillSelectorModal';

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
  ToggleLeft,
  ToggleRight,
  Skull,
  Scroll,
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

const MOBILE_SIDEBAR_WIDTH = 256;
const MOBILE_SIDEBAR_EDGE_HITBOX_WIDTH = 44;
const MOBILE_SIDEBAR_OPEN_THRESHOLD = 72;
const MOBILE_SIDEBAR_CLOSE_THRESHOLD = 176;

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
  const [shopSubTab, setShopSubTab] = useState<'items' | 'titles'>('items');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [mobileSidebarDragX, setMobileSidebarDragX] = useState<number>(0);
  const [isMobileSidebarDragging, setIsMobileSidebarDragging] = useState<boolean>(false);
  const mobileSidebarDragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startOpen: false,
    lastExposed: 0,
    isHorizontal: false,
  });

  // Focus Mode (Immersive Mode) State
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>(() => {
    let initialSkillIdx = 0;
    let initialIsWilderness = false;
    let initialIsDungeon = gameState.isDungeonMode || false;
    let initialDungeonStep = gameState.dungeonSessions || 0;

    try {
      const data = localStorage.getItem('herolog_active_session');
      if (data) {
        const session = JSON.parse(data);
        if (session && session.isActive) {
          initialSkillIdx = session.skillIdx || 0;
          initialIsWilderness = !!session.isWilderness;
          initialIsDungeon = !!session.isDungeon;
          initialDungeonStep = session.dungeonStep || 0;
        }
      }
    } catch (e) {}

    return {
      selectedSkillIdx: initialSkillIdx,
      isWildernessChecked: initialIsWilderness,
      isDungeonMode: initialIsDungeon,
      dungeonSessions: initialDungeonStep,
      sessionNotes: '',
      isFocusMode: false,
    };
  });

  useEffect(() => {
    setGameState(prev => {
      if (
        prev.isDungeonMode === sessionConfig.isDungeonMode &&
        prev.dungeonSessions === sessionConfig.dungeonSessions
      ) {
        return prev;
      }
      return {
        ...prev,
        isDungeonMode: sessionConfig.isDungeonMode,
        dungeonSessions: sessionConfig.dungeonSessions,
      };
    });
  }, [sessionConfig.isDungeonMode, sessionConfig.dungeonSessions]);

  const isFocusModeRef = useRef<boolean>(false);
  useEffect(() => {
    isFocusModeRef.current = sessionConfig.isFocusMode;
  }, [sessionConfig.isFocusMode]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      if (!isCurrentlyFullscreen && isFocusModeRef.current) {
        setSessionConfig(prev => ({ ...prev, isFocusMode: false }));
        setIsFocusCompleted(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const [isConfirmingAbandon, setIsConfirmingAbandon] = useState<boolean>(false);

  // Ref para garantir que completeFocusQuest sempre leia o skillIdx atual,
  // mesmo quando chamada de dentro de closures stale do setInterval.
  const selectedSkillIdxRef = useRef<number>(0);
  useEffect(() => {
    selectedSkillIdxRef.current = sessionConfig.selectedSkillIdx;
  }, [sessionConfig.selectedSkillIdx]);

  const [lastDungeonClearedTime, setLastDungeonClearedTime] = useState<number>(0);
  const [showActionWindowTooltip, setShowActionWindowTooltip] = useState<boolean>(false);
  const [showDungeonTooltip, setShowDungeonTooltip] = useState<boolean>(false);
  const [showWildernessTooltip, setShowWildernessTooltip] = useState<boolean>(false);
  const [muteSfx, setMuteSfx] = useState<boolean>(false);

  // Modals Toggles
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isImportTextOpen, setIsImportTextOpen] = useState<boolean>(false);
  const [pastedSaveText, setPastedSaveText] = useState<string>('');
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState<boolean>(false);
  const [isSkillSelectorOpen, setIsSkillSelectorOpen] = useState<boolean>(false);
  const [isTimerSettingsModalOpen, setIsTimerSettingsModalOpen] = useState<boolean>(false);
  const [newSkillNameInput, setNewSkillNameInput] = useState<string>('');
  const [selectedNewSkillEmoji, setSelectedNewSkillEmoji] = useState<string>('📚');
  const [showSkillsTooltip, setShowSkillsTooltip] = useState<boolean>(false);
  const [inspectingSkillIdx, setInspectingSkillIdx] = useState<number | null>(null);
  const [editSkillName, setEditSkillName] = useState<string>('');
  const [isPrestigeInfoOpen, setIsPrestigeInfoOpen] = useState<boolean>(false);
  
  // Game events states
  interface Toast {
    id: string;
    message: string;
    type: 'info' | 'error' | 'success';
  }
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const [logs, setLogs] = useState<{ id: string; time: string; text: string; highlighted: boolean }[]>([]);
  const [quoteOfTheDay, setQuoteOfTheDay] = useState<string[]>(STATIC_QUOTES[0]);

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

  const [dailyReport, setDailyReport] = useState<{
    rewardAmount: number;
    currentStreak: number;
    streakLost: boolean;
    streakProtected: boolean;
    missedDailiesCount: number;
    damageTaken: number;
    allDailiesCompleted: boolean;
  } | null>(null);

  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [completionTag, setCompletionTag] = useState<string>('');


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
          setSessionConfig(prevConfig => ({
            ...prevConfig,
            dungeonSessions: 0,
            isDungeonMode: false,
          }));
          setLastDungeonClearedTime(Date.now());
          setSelectedBreakMins(prev.pomodoroSettings.longBreakDuration || 15);
          dungeonClearGoldBonus = 2500;
          setTimeout(() => {
            addSystemLog('🏆 EXPLORAÇÃO MASMORRA SUCESSO: Concluiu as 4 sessões heróicas consecutivas! Um bônus monumental místico de +2.500 GP foi adicionado aos teus espólios!', true);
          }, 120);
        } else {
          setSessionConfig(prevConfig => ({
            ...prevConfig,
            dungeonSessions: nextSessions,
          }));
          setSelectedBreakMins(prev.pomodoroSettings.shortBreakDuration || 5);
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
              addSystemLog(`${sk.name} alcançou o Nível ${currentLevel}.`, true);
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

    setIsBreakPrep(true);
  };

  useEffect(() => {
    try {
      const data = localStorage.getItem('herolog_active_session');
      if (data) {
        const session = JSON.parse(data) as ActiveSession;
        if (session && session.isActive) {
          if (session.endTime > Date.now()) {
            // Restore selection states in App.tsx so they are in sync
            setSessionConfig(prev => ({
              ...prev,
              selectedSkillIdx: session.skillIdx,
              isDungeonMode: !!session.isDungeon,
              isWildernessChecked: !!session.isWilderness,
              dungeonSessions: session.dungeonStep || 0,
            }));
            setIsBreakActive(false);
            setIsBreakPrep(false);
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
      // 1. Calculate values for the Daily Report before updating state
      const rewardAmount = gameState.charClass === 'Warrior' ? 120 : 100;
      
      let currentStreak = gameState.streak;
      let streakLost = false;
      let streakProtected = false;
      
      if (gameState.lastStudyDate) {
        const lastDateObj = new Date(gameState.lastStudyDate);
        const differenceInTime = new Date().getTime() - lastDateObj.getTime();
        const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
        
        if (differenceInDays === 1) {
          // Continua ativo
        } else if (differenceInDays > 1) {
          const shieldIndex = gameState.inventory.findIndex(item => item.buff === 'StreakShield');
          if (shieldIndex >= 0) {
            streakProtected = true;
          } else {
            currentStreak = 0;
            streakLost = true;
          }
        }
      } else {
        // Se nunca estudou antes, a sequência inicia ou se mantém em 0, mas não há "perda"
      }
      
      const dayThatPassed = new Date(gameState.todayDate);
      let dailyNeglectDamage = 0;
      let missedCount = 0;
      (gameState.dailies || []).forEach(d => {
        if (!d.completed && wasDailyScheduledForDate(d, dayThatPassed)) {
          const { damage } = getDifficultyRewards(d.difficulty);
          dailyNeglectDamage += damage;
          missedCount += 1;
        }
      });
      
      let finalDmg = dailyNeglectDamage;
      if (gameState.charClass === 'Ranger') finalDmg = Math.max(1, Math.floor(dailyNeglectDamage * 0.7));
      
      const allDailiesCompleted = missedCount === 0 && (gameState.dailies || []).length > 0;

      // Show the Daily Report Modal
      setDailyReport({
        rewardAmount,
        currentStreak,
        streakLost,
        streakProtected,
        missedDailiesCount: missedCount,
        damageTaken: missedCount > 0 ? finalDmg : 0,
        allDailiesCompleted,
      });

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
                addSystemLog('⚠️ Sua sequência de dias resfriou para 0 porque você não realizou focos ontem. Não desanime, empunhe sua espada e recomece hoje!', false);
              }, 100);
            }
          }
        }
        
        // --- HABITICA DAILY NEGLECT DAMAGE SECTION ---
        let dailyNeglectDamage = 0;
        let missedCount = 0;
        const dayThatPassed = new Date(prev.todayDate);
        const updatedDailies = (prev.dailies || []).map(d => {
          const isScheduled = wasDailyScheduledForDate(d, dayThatPassed);
          
          if (!d.completed) {
            if (isScheduled) {
              const { damage } = getDifficultyRewards(d.difficulty);
              dailyNeglectDamage += damage;
              missedCount += 1;
              return { ...d, streak: 0, value: (d.value ?? 0) - 1 };
            }
            return d;
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
              addSystemLog(`💀 Dano Solar da Negligência: Deixaste ${missedCount} Diárias incompletas ontem! Perdeste -${finalDmg} de vitalidade HP.`, false);
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

  }, []);

  // System Logs Handler
  const addSystemLog = (text: string, highlighted = false) => {
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [
      { id: `${Date.now()}_${Math.random()}`, time: timeStr, text, highlighted },
      ...prev.slice(0, 50)
    ]);

    // Dispara toasts heróicos ou avisos para os 3 eventos específicos
    if (text.includes('gastou todas as suas cargas e quebrou')) {
      showToast(text, 'error');
    } else if (text.includes('já possui este nome exato')) {
      showToast('❌ Já existe uma habilidade com este nome.', 'error');
    } else if (text.includes('Não é possível remover ou alterar habilidades') && text.includes('foco estiver ativa')) {
      showToast('❌ Não é possível remover habilidades durante o foco.', 'error');
    }
  };

  // Setup clock phase details
  const getClockPhase = () => {
    const hr = new Date().getHours();
    if (hr >= 6 && hr < 12) return '🌅 Manhã';
    if (hr >= 12 && hr < 18) return '☀️ Tarde';
    if (hr >= 18 && hr < 21) return '🌆 Entardecer';
    return '🌙 Noite';
  };

  // Start Focus Quest Pomodoro
  const startQuestTimer = () => {
    setIsBreakPrep(false);
    setIsBreakActive(false);
    startSession();
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

    cancelSession();
    setIsConfirmingAbandon(false);

    if (sessionConfig.isDungeonMode) {
      setSessionConfig(prev => ({
        ...prev,
        isDungeonMode: false,
        dungeonSessions: 0
      }));
      addSystemLog('💀 FRACASSO NA MASMORRA: Ao abandonar, sua expedição na Masmorra colapsou tragicamente e todo o progresso heróico de focos seguidos foi perdido nas cinzas.', true);
    }
  };


  // Focus session state management hook invocation
  const focusSession = useFocusSession({
    gameState,
    setGameState,
    sessionConfig,
    onLog: (msg, flash) => addSystemLog(msg, flash),
    muteSfx,
    sound,
  });

  const {
    timeLeft,
    setTimeLeft,
    isRunning,
    isPaused,
    isFocusCompleted,
    setIsFocusCompleted,
    pauseCount,
    isGraceActive,
    graceSecondsLeft,
    isPlayerDead,
    setIsPlayerDead,
    activeScreenEvent,
    rewardsModalData,
    rewardsStep,
    setRewardsStep,
    startSession,
    cancelSession,
    togglePauseQuest,
    completeFocusQuest,
    triggerTabAwayInfraction,
    handleReturnToFocusCap,
    respawnHero,
    closeRewardsModal,
    updateRewardsModalData,
    enterBreak,
    exitBreak,
  } = focusSession;

  // Break/Descanso timer hook invocation
  const breakTimer = useBreakTimer({
    enterBreak,
    exitBreak,
    cancelSession,
    onLog: (msg, flash) => addSystemLog(msg, flash),
    muteSfx,
    onBreakComplete: () => {
      if (gameState.pomodoroSettings.autoStartFocus) {
        startQuestTimer();
      }
    }
  });

  const {
    isBreakPrep,
    setIsBreakPrep,
    isBreakActive,
    setIsBreakActive,
    selectedBreakMins,
    setSelectedBreakMins,
    enterBreakPrep,
    startBreakTimer,
    skipBreak,
  } = breakTimer;

  // Ambient Sounds hook invocation
  const ambientSound = useAmbientSound({
    isWorkSessionActive: isRunning && !isPaused && !isBreakActive,
  });

  // Timer controls hook invocation
  const timerControls = useTimerControls({
    gameState,
    setGameState,
    setTimeLeft,
    isRunning,
    isBreakActive,
  });

  const {
    isCustomTime,
    setIsCustomTime,
    customInputMins,
    setCustomInputMins,
    changeDuration,
    selectCustomTime,
    applyCustomTime,
  } = timerControls;

  const [ajustesFocus, setAjustesFocus] = React.useState<string>(String(gameState.pomodoroSettings.focusDuration));
  const [ajustesShortBreak, setAjustesShortBreak] = React.useState<string>(String(gameState.pomodoroSettings.shortBreakDuration));
  const [ajustesLongBreak, setAjustesLongBreak] = React.useState<string>(String(gameState.pomodoroSettings.longBreakDuration));
  const [ajustesAutoBreak, setAjustesAutoBreak] = React.useState<boolean>(gameState.pomodoroSettings.autoStartBreak);
  const [ajustesAutoFocus, setAjustesAutoFocus] = React.useState<boolean>(gameState.pomodoroSettings.autoStartFocus);

  React.useEffect(() => {
    if (isTimerSettingsModalOpen) {
      setAjustesFocus(String(gameState.pomodoroSettings.focusDuration));
      setAjustesShortBreak(String(gameState.pomodoroSettings.shortBreakDuration));
      setAjustesLongBreak(String(gameState.pomodoroSettings.longBreakDuration));
      setAjustesAutoBreak(gameState.pomodoroSettings.autoStartBreak);
      setAjustesAutoFocus(gameState.pomodoroSettings.autoStartFocus);
    }
  }, [isTimerSettingsModalOpen, gameState.pomodoroSettings]);

  const {
    habits: habitsList,
    onTriggerHabit,
    onAddHabit,
    onEditHabit,
    onDeleteHabit,
  } = useHabits(gameState, setGameState, addSystemLog, muteSfx, setIsPlayerDead);

  const {
    dailies: dailiesList,
    onToggleDaily,
    onToggleChecklistItem: onToggleDailyChecklistItem,
    onAddDaily,
    onEditDaily,
    onDeleteDaily,
  } = useDailies(gameState, setGameState, addSystemLog, muteSfx);

  const {
    todos: todosList,
    onToggleTodo,
    onToggleChecklistItem: onToggleTodoChecklistItem,
    onAddTodo,
    onEditTodo,
    onDeleteTodo,
  } = useTodos(gameState, setGameState, addSystemLog, muteSfx);

  const { onClaimQuestReward: handleClaimQuestRewards } = useGuildQuests(setGameState, addSystemLog, muteSfx);
  const { dailyQuests: dailyQuestsList, guildQuests: guildQuestsList } = useQuestProgress(gameState);

  const {
    inspectingItem,
    inspectItem,
    closeInspection,
    equipItem: handleEquipItem,
    unequipItem: handleUnequipItem,
    sellItem: handleSellItem,
    discardItem: handleDiscardItem
  } = useInventory({
    gameState,
    setGameState,
    addSystemLog,
    muteSfx,
    sound
  });

  const { buyGoblinShopItem: handleBuyGoblinShopItem } = useShop({
    gameState,
    setGameState,
    addSystemLog
  });

  const {
    equipTitle: handleEquipTitle,
    buyTitle: handleBuyTitle,
    claimAchievementTitle: handleClaimAchievementTitle
  } = useTitles({
    gameState,
    setGameState,
    addSystemLog,
    muteSfx,
    sound
  });

  const { applyCharacterSetupChanges } = useCharacter({
    gameState,
    setGameState,
    addSystemLog,
    setIsSettingsOpen
  });

  const {
    addCustomSkill,
    addTagToSkill,
    removeTagFromSkill,
    renameSkill,
    deleteSkill,
    prestigeSkill
  } = useSkills({
    gameState,
    setGameState,
    isFocusSessionRunning: isRunning,
    addSystemLog,
    muteSfx,
    sound,
    setCustomDialog,
    setSelectedSkillIdx: (idx) => setSessionConfig(prev => ({ ...prev, selectedSkillIdx: idx }))
  });

  const {
    activeLevelUp,
    hasPendingLevelUps,
    dismissCurrentLevelUp,
    isImportingRef
  } = useLevelUp({
    gameState,
    muteSfx,
    sound
  });

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
      const nextSessions = sessionConfig.dungeonSessions + 1;
      if (nextSessions >= 4) {
        setSessionConfig(prev => ({
          ...prev,
          dungeonSessions: 0,
          isDungeonMode: false,
        }));
        setLastDungeonClearedTime(Date.now());
        setSelectedBreakMins(gameState.pomodoroSettings.longBreakDuration || 15);
        setTimeout(() => {
          addSystemLog('🏆 EXPLORAÇÃO MASMORRA SUCESSO: Concluiu as 4 sessões heróicas consecutivas! Um bônus monumental místico de +2.500 GP foi adicionado aos teus espólios!', true);
        }, 120);
      } else {
        setSessionConfig(prev => ({
          ...prev,
          dungeonSessions: nextSessions,
        }));
        setSelectedBreakMins(gameState.pomodoroSettings.shortBreakDuration || 5);
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
              addSystemLog(`${sk.name} alcançou o Nível ${currentLevel}.`, true);
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

    const logOptions = [
      `✅ Missão concluída. ${activeSkillName} recebeu +${xpEarned} XP e +${goldEarned} GP.`,
      `📜 Mais uma sessão registrada. +${xpEarned} XP | +${goldEarned} GP.`,
      `⚔️ O foco foi mantido. ${activeSkillName} ganhou +${xpEarned} XP`,
    ];
    const chosenLog = logOptions[Math.floor(Math.random() * logOptions.length)];
    addSystemLog(chosenLog, true);

    // Audio coins chime triggers
    if (!muteSfx) sound.playCoins();

    setSessionConfig(prev => ({ ...prev, sessionNotes: '' }));
    closeRewardsModal();
    if (gameState.pomodoroSettings.autoStartBreak) {
      startBreakTimer(selectedBreakMins);
    } else {
      setIsBreakPrep(true);
    }
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

  // Character modifications handlers
  const handleApplyCharacterSetupChanges = (name: string, characterClass: 'Mage' | 'Warrior' | 'Ranger') => {
    applyCharacterSetupChanges(name, characterClass);
  };

  // Skills Manager actions
  const handleAddCustomSkillWithEmoji = (nameInput: string, emojiInput: string) => {
    addCustomSkill(nameInput, emojiInput);
  };

  const handleAddTagToSkill = (skillIdx: number, newTag: string) => {
    addTagToSkill(skillIdx, newTag);
  };

  const handleRemoveTagFromSkill = (skillIdx: number, tagIdx: number) => {
    removeTagFromSkill(skillIdx, tagIdx);
  };

  const handleRenameSkill = (idx: number, newName: string) => {
    renameSkill(idx, newName);
  };

  const handleAddCustomSkillRegister = () => {
    addCustomSkill(newSkillNameInput, selectedNewSkillEmoji);
    setNewSkillNameInput('');
  };

  const handleQuickAddSkill = (name: string, emoji: string) => {
    addCustomSkill(name, emoji);
  };

  const handleDeleteSkillIndex = (idx: number): boolean => {
    return deleteSkill(idx);
  };

  const handlePrestigeSkill = (idx: number) => {
    prestigeSkill(idx);
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
            cancelSession();
            setSessionConfig({
              selectedSkillIdx: 0,
              isWildernessChecked: false,
              isDungeonMode: false,
              dungeonSessions: 0,
              sessionNotes: '',
              isFocusMode: false,
            });
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

  const clampMobileSidebarX = (value: number) => {
    return Math.min(MOBILE_SIDEBAR_WIDTH, Math.max(0, value));
  };

  const isDesktopSidebarLayout = () => {
    return window.matchMedia('(min-width: 1024px)').matches;
  };

  const beginMobileSidebarDrag = (event: React.PointerEvent<HTMLElement>, startOpen: boolean) => {
    if (isDesktopSidebarLayout()) return;

    const target = event.target as HTMLElement;
    const startedOnInteractiveControl = !!target.closest('button, a, input, textarea, select');

    if (startOpen && startedOnInteractiveControl && !target.closest('[data-sidebar-drag-handle="true"]')) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    const initialExposed = startOpen ? MOBILE_SIDEBAR_WIDTH : 0;

    mobileSidebarDragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      startOpen,
      lastExposed: initialExposed,
      isHorizontal: false,
    };

    setIsMobileSidebarDragging(true);
    setMobileSidebarDragX(initialExposed);
  };

  const updateMobileSidebarDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = mobileSidebarDragRef.current;
    if (!drag.active) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (!drag.isHorizontal && Math.abs(deltaX) > 6) {
      drag.isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (!drag.isHorizontal && Math.abs(deltaY) > 8) {
      return;
    }

    if (drag.isHorizontal) {
      event.preventDefault();
    }

    const baseExposed = drag.startOpen ? MOBILE_SIDEBAR_WIDTH : 0;
    const nextExposed = clampMobileSidebarX(baseExposed + deltaX);
    drag.lastExposed = nextExposed;
    setMobileSidebarDragX(nextExposed);
  };

  const endMobileSidebarDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = mobileSidebarDragRef.current;
    if (!drag.active) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const shouldOpen = drag.startOpen
      ? drag.lastExposed >= MOBILE_SIDEBAR_CLOSE_THRESHOLD
      : drag.lastExposed >= MOBILE_SIDEBAR_OPEN_THRESHOLD;

    drag.active = false;
    setIsMobileSidebarOpen(shouldOpen);
    setMobileSidebarDragX(shouldOpen ? MOBILE_SIDEBAR_WIDTH : 0);
    setIsMobileSidebarDragging(false);
  };

  const mobileSidebarExposed = isMobileSidebarDragging
    ? mobileSidebarDragX
    : isMobileSidebarOpen
      ? MOBILE_SIDEBAR_WIDTH
      : 0;
  const mobileSidebarTranslateX = mobileSidebarExposed - MOBILE_SIDEBAR_WIDTH;
  const mobileSidebarScrimOpacity = Math.min(0.6, (mobileSidebarExposed / MOBILE_SIDEBAR_WIDTH) * 0.6);
  const mobileSidebarStyle = {
    '--mobile-sidebar-translate': `${mobileSidebarTranslateX}px`,
    touchAction: isMobileSidebarDragging ? 'none' : 'pan-y',
  } as React.CSSProperties;

  if (sessionConfig.isFocusMode) {
    return (
      <FocusModeScreen
        focusSession={focusSession}
        setIsFocusMode={(mode) => setSessionConfig(prev => ({ ...prev, isFocusMode: mode }))}
        muteSfx={muteSfx}
        sound={sound}
        gameState={gameState}
        selectedSkillIdx={sessionConfig.selectedSkillIdx}
        isWildernessChecked={sessionConfig.isWildernessChecked}
        isDungeonMode={sessionConfig.isDungeonMode}
        dungeonSessions={sessionConfig.dungeonSessions}
      />
    );
  }

  return (
    <div className="min-h-screen bg-quest-deep text-amber-100 font-sans flex flex-col antialiased relative overflow-x-hidden select-none">
      
      {/* Background celestial particles reflection effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/20 via-transparent to-transparent pointer-events-none" />

      {/* HEADER BAR */}
      <header className="sticky top-0 bg-quest-panel/95 border-b-2 border-amber-500/20 px-4 py-3 flex justify-between items-center z-40 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2">
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
      <div className="hidden md:block bg-gradient-to-r from-quest-card via-stone-950/40 to-quest-card border-b border-amber-500/5 py-2 px-4 text-center text-[11px] md:text-xs text-amber-100/50 italic leading-relaxed font-serif tracking-wide">
        {quoteOfTheDay[0]} <span className="text-amber-400/80 font-mono text-[10px] uppercase font-bold tracking-widest scale-90 inline-block ml-1">{quoteOfTheDay[1]}</span>
      </div>

      {/* PRIMARY TWO-COLUMN INTEGRATED GRID */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        
        {/* LEFT SIDEBAR - NAVIGATION CABINET */}
        <aside
          className="hidden lg:flex lg:col-span-3 lg:relative lg:bg-quest-panel/95 lg:rounded-lg lg:border lg:border-amber-500/15 lg:py-4 lg:px-3 lg:flex-col lg:justify-between lg:w-auto lg:h-auto lg:z-30"
        >
          <div className="space-y-5">

            {/* Nav Groups */}
            <div className="space-y-6">
              {/* Group 1: Santuário do Foco */}
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold text-amber-500/50 px-2 font-mono tracking-widest">⚔️ Santuário do Foco</p>
                <button
                  onClick={() => { setActiveTab('focus'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'focus' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-300/90 hover:bg-amber-500/[0.02]'
                  }`}
                >
                  <Timer className="w-4 h-4 text-amber-500/70" />
                  TROMPETA (POMODORO)
                </button>
              </div>

              {/* Group 2: Mural de Missões */}
              <div className="space-y-1 border-t border-stone-800/60 pt-4">
                <p className="text-[9px] uppercase font-bold text-amber-500/50 px-2 font-mono tracking-widest">📜 Mural de Missões</p>
                <button
                  onClick={() => { setActiveTab('habits'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'habits' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-300/90 hover:bg-amber-500/[0.02]'
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
                      : 'border border-transparent text-amber-100/50 hover:text-amber-300/90 hover:bg-amber-500/[0.02]'
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
                      : 'border border-transparent text-amber-100/50 hover:text-amber-300/90 hover:bg-amber-500/[0.02]'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400/80" />
                  TO DO LIST
                </button>
                <button
                  onClick={() => { setActiveTab('quests'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'quests' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-300/90 hover:bg-amber-500/[0.02]'
                  }`}
                >
                  <Layers className="w-4 h-4 text-purple-400/80" />
                  Contratos da Gilda
                </button>
                <button
                  onClick={() => { setActiveTab('history'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'history' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-300/90 hover:bg-amber-500/[0.02]'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-yellow-600/70" />
                  Crônicas Diárias
                </button>
              </div>

              {/* Group 3: O Reino */}
              <div className="space-y-1 border-t border-stone-800/60 pt-4">
                <p className="text-[9px] uppercase font-bold text-amber-500/50 px-2 font-mono tracking-widest">🏰 O Reino</p>
                <button
                  onClick={() => { setActiveTab('shop'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'shop' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-300/90 hover:bg-amber-500/[0.02]'
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
                      : 'border border-transparent text-amber-100/50 hover:text-amber-300/90 hover:bg-amber-500/[0.02]'
                  }`}
                >
                  <Award className="w-4 h-4 text-rose-400/80" />
                  Mercado de Títulos
                </button>
                <button
                  onClick={() => { setActiveTab('heatmap'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'heatmap' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-300/90 hover:bg-amber-500/[0.02]'
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
                      : 'border border-transparent text-amber-100/50 hover:text-amber-300/90 hover:bg-amber-500/[0.02]'
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
                      : 'border border-transparent text-amber-100/50 hover:text-amber-300/90 hover:bg-amber-500/[0.02]'
                  }`}
                >
                  <Award className="w-4 h-4 text-rose-500/50" />
                  Feitos de Alma
                </button>
                <button
                  onClick={() => { setActiveTab('logs'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'logs' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-300/90 hover:bg-amber-500/[0.02]'
                  }`}
                >
                  <Scroll className="w-4 h-4 text-amber-400/60" />
                  Logs Celestiais
                </button>
                <button
                  onClick={() => { setActiveTab('guide'); setIsMobileSidebarOpen(false); }}
                  className={`w-full text-left py-2 px-2.5 rounded font-serif text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'guide' 
                      ? 'bg-amber-500/[0.06] text-amber-300 font-bold border border-amber-500/20 border-l-2 border-l-amber-400 pl-3.5 scale-[1.02] shadow-inner' 
                      : 'border border-transparent text-amber-100/50 hover:text-amber-300/90 hover:bg-amber-500/[0.02]'
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

        {/* RIGHT WORKSPACE COLUMN */}
        <main className="lg:col-span-9 flex flex-col gap-6 w-full pb-20 lg:pb-0">
          
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full lg:items-start">
                  
                  {/* LEFT SUB-COLUMN: THE TEMPLE CHAMBER & POMODORO TIMER CORE */}
                  <section className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.7)] lg:col-span-7 flex flex-col justify-between relative">
                    
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

                    <div className="p-4 flex-1 flex flex-col justify-start md:justify-center gap-3 md:gap-4 py-2">
                      
                      {/* Choose focus skill active dropdown option */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block">
                          Foco Ativo na Habilidade:
                        </label>
                        {gameState.skills.length > 0 ? (
                           (() => {
                             const activeSkill = gameState.skills[sessionConfig.selectedSkillIdx] || gameState.skills[0];
                             return (
                               <button
                                 type="button"
                                 disabled={isRunning}
                                 onClick={() => setIsSkillSelectorOpen(true)}
                                 className="w-full bg-stone-950/80 border border-amber-500/20 hover:border-amber-500/40 text-amber-200 px-3 py-2.5 rounded-lg font-serif text-sm transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 select-none group"
                               >
                                 <span className="flex items-center gap-2 truncate pr-2">
                                   <span className="text-lg shrink-0">{activeSkill.emoji || '🎯'}</span>
                                   <span className="font-bold truncate text-amber-100 group-hover:text-amber-200">{activeSkill.name}</span>
                                   <span className="text-amber-400/80 text-xs font-mono font-medium shrink-0">· Nível {activeSkill.level}</span>
                                   {activeSkill.prestige && activeSkill.prestige > 0 ? (
                                     <span className="text-yellow-400 text-[10px] font-bold shrink-0">👑{'★'.repeat(activeSkill.prestige)}</span>
                                   ) : null}
                                 </span>
                                 <span className="text-amber-400 text-xs opacity-60 shrink-0 group-hover:opacity-100 transition-opacity">
                                   ▼
                                 </span>
                               </button>
                             );
                           })()
                        ) : (
                          <button
                            onClick={() => setIsSkillsModalOpen(true)}
                            className="w-full py-2 bg-stone-900 border border-dashed border-amber-500/20 text-xs text-amber-400 rounded hover:border-amber-400 transition-all font-serif italic cursor-pointer"
                          >
                            + Adicione sua primeira Habilidade Estudo
                          </button>
                        )}
                      </div>

                      {/* Segmented Control for Raid Modes */}
                      <div className="space-y-2 mt-1">
                        <label className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block">
                          Modo de Incursão:
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-stone-950/60 p-1 rounded-lg border border-amber-500/10">
                          <button
                            type="button"
                            disabled={isRunning}
                            onClick={() => {
                              setSessionConfig(prev => ({
                                ...prev,
                                isDungeonMode: false,
                                isWildernessChecked: false
                              }));
                              addSystemLog('⚔️ Modo de Incursão Padrão selecionado.');
                            }}
                            className={`py-1.5 px-2 rounded text-[11px] font-serif font-bold uppercase transition-all tracking-wider text-center cursor-pointer select-none disabled:opacity-50 ${
                              !sessionConfig.isDungeonMode && !sessionConfig.isWildernessChecked
                                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/40 border border-transparent'
                            }`}
                          >
                            Padrão
                          </button>
                          <button
                            type="button"
                            disabled={isRunning}
                            onClick={() => {
                              if (Date.now() - lastDungeonClearedTime < 2 * 60 * 60 * 1000) {
                                const remainingSecs = Math.max(0, Math.ceil((2 * 60 * 60 * 1000 - (Date.now() - lastDungeonClearedTime)) / 1000));
                                const mins = Math.floor(remainingSecs / 60) % 60;
                                const hrs = Math.floor(remainingSecs / 3600);
                                addSystemLog(`⏳ Cooldown Ativo: A masmorra está sob recarga celestial por mais ${hrs}h ${mins}m.`);
                                return;
                              }
                              setSessionConfig(prev => ({
                                ...prev,
                                isDungeonMode: true,
                                isWildernessChecked: false
                              }));
                              addSystemLog('⚔️ Incursão por Masmorra Ativada! Comprometa-se a realizar 4 focos seguidos sem abandonar para adquirir GP bônus.');
                            }}
                            className={`py-1.5 px-2 rounded text-[11px] font-serif font-bold uppercase transition-all tracking-wider text-center cursor-pointer select-none disabled:opacity-50 ${
                              sessionConfig.isDungeonMode
                                ? 'bg-purple-900 border border-purple-400 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                                : 'text-purple-400/80 hover:text-purple-300 hover:bg-purple-950/30 border border-transparent'
                            }`}
                          >
                            Masmorra ⚔️
                          </button>
                          <button
                            type="button"
                            disabled={isRunning}
                            onClick={() => {
                              setSessionConfig(prev => ({
                                ...prev,
                                isWildernessChecked: true,
                                isDungeonMode: false
                              }));
                              addSystemLog('🛡️ Ajuste: Terra Selvagem selecionada para a próxima Missão!');
                            }}
                            className={`py-1.5 px-2 rounded text-[11px] font-serif font-bold uppercase transition-all tracking-wider text-center cursor-pointer select-none disabled:opacity-50 ${
                              sessionConfig.isWildernessChecked
                                ? 'bg-red-950 border border-red-500/40 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                                : 'text-red-400/80 hover:text-red-300 hover:bg-red-950/20 border border-transparent'
                            }`}
                          >
                            Selvagem 💀
                          </button>
                        </div>

                        {/* Mode Context Information / Help Button */}
                        {(sessionConfig.isDungeonMode || sessionConfig.isWildernessChecked) && (
                          <div className="bg-stone-950/40 p-2.5 rounded border border-amber-500/5 text-[10px] leading-relaxed relative">
                            {sessionConfig.isDungeonMode && (
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-purple-300 font-serif">
                                  <span>⚔️ Explorando Masmorra </span>
                                  <span className="font-mono">({sessionConfig.dungeonSessions}/4)</span>
                                  {Date.now() - lastDungeonClearedTime < 2 * 60 * 60 * 1000 ? (
                                    <span className="text-[9px] font-mono ml-2 text-purple-400">⏳ Cooldown</span>
                                  ) : (
                                    <span className="text-[9px] ml-2 text-amber-400 font-mono">Bônus +2.500 GP & Quad Loot</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDungeonTooltip(!showDungeonTooltip);
                                  }}
                                  className="px-1.5 py-0.5 rounded border border-purple-500/20 text-purple-400 hover:bg-purple-500/10 font-bold transition-all cursor-pointer bg-purple-950/10 text-[9px]"
                                  title="Ajuda sobre a Masmorra"
                                >
                                  ?
                                </button>
                              </div>
                            )}

                            {sessionConfig.isWildernessChecked && (
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-red-400 font-serif">
                                  <span>💀 Terra Selvagem Ativa </span>
                                  <span className="text-[9px] ml-2 text-amber-400 font-mono">Bônus +25% XP & GP</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowWildernessTooltip(!showWildernessTooltip);
                                  }}
                                  className="px-1.5 py-0.5 rounded border border-red-500/20 text-red-400 hover:bg-red-500/10 font-bold transition-all cursor-pointer bg-red-950/10 text-[9px]"
                                  title="Ajuda sobre a Terra Selvagem"
                                >
                                  ?
                                </button>
                              </div>
                            )}

                            {/* Dungeon Mode Modal */}
                            <ModeDescriptionModal
                              isOpen={showDungeonTooltip}
                              onClose={() => setShowDungeonTooltip(false)}
                              title="⚔️ Incursão em Masmorra"
                              variant="purple"
                              blocks={[
                                {
                                  label: 'Regras da Jornada',
                                  icon: <Swords className="w-4 h-4" />,
                                  text: (
                                    <span>
                                      Comprometa-se a realizar <strong>4 sessões consecutivas</strong> de foco sem abandonar.
                                    </span>
                                  ),
                                },
                                {
                                  label: 'Recompensas Magnas',
                                  icon: <Flame className="w-4 h-4" />,
                                  text: (
                                    <span>
                                      +50% de XP por minuto em cada sessão, rolos de saque quadruplicados (Quad Loot), 40% de chance de saque Lendário e um bônus monumental de <strong>+2.500 GP</strong> ao concluir as 4 sessões.
                                    </span>
                                  ),
                                },
                                {
                                  label: 'Recarga para Masmorra',
                                  icon: <RotateCcw className="w-4 h-4" />,
                                  text: (
                                    <span>
                                      Tempo de recarga de 2 horas após a conclusão. Não acumulável com o Modo Terra Selvagem.
                                    </span>
                                  ),
                                },
                              ]}
                            />

                            {/* Wilderness Mode Modal */}
                            <ModeDescriptionModal
                              isOpen={showWildernessTooltip}
                              onClose={() => setShowWildernessTooltip(false)}
                              title="💀 Terra Selvagem"
                              variant="red"
                              blocks={[
                                {
                                  label: 'Regras da Jornada',
                                  icon: <Skull className="w-4 h-4" />,
                                  text: (
                                    <span>
                                      Voto cognitivo severo. Minimizar a aba convoca a morte e falha de bônus automaticamente.
                                    </span>
                                  ),
                                },
                                {
                                  label: 'Recompensas Magnas',
                                  icon: <Coins className="w-4 h-4" />,
                                  text: (
                                    <span>
                                      Sobreviventes ganham um bônus monumental de <strong>+25% de XP & GP extras</strong> no fechamento do foco.
                                    </span>
                                  ),
                                },
                              ]}
                            />
                          </div>
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
                            <span className="text-emerald-500 text-[10px] tracking-[0.25em] uppercase font-serif font-black block">A jornada desta missão chegou ao fim.</span>
                            <h3 className="text-lg md:text-xl font-serif font-black text-stone-100 tracking-wide uppercase">
                              DESCANSE. O PRÓXIMO DESAFIO ESPERA.
                            </h3>
                            <p className="text-xs text-stone-100/50 max-w-sm mx-auto leading-relaxed font-serif">
                              Todo guerreiro sabe a hora de avançar e a hora de recuperar as forças. Escolha quanto tempo deseja descansar.
                            </p>
                          </div>

                          {!sessionConfig.isDungeonMode && (
                            <div className="relative z-10 space-y-2 max-w-xs mx-auto">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedBreakMins(gameState.pomodoroSettings.shortBreakDuration)}
                                    className={`w-full py-2.5 text-xs text-center border font-serif rounded tracking-widest select-none transition-all cursor-pointer ${
                                      selectedBreakMins === gameState.pomodoroSettings.shortBreakDuration
                                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-bold scale-[1.02]'
                                        : 'border-stone-800 text-stone-100/50 hover:text-stone-200 hover:bg-stone-900/10'
                                    }`}
                                  >
                                    {gameState.pomodoroSettings.shortBreakDuration} MIN
                                  </button>
                                  <span className="text-[10px] text-stone-500 font-serif block text-center">(curto)</span>
                                </div>
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedBreakMins(gameState.pomodoroSettings.longBreakDuration)}
                                    className={`w-full py-2.5 text-xs text-center border font-serif rounded tracking-widest select-none transition-all cursor-pointer ${
                                      selectedBreakMins === gameState.pomodoroSettings.longBreakDuration
                                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-bold scale-[1.02]'
                                        : 'border-stone-800 text-stone-100/50 hover:text-stone-200 hover:bg-stone-900/10'
                                    }`}
                                  >
                                    {gameState.pomodoroSettings.longBreakDuration} MIN
                                  </button>
                                  <span className="text-[10px] text-stone-500 font-serif block text-center">(longo)</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="relative z-10 flex flex-col gap-3.5 max-w-xs mx-auto pt-4">
                            <button
                              onClick={() => startBreakTimer(selectedBreakMins)}
                              className="w-full py-3.5 text-sm font-serif font-black uppercase text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400 rounded tracking-widest hover:scale-101 active:scale-99 cursor-pointer select-none shadow-[2px_4px_rgba(16,185,129,0.3)] transition-all shadow-lg text-center font-bold"
                            >
                              ☕ FAZER UMA PAUSA
                            </button>
                            
                            <button
                              onClick={skipBreak}
                              className="text-amber-500/80 hover:text-amber-400 text-[11px] font-serif uppercase tracking-widest transition-all cursor-pointer bg-transparent border-none py-1 hover:underline"
                            >
                              ⏩ CONTINUAR SEM PAUSA
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
                                ? '🌿 RECUPERANDO AS ENERGIAS' 
                                : isPaused 
                                  ? 'REPOUSO DA MISSÃO' 
                                  : isRunning 
                                    ? (sessionConfig.isDungeonMode 
                                      ? `⚔️ EXPLORANDO MASMORRA (${sessionConfig.dungeonSessions}/4) ⚔️` 
                                      : sessionConfig.isWildernessChecked 
                                        ? '⚔️ SOBREVIDA WILDERNESS ⚔️' 
                                        : 'MISSÃO DE FOCO ATIVA') 
                                    : 'PRONTO PARA COMEÇAR'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* CONTROLS ROW: AMBIENT SOUND & TIMER SETTINGS */}
                      <div className="grid grid-cols-2 gap-2 relative z-20">
                        {/* 🎵 Som Ambiente Button */}
                        <AmbientSoundButton
                          selectedTrack={ambientSound.selectedTrack}
                          volume={ambientSound.volume}
                          selectTrack={ambientSound.selectTrack}
                          setVolume={ambientSound.setVolume}
                          tracks={ambientSound.tracks}
                        />

                        {/* ⚙️ Ajustes Button */}
                        <button
                          disabled={isRunning || isBreakActive}
                          onClick={() => setIsTimerSettingsModalOpen(true)}
                          className="relative px-3 py-1.5 rounded-lg border border-amber-500/20 bg-stone-900/60 hover:bg-stone-850 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 transition-all cursor-pointer select-none flex items-center justify-center gap-1.5 shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Ajustes de Tempo"
                        >
                          <Settings className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-400 transition-colors" />
                          <span className="text-[10px] font-serif font-black uppercase tracking-wider text-amber-100/70 group-hover:text-amber-100">
                            Ajustes · {gameState.pomodoroSettings.focusDuration}min
                          </span>
                        </button>
                      </div>

                      {/* Timer Settings Modal */}
                      {(() => {
                        const isFocusValid = !isNaN(parseInt(ajustesFocus)) && parseInt(ajustesFocus) >= 1 && parseInt(ajustesFocus) <= 180;
                        const isShortBreakValid = !isNaN(parseInt(ajustesShortBreak)) && parseInt(ajustesShortBreak) >= 1 && parseInt(ajustesShortBreak) <= 60;
                        const isLongBreakValid = !isNaN(parseInt(ajustesLongBreak)) && parseInt(ajustesLongBreak) >= 1 && parseInt(ajustesLongBreak) <= 60;
                        const isFormValid = isFocusValid && isShortBreakValid && isLongBreakValid;
                        const isCustomActive = isCustomTime || (
                          gameState.pomodoroSettings.focusDuration !== 25 &&
                          gameState.pomodoroSettings.focusDuration !== 50 &&
                          gameState.pomodoroSettings.focusDuration !== 90
                        );

                        return (
                          <Modal
                            isOpen={isTimerSettingsModalOpen}
                            onClose={() => setIsTimerSettingsModalOpen(false)}
                            title="⚙️ Ajustes do Foco"
                            variant="amber"
                          >
                            <div className="space-y-4 font-sans text-amber-100">
                              {/* Section 1: Presets */}
                              <div className="space-y-2">
                                <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-amber-500">
                                  Presets de Duração
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                  {[25, 50, 90].map((duration) => {
                                    const isActive = !isCustomTime && gameState.pomodoroSettings.focusDuration === duration;
                                    return (
                                      <button
                                        key={duration}
                                        type="button"
                                        onClick={() => {
                                          changeDuration(duration);
                                          setIsCustomTime(false);
                                          setIsTimerSettingsModalOpen(false);
                                        }}
                                        className={`py-2 text-xs font-serif rounded border tracking-wider select-none transition-all cursor-pointer ${
                                          isActive
                                            ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-bold'
                                            : 'border-amber-500/10 bg-stone-900/40 text-amber-100/60 hover:text-amber-200 hover:bg-stone-900/80'
                                        }`}
                                      >
                                        {duration} MIN
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Section 2: Custom Toggles */}
                              <div className="pt-2 border-t border-amber-500/10 space-y-3">
                                {/* Duração Personalizada Toggle Row */}
                                <div className="flex items-center justify-between gap-4 bg-stone-900/20 p-2.5 rounded border border-amber-500/5">
                                  <div className="max-w-[80%] text-left">
                                    <span className="text-[11px] font-serif font-bold text-amber-100/90 block">
                                      Duração Personalizada
                                    </span>
                                    <span className="text-[9px] text-amber-100/50 leading-tight block">
                                      Define tempos customizados para foco e pausas
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isCustomActive) {
                                        setIsCustomTime(false);
                                        changeDuration(25);
                                      } else {
                                        setIsCustomTime(true);
                                      }
                                    }}
                                    className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                                  >
                                    {isCustomActive ? (
                                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                                    ) : (
                                      <ToggleLeft className="w-8 h-8 text-stone-600" />
                                    )}
                                  </button>
                                </div>

                                {/* Custom Fields Block - ALWAYS VISIBLE */}
                                <div className={`bg-stone-950/60 border border-amber-500/20 rounded-lg p-3 space-y-4 transition-all duration-300 ${
                                  isCustomActive ? 'opacity-100' : 'opacity-40'
                                }`}>
                                  {/* Grid of 3 numeric controls */}
                                  <div className="grid grid-cols-3 gap-2">
                                    {/* Focus Duration */}
                                    <div className="bg-stone-900/40 border border-stone-800 p-2 rounded flex flex-col justify-between items-center text-center">
                                      <span className="text-[10px] font-serif text-amber-100/50 uppercase tracking-wider block mb-1">
                                        Foco
                                      </span>
                                      <input
                                        type="number"
                                        value={ajustesFocus}
                                        onChange={(e) => setAjustesFocus(e.target.value)}
                                        disabled={!isCustomActive}
                                        className={`w-full bg-stone-900 border ${!isFocusValid ? 'border-red-500/50 focus:border-red-500' : 'border-amber-500/10 focus:border-amber-500'} px-2 py-1 text-center font-mono text-sm text-yellow-300 rounded focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                                        min="1"
                                        max="180"
                                      />
                                      <span className="text-[8px] text-stone-500 font-mono mt-1">1-180 min</span>
                                    </div>

                                    {/* Short Break Duration */}
                                    <div className="bg-stone-900/40 border border-stone-800 p-2 rounded flex flex-col justify-between items-center text-center">
                                      <span className="text-[10px] font-serif text-amber-100/50 uppercase tracking-wider block mb-1">
                                        Pausa Curta
                                      </span>
                                      <input
                                        type="number"
                                        value={ajustesShortBreak}
                                        onChange={(e) => setAjustesShortBreak(e.target.value)}
                                        disabled={!isCustomActive}
                                        className={`w-full bg-stone-900 border ${!isShortBreakValid ? 'border-red-500/50 focus:border-red-500' : 'border-amber-500/10 focus:border-amber-500'} px-2 py-1 text-center font-mono text-sm text-yellow-300 rounded focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                                        min="1"
                                        max="60"
                                      />
                                      <span className="text-[8px] text-stone-500 font-mono mt-1">1-60 min</span>
                                    </div>

                                    {/* Long Break Duration */}
                                    <div className="bg-stone-900/40 border border-stone-800 p-2 rounded flex flex-col justify-between items-center text-center">
                                      <span className="text-[10px] font-serif text-amber-100/50 uppercase tracking-wider block mb-1">
                                        Pausa Longa
                                      </span>
                                      <input
                                        type="number"
                                        value={ajustesLongBreak}
                                        onChange={(e) => setAjustesLongBreak(e.target.value)}
                                        disabled={!isCustomActive}
                                        className={`w-full bg-stone-900 border ${!isLongBreakValid ? 'border-red-500/50 focus:border-red-500' : 'border-amber-500/10 focus:border-amber-500'} px-2 py-1 text-center font-mono text-sm text-yellow-300 rounded focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                                        min="1"
                                        max="60"
                                      />
                                      <span className="text-[8px] text-stone-500 font-mono mt-1">1-60 min</span>
                                    </div>
                                  </div>

                                  {/* Validation Warning if any is invalid */}
                                  {!isFormValid && isCustomActive && (
                                    <div className="text-[10px] text-red-400 font-serif text-center">
                                      Por favor, insira valores dentro dos limites indicados.
                                    </div>
                                  )}

                                  {/* Save Button */}
                                  <button
                                    type="button"
                                    disabled={!isFormValid || !isCustomActive}
                                    onClick={() => {
                                      const parsedFocus = parseInt(ajustesFocus);
                                      const parsedShort = parseInt(ajustesShortBreak);
                                      const parsedLong = parseInt(ajustesLongBreak);

                                      setGameState(prev => ({
                                        ...prev,
                                        pomodoroSettings: {
                                          ...prev.pomodoroSettings,
                                          focusDuration: parsedFocus,
                                          shortBreakDuration: parsedShort,
                                          longBreakDuration: parsedLong,
                                        }
                                      }));

                                      if (!isRunning && !isBreakActive) {
                                        setTimeLeft(parsedFocus * 60);
                                      }

                                      setIsCustomTime(true);
                                      setIsTimerSettingsModalOpen(false);
                                    }}
                                    className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-amber-200 font-serif text-xs font-bold uppercase tracking-widest rounded transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    Salvar Personalizado
                                  </button>
                                </div>
                              </div>

                              {/* Section 3: Autostart preferences - ALWAYS VISIBLE & FUNCTIONAL */}
                              <div className="pt-2 border-t border-amber-500/10 space-y-2">
                                <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-amber-500">
                                  Opções Adicionais
                                </h3>

                                {/* Auto-Start Break */}
                                <div className="flex items-center justify-between gap-4 bg-stone-900/20 p-2.5 rounded border border-amber-500/5">
                                  <div className="max-w-[80%] text-left">
                                    <span className="text-[11px] font-serif font-bold text-amber-100/90 block">
                                      Auto-Iniciar Descanso
                                    </span>
                                    <span className="text-[9px] text-amber-100/50 leading-tight block">
                                      Inicia o descanso automaticamente ao fim da sessão de foco
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGameState(prev => ({
                                        ...prev,
                                        pomodoroSettings: {
                                          ...prev.pomodoroSettings,
                                          autoStartBreak: !prev.pomodoroSettings.autoStartBreak,
                                        }
                                      }));
                                    }}
                                    className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                                  >
                                    {gameState.pomodoroSettings.autoStartBreak ? (
                                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                                    ) : (
                                      <ToggleLeft className="w-8 h-8 text-stone-600" />
                                    )}
                                  </button>
                                </div>

                                {/* Auto-Start Focus */}
                                <div className="flex items-center justify-between gap-4 bg-stone-900/20 p-2.5 rounded border border-amber-500/5">
                                  <div className="max-w-[80%] text-left">
                                    <span className="text-[11px] font-serif font-bold text-amber-100/90 block">
                                      Auto-Iniciar Foco
                                    </span>
                                    <span className="text-[9px] text-amber-100/50 leading-tight block">
                                      Inicia a próxima sessão de foco automaticamente ao fim do descanso
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGameState(prev => ({
                                        ...prev,
                                        pomodoroSettings: {
                                          ...prev.pomodoroSettings,
                                          autoStartFocus: !prev.pomodoroSettings.autoStartFocus,
                                        }
                                      }));
                                    }}
                                    className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                                  >
                                    {gameState.pomodoroSettings.autoStartFocus ? (
                                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                                    ) : (
                                      <ToggleLeft className="w-8 h-8 text-stone-600" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </Modal>
                        );
                      })()}

                      {/* TRANSIT CONTROL PLAYER TRIGGERS */}
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          {isBreakActive ? (
                            <button
                              onClick={skipBreak}
                              className="flex-1 py-3 text-sm font-serif font-black uppercase text-stone-950 bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300 hover:from-green-400 hover:to-emerald-200 border border-emerald-400 rounded tracking-widest hover:scale-101 active:scale-99 cursor-pointer select-none shadow-[2px_4px_rgba(16,185,129,0.3)] transition-all shadow-lg text-center font-bold animate-pulse"
                            >
                              Encerrar Pausa
                            </button>
                          ) : !isRunning ? (
                            <button
                              onClick={startQuestTimer}
                              className="flex-1 py-3 text-sm font-serif font-black uppercase text-stone-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-yellow-400 hover:to-amber-200 border border-amber-400 rounded tracking-widest hover:scale-101 active:scale-99 cursor-pointer select-none shadow-[2px_4px_rgba(200,162,60,0.3)] transition-all shadow-lg text-center"
                            >
                              ▶ Iniciar Missão de Foco
                            </button>
                          ) : (
                            <div className="flex-1 flex flex-col gap-2">
                              <div className="flex gap-2">
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
                              <button
                                onClick={() => {
                                  document.documentElement.requestFullscreen().catch((err) => {
                                    console.warn("Fullscreen API not supported or blocked:", err);
                                  });
                                  setSessionConfig(prev => ({ ...prev, isFocusMode: true }));
                                }}
                                className="w-full py-2.5 text-xs font-serif font-bold uppercase text-amber-100/50 hover:text-amber-100/80 bg-stone-900/20 hover:bg-stone-900/55 border border-amber-500/15 hover:border-amber-500/30 rounded tracking-widest transition-all cursor-pointer select-none text-center flex items-center justify-center gap-1.5"
                              >
                                <span>⛶</span>
                                <span>Tela Cheia</span>
                              </button>
                            </div>
                        )}
                        </div>
                      </div>

                    </div>

                    {/* ACTIVE CONTRATS / QUESTS OVERVIEW */}
                    {(() => {
                      const state = gameState;
                      const dailies = getRotatingDailyQuests(3).map((quest) => ({
                        ...quest,
                        progress: quest.getProgress(state),
                      }));
                      const guilds = guildQuests.map((quest) => ({
                        ...quest,
                        progress: quest.getProgress(state),
                      }));

                      const unclaimedGuilds = guilds.filter(g => !isQuestClaimed(state, g.id));
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
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-stone-950/30 px-2.5 py-1.5 rounded border border-amber-500/5">
                            <span className="text-[10px] uppercase font-serif font-black tracking-widest text-[#E2B054] flex items-center gap-1.5 leading-none">
                              📜 MURAL DE CONTRATOS ATIVOS
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('quests');
                                setIsMobileSidebarOpen(false);
                              }}
                              className="text-[9px] font-serif font-bold uppercase tracking-wider text-amber-500 hover:text-amber-300 transition-colors flex items-center gap-1 hover:underline cursor-pointer sm:self-auto self-end"
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
                                  const isClaimed = isQuestClaimed(state, q.id);
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
                                          {q.summary || q.name}
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
                  <section className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.7)] hidden lg:flex lg:col-span-5 flex-col justify-between">
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
                      <CharacterScreen
                        character={{
                          charName: gameState.charName,
                          charClass: gameState.charClass,
                          equippedTitle: gameState.equippedTitle,
                          streak: gameState.streak,
                          bestStreak: gameState.bestStreak,
                          totalMinutes: gameState.totalMinutes,
                          combatLevel: gameState.combatLevel,
                          combatXP: gameState.combatXP,
                          hp: gameState.hp,
                          maxHp: gameState.maxHp,
                        }}
                        equippedEquipment={gameState.equippedEquipment || [null, null, null]}
                        activeBuffs={gameState.inventory.filter(i => ['DoubleLoot', 'FocusElixir', 'CrystalClarity', 'RuneFortune', 'StreakShield'].includes(i.buff))}
                        onUnequipItem={handleUnequipItem}
                        ownedTitles={gameState.ownedTitles || []}
                        onEquipTitle={handleEquipTitle}
                      />

                      {/* QUICK SKILLS STATUS LISTS */}
                      <QuickSkillsGrid
                        skills={gameState.skills}
                        selectedSkillIdx={sessionConfig.selectedSkillIdx}
                        onSelectSkill={(idx) => {
                          setSessionConfig(prev => ({ ...prev, selectedSkillIdx: idx }));
                        }}
                        onManageSkills={() => setIsSkillsModalOpen(true)}
                        onInspectSkill={(idx, name) => {
                          setInspectingSkillIdx(idx);
                          setEditSkillName(name);
                        }}
                        addSystemLog={addSystemLog}
                        isRunning={isRunning}
                        isBreakActive={isBreakActive}
                      />

                      {/* COLLECTED BAG ITEMS VIEWPORT */}
                      <InventoryScreen
                        inventory={gameState.inventory}
                        inspectingItem={inspectingItem}
                        onInspectItem={inspectItem}
                        onCloseInspection={closeInspection}
                        onEquipItem={handleEquipItem}
                        onSellItem={handleSellItem}
                        onDiscardItem={handleDiscardItem}
                      />

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

              {activeTab === 'character' && (
                <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] space-y-6">
                  <div className="flex justify-between items-center pb-2.5 border-b border-amber-500/10">
                    <h3 className="font-serif font-black text-xs md:text-sm text-amber-400 tracking-wider uppercase flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-500" /> Ficha de Personagem (Status)
                    </h3>
                    <button
                      onClick={() => setIsSkillsModalOpen(true)}
                      className="text-[10px] uppercase font-bold text-amber-400 hover:text-amber-200 border border-amber-500/20 px-2 py-0.5 rounded cursor-pointer"
                    >
                      + Gerenciar Habilidades
                    </button>
                  </div>
                  <CharacterScreen
                    character={{
                      charName: gameState.charName,
                      charClass: gameState.charClass,
                      equippedTitle: gameState.equippedTitle,
                      streak: gameState.streak,
                      bestStreak: gameState.bestStreak,
                      totalMinutes: gameState.totalMinutes,
                      combatLevel: gameState.combatLevel,
                      combatXP: gameState.combatXP,
                      hp: gameState.hp,
                      maxHp: gameState.maxHp,
                    }}
                    equippedEquipment={gameState.equippedEquipment || [null, null, null]}
                    activeBuffs={gameState.inventory.filter(i => ['DoubleLoot', 'FocusElixir', 'CrystalClarity', 'RuneFortune', 'StreakShield'].includes(i.buff))}
                    onUnequipItem={handleUnequipItem}
                    ownedTitles={gameState.ownedTitles || []}
                    onEquipTitle={handleEquipTitle}
                  />
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] space-y-6">
                  <div className="pb-2.5 border-b border-amber-500/10">
                    <h3 className="font-serif font-black text-xs md:text-sm text-amber-400 tracking-wider uppercase flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-500" /> Inventário de Equipamentos & Consumíveis
                    </h3>
                  </div>
                  <InventoryScreen
                    inventory={gameState.inventory}
                    inspectingItem={inspectingItem}
                    onInspectItem={inspectItem}
                    onCloseInspection={closeInspection}
                    onEquipItem={handleEquipItem}
                    onSellItem={handleSellItem}
                    onDiscardItem={handleDiscardItem}
                  />
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] space-y-6">
                  <div className="pb-2.5 border-b border-amber-500/10 flex items-center justify-between">
                    <h3 className="font-serif font-black text-xs md:text-sm text-amber-400 tracking-wider uppercase flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400" /> Habilidades Ativas & Subskills
                      <button
                        type="button"
                        onClick={() => setIsPrestigeInfoOpen(true)}
                        className="w-4.5 h-4.5 rounded-full border border-amber-500/30 text-amber-400/80 hover:text-amber-200 flex items-center justify-center text-[10px] font-bold hover:bg-amber-500/10 transition-all cursor-pointer shrink-0 ml-1"
                        title="Saiba mais sobre Prestígio"
                      >
                        ?
                      </button>
                    </h3>
                  </div>
                  <div className="max-h-none">
                    <SkillsScreen
                      skills={gameState.skills}
                      onAddTagToSkill={handleAddTagToSkill}
                      onRemoveTagFromSkill={handleRemoveTagFromSkill}
                      onAddCustomSkill={handleQuickAddSkill}
                      onDeleteSkill={handleDeleteSkillIndex}
                      onPrestigeSkill={handlePrestigeSkill}
                      onRenameSkill={handleRenameSkill}
                    />
                  </div>

                  {/* Prestige Explanation Modal */}
                  <Modal
                    isOpen={isPrestigeInfoOpen}
                    onClose={() => setIsPrestigeInfoOpen(false)}
                    title="Mecânica de Prestígio"
                    variant="amber"
                  >
                    <div className="space-y-4 font-serif text-amber-100/90 py-1">
                      <div className="flex items-center gap-2 mb-1 border-b border-amber-500/10 pb-2">
                        <span className="text-xl">👑</span>
                        <span className="text-amber-300 font-bold uppercase tracking-wider text-xs">Caminho do Heroísmo Infinito</span>
                      </div>
                      <p className="text-xs leading-relaxed font-sans normal-case">
                        Habilidades evoluem à medida que você ganha XP. Cada foco concluído com sucesso alimenta a habilidade selecionada no cronômetro.
                      </p>
                      <p className="text-xs leading-relaxed font-sans normal-case">
                        Ao alcançar o <strong className="text-amber-300">Nível 99</strong>, você poderá ativar o <strong className="text-amber-300">Prestígio</strong>. Isso reiniciará o progresso de nível dessa habilidade de volta para 1, mas em troca você ganhará um multiplicador permanente e heróico de <strong className="text-amber-300">+25% de XP extra permanente</strong> acumulável para acelerar toda a sua evolução futura nessa habilidade!
                      </p>
                    </div>
                  </Modal>
                </div>
              )}

              {activeTab === 'habits' && (
                <HabitsTab
                  habits={habitsList}
                  onTriggerHabit={onTriggerHabit}
                  onAddHabit={onAddHabit}
                  onEditHabit={onEditHabit}
                  onDeleteHabit={onDeleteHabit}
                />
              )}

              {activeTab === 'dailies' && (
                <DailiesTab
                  dailies={dailiesList}
                  onToggleDaily={onToggleDaily}
                  onToggleChecklistItem={onToggleDailyChecklistItem}
                  onAddDaily={onAddDaily}
                  onEditDaily={onEditDaily}
                  onDeleteDaily={onDeleteDaily}
                />
              )}

              {activeTab === 'todos' && (
                <TodosTab
                  todos={todosList}
                  onToggleTodo={onToggleTodo}
                  onToggleChecklistItem={onToggleTodoChecklistItem}
                  onAddTodo={onAddTodo}
                  onEditTodo={onEditTodo}
                  onDeleteTodo={onDeleteTodo}
                  todayDate={gameState.todayDate}
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
                  <QuestsTab
                    dailyQuests={dailyQuestsList}
                    guildQuests={guildQuestsList}
                    onClaimQuestReward={handleClaimQuestRewards}
                  />
                </div>
              )}

              {activeTab === 'shop' && (
                <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2.5 border-b border-amber-500/10 mb-4">
                    <h3 className="font-serif font-black text-xs md:text-sm text-amber-400 tracking-wider uppercase flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-500" /> Bazar de Mystara (Loja)
                    </h3>
                    
                    {/* Retro RPG Sub-Tabs Selector */}
                    <div className="flex bg-stone-950/40 p-1 rounded border border-amber-500/10 font-serif">
                      <button
                        onClick={() => setShopSubTab('items')}
                        className={`px-3 py-1 text-[10px] uppercase font-bold rounded tracking-wider transition-all cursor-pointer ${
                          shopSubTab === 'items'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'text-stone-500 hover:text-stone-300 border border-transparent'
                        }`}
                      >
                        Consumíveis & Equipamentos
                      </button>
                      <button
                        onClick={() => setShopSubTab('titles')}
                        className={`px-3 py-1 text-[10px] uppercase font-bold rounded tracking-wider transition-all cursor-pointer ${
                          shopSubTab === 'titles'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'text-stone-500 hover:text-stone-300 border border-transparent'
                        }`}
                      >
                        Selos & Títulos Reais
                      </button>
                    </div>
                  </div>

                  {shopSubTab === 'items' ? (
                    <ShopTab gold={gameState.gold} inventory={gameState.inventory} onBuyItem={handleBuyGoblinShopItem} />
                  ) : (
                    <TitleShop
                      state={gameState}
                      onBuyTitle={handleBuyTitle}
                      onClaimAchievementTitle={handleClaimAchievementTitle}
                    />
                  )}
                </div>
              )}

              {activeTab === 'titles' && (
                <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
                  <h3 className="font-serif font-black text-xs md:text-sm text-[#f43f5e] tracking-wider uppercase mb-4 flex items-center gap-2 pb-2.5 border-b border-amber-500/10">
                    <Award className="w-4 h-4 text-[#f43f5e]" /> Brasões & Títulos de Foco
                  </h3>
                  <TitleSelector
                    ownedTitles={gameState.ownedTitles || []}
                    equippedTitle={gameState.equippedTitle || null}
                    onEquipTitle={handleEquipTitle}
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

              {activeTab === 'logs' && (
                <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
                  <h3 className="font-serif font-black text-xs md:text-sm text-amber-400 tracking-wider uppercase mb-4 flex items-center gap-2 pb-2.5 border-b border-amber-500/10">
                    <Scroll className="w-4 h-4 text-amber-400" /> Registros Celestiais (Logs)
                  </h3>
                  <div className="bg-stone-950/90 text-amber-100/70 p-4 h-[420px] rounded-lg overflow-y-auto select-text border border-amber-500/10 shadow-inner">
                    <div className="space-y-2 text-xs font-mono">
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
                </div>
              )}
              
            </motion.div>
          </AnimatePresence>
          
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

              <SkillsScreen
                skills={gameState.skills}
                onAddTagToSkill={handleAddTagToSkill}
                onRemoveTagFromSkill={handleRemoveTagFromSkill}
                onAddCustomSkill={handleQuickAddSkill}
                onDeleteSkill={handleDeleteSkillIndex}
                onPrestigeSkill={handlePrestigeSkill}
                onRenameSkill={handleRenameSkill}
              />

              <div className="p-6 pt-0">
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

      {/* CHOOSE ACTIVE SKILL MODAL */}
      <SkillSelectorModal
        isOpen={isSkillSelectorOpen}
        onClose={() => setIsSkillSelectorOpen(false)}
        skills={gameState.skills}
        selectedSkillIdx={sessionConfig.selectedSkillIdx}
        onSelectSkill={(idx) => setSessionConfig(prev => ({ ...prev, selectedSkillIdx: idx }))}
      />

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
                      defaultValue={gameState.pomodoroSettings.longBreakDuration ?? 15}
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


      {/* RELATÓRIO DIÁRIO POPUP SYSTEM */}
      <AnimatePresence>
        {dailyReport && (
          <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 via-transparent to-transparent pointer-events-none" />
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: -30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 120 }}
              className="bg-stone-950 border-2 border-amber-500 animate-level-up-glow max-w-sm sm:max-w-md w-full rounded-2xl shadow-[0_0_50px_rgba(226,176,84,0.35)] overflow-hidden font-sans relative"
              id="daily-report-modal"
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

              <div className="relative z-10 p-6 sm:p-8 text-center space-y-6">
                {/* Heroic Centralized Icon */}
                <div className="flex justify-center pt-2">
                  <div className="w-20 h-20 bg-stone-900 border-2 border-amber-500 rounded-full flex items-center justify-center shadow-lg relative bg-gradient-to-b from-stone-800 to-stone-950">
                    <span className="text-4xl animate-bounce">☀️</span>
                    <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping" />
                  </div>
                </div>

                {/* Header */}
                <div className="space-y-1">
                  <h3 className="text-[10px] sm:text-xs uppercase font-serif tracking-widest text-[#E2B054] font-black">
                    Um novo dia começa.
                  </h3>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wider text-amber-300 drop-shadow-[0_2px_10px_rgba(226,176,84,0.4)]">
                    RELATÓRIO DIÁRIO
                  </h2>
                </div>

                {/* Daily Login Reward Card */}
                <div className="bg-stone-900/60 border border-amber-500/20 rounded-xl p-4 space-y-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.02] to-transparent pointer-events-none" />
                  <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                    Tesouro Recebido
                  </span>
                  <div className="flex items-center justify-center gap-2 text-3xl font-serif font-black text-amber-300 drop-shadow-[0_2px_5px_rgba(226,176,84,0.3)]">
                    💎 +{dailyReport.rewardAmount} GP
                  </div>
                  <p className="text-xs text-amber-100/60 font-serif">
                    O Santuário recompensa quem retorna à jornada.
                  </p>
                </div>

                {/* Report Sections */}
                <div className="space-y-4 text-left font-serif">
                  {/* Streak Summary */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400/50 font-bold block">
                      Sequência de Dias (Streak)
                    </span>
                    {dailyReport.streakLost ? (
                      <p className="text-xs text-red-300 leading-relaxed bg-red-950/20 border border-red-500/10 rounded-lg p-2.5">
                        Sua chama se apagou por um dia. Hoje é uma nova oportunidade para reacendê-la.
                      </p>
                    ) : dailyReport.streakProtected ? (
                      <p className="text-xs text-[#fff3c6] leading-relaxed bg-[#fff3c6]/5 border border-[#fff3c6]/20 rounded-lg p-2.5 flex items-center gap-2">
                        <span>🛡️</span> O Escudo do Santuário protegeu sua sequência.
                      </p>
                    ) : (
                      <div className="text-xs text-amber-100/90 leading-relaxed bg-amber-500/[0.02] border border-amber-500/10 rounded-lg p-2.5 flex items-center justify-center">
                        <span className="font-mono font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                          🔥 Sua chama permanece acesa há {dailyReport.currentStreak} {dailyReport.currentStreak === 1 ? 'dia' : 'dias'}.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tasks Summary */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400/50 font-bold block">
                      Tarefas Diárias de Ontem
                    </span>
                    {dailyReport.allDailiesCompleted ? (
                      <p className="text-xs text-[#fff3c6] leading-relaxed bg-[#fff3c6]/5 border border-[#fff3c6]/20 rounded-lg p-2.5">
                        Incrível! Todas as suas tarefas de ontem foram concluídas.
                      </p>
                    ) : dailyReport.missedDailiesCount > 0 ? (
                      <div className="text-xs text-amber-100/90 leading-relaxed bg-stone-900/40 border border-stone-800 rounded-lg p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                          <span className="text-[#E2B054]">Dailies Incompletas:</span>
                          <span className="text-red-400">{dailyReport.missedDailiesCount}</span>
                        </div>
                        <p className="text-red-300 leading-relaxed text-[11px] border-t border-stone-800/60 pt-1.5">
                          Algumas missões ficaram pelo caminho. Você sofreu <span className="text-red-400 font-bold font-mono">-{dailyReport.damageTaken} HP</span>.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-100/50 leading-relaxed italic bg-stone-900/30 border border-stone-800/40 rounded-lg p-2.5 text-center">
                        Nenhuma tarefa diária pendente de ontem.
                      </p>
                    )}
                  </div>
                </div>

                {/* Continue button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setDailyReport(null);
                      if (!muteSfx) sound.playCoins();
                    }}
                    className="w-full px-8 py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-stone-950 font-serif font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EPIC LEVEL UP & SKILL EVOLUTION POPUP SYSTEM */}
      <AnimatePresence>
        {activeLevelUp !== null && (() => {
          const active = activeLevelUp;
          if (active.type === 'combat') {
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
                        {active.charName.toUpperCase()} ALCANÇOU O <span className="text-[#E2B054] text-lg sm:text-xl font-bold block sm:inline mt-1 sm:mt-0">NÍVEL {active.newLevel}</span>
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
                        onClick={dismissCurrentLevelUp}
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
                        <span className="text-4xl animate-bounce">{active.emoji}</span>
                        <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-[10px] sm:text-xs uppercase font-serif tracking-widest text-[#34D399] font-black">
                        Novo patamar alcançado.
                      </h3>
                      <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wider text-emerald-400 drop-shadow-[0_2px_10px_rgba(52,211,153,0.35)]">
                        MAESTRIA APRIMORADA
                      </h2>
                      <p className="text-base sm:text-lg font-serif font-black text-[#34D399] leading-tight mt-1">
                        {active.skillName}
                      </p>
                      <p className="text-sm sm:text-base font-serif font-semibold text-amber-200 mt-2">
                        alcançou o <span className="text-emerald-400 text-lg sm:text-xl font-black block sm:inline mt-1 sm:mt-0">Nível {active.newLevel}</span>
                      </p>
                      <div className="h-[2px] w-1/3 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mx-auto my-3" />
                      <p className="text-[11px] text-amber-100/50 font-serif italic max-w-xs mx-auto leading-normal">
                        Nenhum nível é concedido por acaso. Este foi conquistado minuto após minuto.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={dismissCurrentLevelUp}
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

      {/* Toast Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`pointer-events-auto p-4 rounded-lg shadow-xl border flex items-start gap-3 backdrop-blur-md ${
                toast.type === 'error'
                  ? 'bg-red-950/90 border-red-500/40 text-red-100'
                  : toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                  : 'bg-stone-900/90 border-amber-500/30 text-amber-100'
              }`}
            >
              <div className="flex-1 text-xs font-serif font-semibold leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-amber-100/40 hover:text-amber-100/80 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

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
