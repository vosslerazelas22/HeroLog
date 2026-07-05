import React, { useState, useRef, useEffect } from 'react';
import { CharacterState, ActiveSession, BuffType } from '../../types';
import { SessionConfig, RewardsModalData } from './types';

export interface UseFocusSessionParams {
  gameState: CharacterState;
  setGameState: React.Dispatch<React.SetStateAction<CharacterState>>;
  sessionConfig: SessionConfig;
  onLog?: (msg: string, flash?: boolean) => void;
  muteSfx?: boolean;
  sound?: any;
}

export interface UseFocusSessionReturn {
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  isPaused: boolean;
  isFocusCompleted: boolean;
  setIsFocusCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  pauseCount: number;
  isGraceActive: boolean;
  graceSecondsLeft: number;
  isPlayerDead: boolean;
  setIsPlayerDead: React.Dispatch<React.SetStateAction<boolean>>;
  activeScreenEvent: any;
  rewardsModalData: RewardsModalData | null;
  rewardsStep: number;
  setRewardsStep: React.Dispatch<React.SetStateAction<number>>;
  startSession: () => void;
  cancelSession: () => void;
  togglePauseQuest: () => void;
  completeFocusQuest: () => Promise<void>;
  triggerTabAwayInfraction: () => void;
  handleReturnToFocusCap: () => void;
  respawnHero: () => void;
  closeRewardsModal: () => void;
  updateRewardsModalData: React.Dispatch<React.SetStateAction<RewardsModalData | null>>;
  enterBreak: (breakMinutes: number) => void;
  exitBreak: () => void;
}

export function useFocusSession(params: UseFocusSessionParams): UseFocusSessionReturn {
  const {
    gameState,
    setGameState,
    sessionConfig,
    onLog,
    muteSfx,
    sound,
  } = params;

  // Internal states
  const [timeLeft, setTimeLeft] = useState<number>(gameState.pomodoroSettings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFocusCompleted, setIsFocusCompleted] = useState<boolean>(false);
  const [pauseCount, setPauseCount] = useState<number>(0);
  const [isGraceActive, setIsGraceActive] = useState<boolean>(false);
  const [graceSecondsLeft, setGraceSecondsLeft] = useState<number>(3);
  const [isPlayerDead, setIsPlayerDead] = useState<boolean>(false);
  const [activeScreenEvent, setActiveScreenEvent] = useState<any>(null);
  const [rewardsModalData, setRewardsModalData] = useState<RewardsModalData | null>(null);
  const [rewardsStep, setRewardsStep] = useState<number>(1);

  // References for background intervals & timeouts
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const graceTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const focusEndTimeRef = useRef<number>(0);

  // Synchronized refs for config & state to prevent stale interval closures
  const isPausedRef = useRef(isPaused);
  const isRunningRef = useRef(isRunning);
  const isGraceActiveRef = useRef(isGraceActive);
  const isPlayerDeadRef = useRef(isPlayerDead);
  const configRef = useRef(sessionConfig);
  const focusDurationRef = useRef(gameState.pomodoroSettings.focusDuration);

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { isGraceActiveRef.current = isGraceActive; }, [isGraceActive]);
  useEffect(() => { isPlayerDeadRef.current = isPlayerDead; }, [isPlayerDead]);
  useEffect(() => { configRef.current = sessionConfig; }, [sessionConfig]);
  useEffect(() => { focusDurationRef.current = gameState.pomodoroSettings.focusDuration; }, [gameState.pomodoroSettings.focusDuration]);

  // Sync timeLeft when focusDuration changes and the session is not running and break is not active
  useEffect(() => {
    if (!isRunning && !isGraceActive) {
      setTimeLeft(gameState.pomodoroSettings.focusDuration * 60);
    }
  }, [gameState.pomodoroSettings.focusDuration, isRunning, isGraceActive]);

  // Safely cleanup background loops
  const safelyClearTimerLoops = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (eventIntervalRef.current) clearInterval(eventIntervalRef.current);
    if (graceTimerIntervalRef.current) clearInterval(graceTimerIntervalRef.current);
  };

  useEffect(() => {
    return () => safelyClearTimerLoops();
  }, []);

  // Resume active session on mount
  useEffect(() => {
    try {
      const data = localStorage.getItem('herolog_active_session');
      if (data) {
        const session = JSON.parse(data) as ActiveSession;
        if (session && session.isActive && session.endTime > Date.now()) {
          const endTime = session.endTime;
          focusEndTimeRef.current = endTime;

          setIsRunning(true);
          setIsPaused(false);
          setIsGraceActive(false);
          setIsFocusCompleted(false);

          onLog?.(`⚔️ Recuperando portal rúnico! Jornada ativa restaurada com sucesso para a habilidade selecionada.`, true);

          triggerRandomAmbientEncounterScheduler();

          timerIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.round((endTime - now) / 1000));
            setTimeLeft(() => {
              if (remaining <= 0) {
                clearInterval(timerIntervalRef.current!);
                completeFocusQuest();
                return 0;
              }
              return remaining;
            });
          }, 1000);
        }
      }
    } catch (e) {
      console.error('Error recovering active session in hook:', e);
    }
  }, []);

  // Listen for visibility and window focus/blur for Wilderness infraction checks
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerTabAwayInfraction();
      } else {
        handleReturnToFocusCap();
      }
    };

    const handleWindowBlur = () => {
      triggerTabAwayInfraction();
    };

    const handleWindowFocus = () => {
      handleReturnToFocusCap();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Ambient Encounters Scheduler
  const triggerRandomAmbientEncounterScheduler = () => {
    if (eventIntervalRef.current) clearInterval(eventIntervalRef.current);
    eventIntervalRef.current = setInterval(() => {
      if (isPausedRef.current) return;

      const rolls = [
        { text: '⚡ Ondas Alfa Intensificadas! Bônus de +25% de XP nesta sessão.', multiplierType: 'xp' },
        { text: '💎 Sorte de Alquimista! Você encontrou pepitas místicas: Ouro amplificado.', multiplierType: 'gold' },
        { text: '📚 Sopro de Inspiração Filosófica! Recompensa bônus garantida.', multiplierType: 'instant' }
      ];

      if (Math.random() < 0.3) {
        const event = rolls[Math.floor(Math.random() * rolls.length)];
        setActiveScreenEvent(event);
        onLog?.(`✨ Evento: ${event.text}`, true);
        if (!muteSfx && sound?.playCoins) sound.playCoins();

        setTimeout(() => {
          setActiveScreenEvent(null);
        }, 15000);
      }
    }, 45000);
  };

  // Start study session
  const startSession = () => {
    if (gameState.skills.length === 0) {
      onLog?.('❌ Impeditivo: Você precisa cadastrar e selecionar uma habilidade antes de iniciar sua jornada.', false);
      return;
    }

    safelyClearTimerLoops();
    setIsRunning(true);
    setIsPaused(false);
    setPauseCount(0);
    setIsPlayerDead(false);
    setIsGraceActive(false);
    setIsFocusCompleted(false);
    setTimeLeft(focusDurationRef.current * 60);

    const activeSkillName = gameState.skills[configRef.current.selectedSkillIdx]?.name || 'Código Sagrado';
    onLog?.(`⚔️ Jornada de Foco Ativada: Canalizando forças mentais focando em "${activeSkillName}" por ${focusDurationRef.current}m!`, true);

    if (configRef.current.isWildernessChecked) {
      onLog?.('💀 ALERTA DE PERIGO: Adentraste a Terra Selvagem (Wilderness)! Não minimizes esta janela ou sofrerás Morte Cognitiva.', true);
    }

    if (!muteSfx && sound?.playFocusBell) sound.playFocusBell();

    triggerRandomAmbientEncounterScheduler();

    const endTime = Date.now() + focusDurationRef.current * 60 * 1000;
    focusEndTimeRef.current = endTime;

    const activeSession: ActiveSession = {
      isActive: true,
      skillIdx: configRef.current.selectedSkillIdx,
      duration: focusDurationRef.current * 60 * 1000,
      endTime: endTime,
      startTime: Date.now(),
      isDungeon: configRef.current.isDungeonMode,
      dungeonStep: configRef.current.dungeonSessions,
      isWilderness: configRef.current.isWildernessChecked,
    };
    localStorage.setItem('herolog_active_session', JSON.stringify(activeSession));

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((endTime - now) / 1000));

      setTimeLeft(() => {
        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current!);
          completeFocusQuest();
          return 0;
        }
        return remaining;
      });
    }, 1000);
  };

  // Cancel / Abandon study session
  const cancelSession = () => {
    safelyClearTimerLoops();
    setTimeLeft(focusDurationRef.current * 60);
    setIsRunning(false);
    setIsPaused(false);
    setIsGraceActive(false);
    setActiveScreenEvent(null);
    localStorage.removeItem('herolog_active_session');
    onLog?.('⚠️ Missão abandonada tragicamente pelo aventureiro.');
  };

  // Complete Study Session successfully
  const completeFocusQuest = async () => {
    if (configRef.current.isFocusMode && !isFocusCompleted) {
      safelyClearTimerLoops();
      setIsRunning(false);
      setIsPaused(false);
      setIsGraceActive(false);
      setActiveScreenEvent(null);
      localStorage.removeItem('herolog_active_session');
      setIsFocusCompleted(true);
      return;
    }

    safelyClearTimerLoops();
    setIsRunning(false);
    setIsPaused(false);
    setIsGraceActive(false);
    setActiveScreenEvent(null);
    setTimeLeft(focusDurationRef.current * 60);
    localStorage.removeItem('herolog_active_session');

    const currentSkillIdx = configRef.current.selectedSkillIdx;
    const studiedMinutes = focusDurationRef.current;
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
      if (configRef.current.isWildernessChecked) titleXpAdd += 0.25;
    }
    if (eqTitleId === 'DUNGEON_LORD') {
      if (configRef.current.isDungeonMode) titleXpAdd += 0.15;
    }
    if (eqTitleId === 'RAID_VETERAN') {
      if (configRef.current.isDungeonMode) { titleXpAdd += 0.25; titleGoldAdd += 0.20; }
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
      if (configRef.current.isWildernessChecked) titleXpAdd += 0.15;
    }
    if (eqTitleId === 'CELESTIAL') { titleXpAdd += 0.20; titleGoldAdd += 0.15; }
    if (eqTitleId === 'THUNDERSTRUCK') {
      if (configRef.current.isWildernessChecked) titleXpAdd += 0.25;
      titleGoldAdd += 0.10;
    }
    if (eqTitleId === 'HAUNTED') { titleXpAdd += 0.10; titleGoldAdd += 0.20; }
    if (eqTitleId === 'BLOOD_FORGED') {
      if (configRef.current.isDungeonMode) { titleXpAdd += 0.20; titleGoldAdd += 0.20; }
    }

    xpMultiplier += titleXpAdd;
    goldMultiplier += titleGoldAdd;

    // Class perks
    if (gameState.charClass === 'Mage') xpMultiplier += 0.20;
    if (gameState.charClass === 'Warrior') goldMultiplier += 0.20;

    // Combo system boosts
    const comboBoost = Math.min(gameState.combo * 0.05, 0.50);
    xpMultiplier += comboBoost;

    // Active random events
    if (activeScreenEvent?.multiplierType === 'xp') xpMultiplier += 0.25;
    if (activeScreenEvent?.multiplierType === 'gold') goldMultiplier += 0.50;

    // Wilderness survival bonuses (+25% extras)
    if (configRef.current.isWildernessChecked) {
      xpMultiplier += 0.25;
      goldMultiplier += 0.25;
    }

    // Dungeon Run rewards (+50% XP per minute every session)
    if (configRef.current.isDungeonMode) {
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

    // Equipment Slots Active Boosts
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

    // Random Loot drops
    const landedLoots: { name: string; emoji: string }[] = [];
    const rollCount = configRef.current.isDungeonMode ? 4 : 1;

    for (let r = 0; r < rollCount; r++) {
      let thresholdChance = configRef.current.isDungeonMode ? 0.40 : (studiedMinutes >= 90 ? 0.70 : studiedMinutes >= 50 ? 0.45 : 0.25);
      thresholdChance = Math.min(0.95, thresholdChance * lootRateMultiplier);
      if (Math.random() < thresholdChance) {
        const lootCatalog = configRef.current.isDungeonMode 
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

    // Title drop check
    let baseTitleChance = configRef.current.isDungeonMode ? 0.05 : (studiedMinutes >= 50 ? 0.03 : 0.01);
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
          return configRef.current.isWildernessChecked;
        }
        if (t.id === 'BLOOD_FORGED') {
          return configRef.current.isDungeonMode;
        }
        return true;
      });

      if (filteredPool.length > 0) {
        droppedTitle = filteredPool[Math.floor(Math.random() * filteredPool.length)];
        setTimeout(() => {
          onLog?.(`✨ SORTUDO UNMISSABLE: O reino abençoou sua constância e você dropou o TÍTULO RARO [${droppedTitle?.name}]!`, true);
        }, 180);
      }
    }

    // Dungeon Run milestone progression calculation
    let dungeonClearGoldBonus = 0;
    if (configRef.current.isDungeonMode) {
      if (configRef.current.dungeonSessions + 1 >= 4) {
        dungeonClearGoldBonus = 2500;
      }
    }

    setRewardsStep(1);

    setRewardsModalData({
      visible: true,
      skillName: activeSkillName,
      skillIdx: currentSkillIdx,
      xpEarned: finalXP,
      goldEarned: finalGold + dungeonClearGoldBonus,
      notes: configRef.current.sessionNotes || '',
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
      isWildernessChecked: configRef.current.isWildernessChecked,
      isDungeonMode: configRef.current.isDungeonMode,
      pauseCount,
      comboBonusPercent: Math.round(comboBoost * 100),
    });
  };

  // Pause Focus Quest Pomodoro
  const togglePauseQuest = () => {
    if (!isRunning) return;

    if (isPaused) {
      setIsPaused(false);
      onLog?.(`⚔️ Jornada de Foco retomada do repouso profundo!`);

      const endTime = Date.now() + timeLeft * 1000;
      focusEndTimeRef.current = endTime;

      const activeSession: ActiveSession = {
        isActive: true,
        skillIdx: configRef.current.selectedSkillIdx,
        duration: focusDurationRef.current * 60 * 1000,
        endTime: endTime,
        startTime: Date.now() - (focusDurationRef.current * 60 - timeLeft) * 1000,
        isDungeon: configRef.current.isDungeonMode,
        dungeonStep: configRef.current.dungeonSessions,
        isWilderness: configRef.current.isWildernessChecked,
      };
      localStorage.setItem('herolog_active_session', JSON.stringify(activeSession));

      timerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((endTime - now) / 1000));
        setTimeLeft(() => {
          if (remaining <= 0) {
            clearInterval(timerIntervalRef.current!);
            completeFocusQuest();
            return 0;
          }
          return remaining;
        });
      }, 1000);
    } else {
      setIsPaused(true);
      setPauseCount(prev => prev + 1);
      clearInterval(timerIntervalRef.current!);
      localStorage.removeItem('herolog_active_session');
      onLog?.(`⏸️ Jornada de Foco congelada nas chagas da meditação.`);
    }
  };

  // Wilderness infractions handler
  const triggerTabAwayInfraction = () => {
    if (!isRunningRef.current || !configRef.current.isWildernessChecked || isPausedRef.current || isGraceActiveRef.current || isPlayerDeadRef.current) return;

    if (gameState.equippedTitle === 'DEATH-PROOF') {
      setIsPaused(true);
      onLog?.('🛡️ ESCUDO RÚNICO [DEATH-PROOF]: Você se distraiu e saiu do Santuário! A Morte Cognitiva foi convertida em Pausa por causa de o teu título equipado!', true);
      return;
    }

    setIsGraceActive(true);
    setGraceSecondsLeft(3);
    if (!muteSfx && sound?.playWildernessWarning) sound.playWildernessWarning();

    onLog?.('⚠️ INFRAÇÃO COGNITIVA: Você se distraiu e saiu do Santuário! Sombra da Morte se aproxima em 3s!', true);

    let count = 3;
    if (graceTimerIntervalRef.current) clearInterval(graceTimerIntervalRef.current);
    graceTimerIntervalRef.current = setInterval(() => {
      count--;
      setGraceSecondsLeft(count);
      if (!muteSfx && sound?.playWildernessWarning) sound.playWildernessWarning();

      if (count <= 0) {
        clearInterval(graceTimerIntervalRef.current!);
        setIsGraceActive(false);
        triggerCognitiveDeath();
      }
    }, 1000);
  };

  const triggerCognitiveDeath = () => {
    safelyClearTimerLoops();
    setIsPlayerDead(true);
    setIsRunning(false);
    setIsPaused(false);
    setIsGraceActive(false);
    setActiveScreenEvent(null);
    setTimeLeft(focusDurationRef.current * 60);
    localStorage.removeItem('herolog_active_session');

    if (!muteSfx && sound?.playDeath) sound.playDeath();
    onLog?.('💀 MORTE COGNITIVA: Você falhou no voto de silêncio e foi expulso da Terra Selvagem. Todas recompensas perdidas!', true);

    setGameState(prev => {
      const roll = Math.random();
      const saveChance = prev.charClass === 'Ranger' ? 0.15 : 0;

      let finalStreak = prev.streak;
      if (roll >= saveChance && prev.streak > 0) {
        finalStreak = 0;
        setTimeout(() => {
          onLog?.('⚠️ Sua streak de dias ininterruptos de foco colapsou de volta ao zero.', false);
        }, 100);
      } else if (prev.streak > 0) {
        setTimeout(() => {
          onLog?.('🏹 Esquiva Rápida! Sua agilidade como Ranger salvou sua streak de dias de expirar mesmo na falha da Wilderness!', true);
        }, 100);
      }
      return {
        ...prev,
        streak: finalStreak,
        combo: 0
      };
    });
  };

  const respawnHero = () => {
    setIsPlayerDead(false);
    setGameState(prev => {
      const nextLevel = Math.max(1, prev.combatLevel - 1);
      const goldPenalty = 50;
      const nextGold = Math.max(0, prev.gold - goldPenalty);

      return {
        ...prev,
        gold: nextGold,
        combatLevel: nextLevel,
        combatXP: 0,
      };
    });
    onLog?.('🛡️ Ressurgindo na capela do Santuário. Sacuda as cinzas da desatenção! Tua integridade (HP) foi totalmente restaurada, mas pagaste com o rebaixamento de 1 Nível de Combate e a perda de -50 GP.', true);
  };

  const handleReturnToFocusCap = () => {
    if (graceTimerIntervalRef.current) clearInterval(graceTimerIntervalRef.current);
    setIsGraceActive(false);
    onLog?.('🛡️ Retornou a tempo! A aura de estabilidade celestial te acolhe novamente.', true);
  };

  const closeRewardsModal = () => {
    setRewardsModalData(null);
  };

  const enterBreak = (breakMinutes: number) => {
    setTimeLeft(breakMinutes * 60);
    setIsRunning(false);
    setIsPaused(false);
  };

  const exitBreak = () => {
    setTimeLeft(focusDurationRef.current * 60);
    setIsRunning(false);
    setIsPaused(false);
  };

  return {
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
    updateRewardsModalData: setRewardsModalData,
    enterBreak,
    exitBreak,
  };
}
