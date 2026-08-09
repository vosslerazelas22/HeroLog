import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, LogOut } from 'lucide-react';
import { CharacterState } from '../../types';
import { UseFocusSessionReturn } from './useFocusSession';
import { FocusOrb } from './FocusOrb';

interface FocusModeScreenProps {
  focusSession: UseFocusSessionReturn;
  setIsFocusMode: (mode: boolean) => void;
  muteSfx: boolean;
  sound: any;
  gameState: CharacterState;
  selectedSkillIdx: number;
  isWildernessChecked: boolean;
  isDungeonMode: boolean;
  dungeonSessions: number;
}

export function FocusModeScreen(props: FocusModeScreenProps) {
  const {
    focusSession,
    setIsFocusMode,
    muteSfx,
    sound,
    gameState,
    selectedSkillIdx,
    isWildernessChecked,
    isDungeonMode,
    dungeonSessions,
  } = props;

  const {
    timeLeft,
    isPaused,
    isFocusCompleted,
    setIsFocusCompleted,
    pauseCount,
    togglePauseQuest,
    completeFocusQuest,
  } = focusSession;

  const pauseButtonRef = useRef<HTMLButtonElement>(null);
  const hasAutoClaimedRef = useRef(false);

  // Auto-focus on the pause button upon entering Focus Mode for accessibility
  useEffect(() => {
    if (!isFocusCompleted) {
      setTimeout(() => {
        pauseButtonRef.current?.focus();
      }, 100);
    }
  }, [isFocusCompleted]);

  // Handle keyboard events (Space to toggle pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFocusCompleted) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePauseQuest();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePauseQuest, isFocusCompleted]);

  // Automatic transition when session completes in focus mode
  useEffect(() => {
    if (!isFocusCompleted || hasAutoClaimedRef.current) return;
    hasAutoClaimedRef.current = true;

    const handleAutoClaim = async () => {
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
      setIsFocusMode(false);
      setIsFocusCompleted(false);
      await completeFocusQuest();
      if (!muteSfx && sound?.playLevelUp) {
        sound.playLevelUp();
      }
    };

    handleAutoClaim();
  }, [
    isFocusCompleted,
    setIsFocusMode,
    setIsFocusCompleted,
    completeFocusQuest,
    muteSfx,
    sound,
  ]);

  if (isFocusCompleted) {
    return null;
  }

  const activeSkill = gameState.skills[selectedSkillIdx] || { name: 'Código Sagrado', emoji: '📚' };
  const skillName = activeSkill.name;
  const skillEmoji = activeSkill.emoji || '📚';

  // Format timeLeft
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleExitFocusMode = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFocusMode(false);
    setIsFocusCompleted(false);
  };

  return (
    <div
      id="focus-mode-container"
      className="fixed inset-0 bg-stone-950 bg-gradient-to-b from-stone-950 via-black to-stone-950 text-amber-100 flex flex-col justify-between p-6 sm:p-12 z-[9999] overflow-hidden select-none font-sans"
    >
      {/* Background magical pulse reflection */}
      <div className="absolute inset-0 bg-gradient-radial from-amber-500/5 via-transparent to-transparent opacity-40 animate-aura-pulsing pointer-events-none select-none z-0" />

      {/* Sparkling particle rain effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        {[...Array(15)].map((_, i) => {
          const shiftX = Math.floor(Math.random() * 200) - 100;
          const duration = 2 + Math.random() * 3;
          const delay = Math.random() * 2;
          const size = 5 + Math.floor(Math.random() * 7);
          const left = 10 + Math.floor(Math.random() * 80);
          return (
            <div
              key={i}
              className="absolute bottom-[-20px] text-amber-500/40 select-none pointer-events-none opacity-0 rising-spark flex items-center justify-center"
              style={{
                left: `${left}%`,
                '--shift-x': shiftX,
                '--rotate': Math.floor(Math.random() * 360),
                '--duration': `${duration}s`,
                animationDelay: `${delay}s`,
                fontSize: `${size}px`,
              } as React.CSSProperties}
            >
              ✦
            </div>
          );
        })}
      </div>

      {/* Top Bar: Active modes / skill indicator */}
      <div className="relative z-10 flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-pulse">{skillEmoji}</span>
          <div>
            <h3 className="text-xs uppercase font-serif tracking-widest text-[#E2B054] font-black">
              Câmara de Foco Ativa
            </h3>
            <h4 className="text-sm font-serif font-bold text-amber-100/80">
              {skillName}
            </h4>
          </div>
        </div>

        {/* Mode tags */}
        <div className="flex gap-2">
          {isDungeonMode && (
            <span className="px-2.5 py-1 text-[10px] font-mono tracking-wider text-purple-300 border border-purple-500/30 bg-purple-950/20 rounded-md uppercase font-bold">
              ⚔️ Masmorra ({dungeonSessions}/4)
            </span>
          )}
          {isWildernessChecked && (
            <span className="px-2.5 py-1 text-[10px] font-mono tracking-wider text-red-300 border border-red-500/30 bg-red-950/20 rounded-md uppercase font-bold">
              💀 Terra Selvagem
            </span>
          )}
        </div>
      </div>

      {/* Center Column: Big Counter */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center">
        <FocusOrb
          timeLeft={timeLeft}
          totalSeconds={gameState.pomodoroSettings.focusDuration * 60}
          isRunning={focusSession.isRunning}
          isPaused={isPaused}
          isDungeonMode={isDungeonMode}
          isWildernessMode={isWildernessChecked}
          size="fullscreen"
        />
      </div>

      {/* Bottom Bar: Action Controls */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-between items-center w-full border-t border-amber-500/10 pt-6">
        <div className="hidden md:block text-xs text-amber-100/20">
          ESPAÇO para pausar
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            ref={pauseButtonRef}
            onClick={togglePauseQuest}
            aria-label={isPaused ? 'Retomar Missão de Foco' : 'Pausar Missão de Foco'}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl border text-xs font-serif font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isPaused
                ? 'bg-purple-950/40 border-purple-400 text-purple-200 hover:bg-purple-900/30'
                : 'bg-stone-900/80 border-amber-500/30 text-amber-300 hover:border-amber-500/60'
            }`}
          >
            {isPaused ? 'Retomar' : 'Pausar'}
          </button>

          <button
            onClick={handleExitFocusMode}
            aria-label="Sair do Modo Imersão"
            className="flex-1 sm:flex-none px-6 py-2.5 bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-300 hover:border-stone-700 rounded-xl text-xs font-serif font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}
