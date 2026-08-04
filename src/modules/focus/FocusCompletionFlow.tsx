import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import { CharacterState } from '../../types';
import { RewardsModalData } from './types';

export type CompletionStep = 'streak' | 'summary' | 'loot' | 'notes';

interface FocusCompletionFlowProps {
  rewardsModalData: RewardsModalData;
  gameState: CharacterState;
  initialNotes?: string;
  onConfirm: (editedNotes: string, selectedTag: string) => void;
}

export function FocusCompletionFlow({
  rewardsModalData,
  gameState,
  initialNotes = '',
  onConfirm,
}: FocusCompletionFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [completionNotes, setCompletionNotes] = useState(initialNotes);
  const [completionTag, setCompletionTag] = useState('');

  const hasLoot = !!(
    rewardsModalData?.lootedItems?.length || rewardsModalData?.droppedTitleName
  );

  const shouldShowStreakCelebration =
    !!rewardsModalData && gameState.lastStudyDate !== new Date().toDateString();

  const completionSteps: CompletionStep[] = [
    ...(shouldShowStreakCelebration ? (['streak'] as const) : []),
    'summary',
    ...(hasLoot ? (['loot'] as const) : []),
    'notes',
  ];

  const currentStep = completionSteps[stepIndex] || 'summary';
  const isLastStep = stepIndex >= completionSteps.length - 1;

  const streakPreview = shouldShowStreakCelebration
    ? gameState.streak + 1
    : gameState.streak;

  const handleNext = () => {
    if (isLastStep) {
      onConfirm(completionNotes, completionTag);
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  return (
    <CompletionShell onNext={handleNext} isLastStep={isLastStep}>
      {currentStep === 'streak' && (
        <StreakCelebrationScreen streakPreview={streakPreview} />
      )}
      {currentStep === 'summary' && (
        <SessionSummaryScreen
          rewardsModalData={rewardsModalData}
          gameState={gameState}
        />
      )}
      {currentStep === 'loot' && (
        <LootDropScreen rewardsModalData={rewardsModalData} />
      )}
      {currentStep === 'notes' && (
        <SessionNotesScreen
          rewardsModalData={rewardsModalData}
          gameState={gameState}
          completionNotes={completionNotes}
          setCompletionNotes={setCompletionNotes}
          completionTag={completionTag}
          setCompletionTag={setCompletionTag}
        />
      )}
    </CompletionShell>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   WRAPPER VISUAL (CompletionShell)
   ────────────────────────────────────────────────────────────────────────── */

interface CompletionShellProps {
  children: React.ReactNode;
  onNext: () => void;
  isLastStep: boolean;
}

export function CompletionShell({
  children,
  onNext,
  isLastStep,
}: CompletionShellProps) {
  return (
    <div className="fixed inset-0 z-[10000] bg-quest-panel text-amber-50">
      <main className="min-h-dvh flex flex-col">
        <section className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">
          {children}
        </section>
        <footer className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={onNext}
            className="h-14 w-full rounded-lg font-black uppercase bg-[#c29544] hover:bg-[#d1a654] active:bg-[#b0863a] text-stone-950 border border-[#E9C37A] shadow-[0_4px_12px_rgba(194,149,68,0.25)] transition-all cursor-pointer font-serif tracking-widest text-sm"
          >
            {isLastStep ? 'RECEBER RECOMPENSAS' : 'Continuar'}
          </button>
        </footer>
      </main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   1. STREAK CELEBRATION SCREEN
   ────────────────────────────────────────────────────────────────────────── */

interface StreakCelebrationScreenProps {
  streakPreview: number;
}

export function StreakCelebrationScreen({
  streakPreview,
}: StreakCelebrationScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-sm w-full py-8 select-none animate-fadeIn">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-2xl animate-pulse" />
        <Flame className="w-24 h-24 text-orange-500 relative z-10 drop-shadow-[0_0_25px_rgba(249,115,22,0.6)] animate-bounce" />
      </div>

      <div className="space-y-2">
        <p className="text-amber-200/80 font-serif text-sm tracking-wide">
          Você manteve a chama acesa por mais um dia
        </p>
        <h1 className="text-5xl font-serif font-black text-amber-300 drop-shadow-[0_2px_12px_rgba(226,176,84,0.4)] tracking-tight">
          {streakPreview} {streakPreview === 1 ? 'dia' : 'dias'}
        </h1>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   2. SESSION SUMMARY SCREEN
   ────────────────────────────────────────────────────────────────────────── */

interface SessionSummaryScreenProps {
  rewardsModalData: RewardsModalData;
  gameState: CharacterState;
}

export function SessionSummaryScreen({
  rewardsModalData,
  gameState,
}: SessionSummaryScreenProps) {
  const getRank = () => {
    if (rewardsModalData.isWildernessChecked && rewardsModalData.pauseCount === 0) return 'S+';
    if (rewardsModalData.pauseCount === 0) return 'S';
    if (rewardsModalData.pauseCount === 1) return 'A';
    if (rewardsModalData.pauseCount <= 2) return 'B';
    if (rewardsModalData.pauseCount <= 4) return 'C';
    return 'F';
  };

  const getRankDescription = () => {
    if (rewardsModalData.isWildernessChecked && rewardsModalData.pauseCount === 0) return 'Sobrevivente Cognitivo — Lenda';
    if (rewardsModalData.pauseCount === 0) return 'Sem Pausas — Lendário';
    if (rewardsModalData.pauseCount === 1) return 'Pausa Única — Heróico';
    if (rewardsModalData.pauseCount <= 2) return 'Foco Estável — Exquisito';
    if (rewardsModalData.pauseCount <= 4) return 'Distração Parcial — Comum';
    return 'Pausas Constantes — Instável';
  };

  return (
    <div className="w-full max-w-md py-6 select-none animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-[#E2B054] font-serif font-black text-xl tracking-[0.15em] uppercase flex items-center justify-center gap-2">
          SESSÃO CONCLUÍDA
        </h2>
        <div className="mt-3 flex flex-col items-center justify-center gap-1">
          <span className="text-amber-400 font-extrabold text-sm tracking-widest font-serif drop-shadow-[0_2px_8px_rgba(226,176,84,0.35)]">
            ★ CLASSIFICAÇÃO {getRank()} ★
          </span>
          <span className="text-[10px] text-amber-100/40 font-mono tracking-widest uppercase">
            {getRankDescription()}
          </span>
        </div>
        <div className="w-[85%] mx-auto border-b border-amber-500/15 mt-4" />
      </div>

      {/* Grid of session stats */}
      <div className="w-[85%] mx-auto space-y-4 font-serif text-xs text-[#A2A7A6] tracking-wide mb-6">
        <div className="flex justify-between items-center py-2 border-b border-amber-500/5">
          <span className="uppercase text-left font-serif tracking-widest text-[#9F9F9F] text-[10px]">
            DURAÇÃO DA SESSÃO
          </span>
          <span className="text-[#E2B054] font-bold font-serif text-right">
            {rewardsModalData.durationMins} MIN
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-amber-500/5">
          <span className="uppercase text-left font-serif tracking-widest text-[#9F9F9F] text-[10px]">
            SEQUÊNCIA DE CHAMA
          </span>
          <span className="text-[#F14D2A] font-bold text-right flex items-center justify-end gap-1 font-serif">
            🔥 {gameState.streak || 1} {gameState.streak === 1 ? 'DIA' : 'DIAS'}
          </span>
        </div>

        {rewardsModalData.comboBonusPercent > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-amber-500/5 text-[#F14D2A]">
            <span className="uppercase text-left font-serif font-black tracking-widest text-[10px]">
              BÔNUS DE MULTIPLICADOR COMBO
            </span>
            <span className="font-bold text-right">
              +{rewardsModalData.comboBonusPercent}%
            </span>
          </div>
        )}

        {/* XP and GP Gains Box */}
        <div className="mt-6 bg-stone-900/40 border border-amber-500/10 rounded-lg p-4 grid grid-cols-2 gap-4 divide-x divide-amber-500/10 text-center">
          <div className="flex items-center justify-center">
            <div className="text-emerald-400 font-extrabold font-mono text-base drop-shadow-[0_2px_6px_rgba(52,211,153,0.25)]">
              ⚡ +{rewardsModalData.xpEarned} XP
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-[#E2B054] font-extrabold font-mono text-base drop-shadow-[0_2px_6px_rgba(226,176,84,0.25)]">
              💎 +{rewardsModalData.goldEarned + (rewardsModalData.dungeonClearGoldBonus || 0)} GP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   3. LOOT DROP SCREEN
   ────────────────────────────────────────────────────────────────────────── */

interface LootDropScreenProps {
  rewardsModalData: RewardsModalData;
}

export function LootDropScreen({ rewardsModalData }: LootDropScreenProps) {
  const lootedItems = rewardsModalData.lootedItems || [];
  const droppedTitleName = rewardsModalData.droppedTitleName;

  return (
    <div className="w-full max-w-md py-6 select-none animate-fadeIn">
      <div className="text-center mb-6">
        <span className="text-3xl animate-bounce inline-block filter drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
          🎁
        </span>
        <h2 className="text-purple-400 font-serif font-black text-lg md:text-xl tracking-[0.2em] uppercase mt-2">
          TESOURO CONQUISTADO
        </h2>
        <div className="w-[85%] mx-auto border-b border-purple-500/20 mt-4" />
      </div>

      <div className="w-[85%] mx-auto space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lootedItems.map((item, index) => {
            const isEspecial = item.rarity === 'especial';
            return (
              <div
                key={index}
                className={`bg-gradient-to-b ${
                  isEspecial
                    ? 'from-purple-950/30 via-stone-950 to-stone-950 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                    : 'from-stone-850/40 via-stone-950 to-stone-950 border-stone-800'
                } border p-3 rounded-lg text-left relative overflow-hidden select-none flex items-center gap-3`}
              >
                <span className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l ${isEspecial ? 'border-purple-500/40' : 'border-stone-700/40'}`} />
                <span className={`absolute top-0 right-0 w-1.5 h-1.5 border-t border-r ${isEspecial ? 'border-purple-500/40' : 'border-stone-700/40'}`} />
                <span className={`absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l ${isEspecial ? 'border-purple-500/40' : 'border-stone-700/40'}`} />
                <span className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r ${isEspecial ? 'border-purple-500/40' : 'border-stone-700/40'}`} />

                <div className={`text-3xl shrink-0 select-none filter ${isEspecial ? 'drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]' : ''}`}>
                  {item.emoji || '🎒'}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className={`font-bold text-xs md:text-sm tracking-wide uppercase font-serif truncate ${isEspecial ? 'text-purple-300' : 'text-stone-300'}`}>
                      {item.name}
                    </h3>
                    {isEspecial ? (
                      <span className="inline-block self-start sm:self-center px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[7px] font-mono font-bold uppercase tracking-widest text-purple-400 leading-none">
                        ★ ESPECIAL ★
                      </span>
                    ) : (
                      <span className="inline-block self-start sm:self-center px-1.5 py-0.5 bg-stone-850 border border-stone-700/50 rounded text-[7px] font-mono font-bold uppercase tracking-widest text-stone-500 leading-none">
                        COMUM
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-amber-100/50 font-serif italic truncate mt-1">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}

          {droppedTitleName && (
            <div className="bg-gradient-to-b from-amber-950/40 via-stone-950 to-stone-950 border-amber-500/40 shadow-[0_0_15px_rgba(226,176,84,0.15)] border p-3 rounded-lg text-left relative overflow-hidden select-none flex items-center gap-3">
              <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-amber-500/40" />
              <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-amber-500/40" />
              <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-amber-500/40" />
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-amber-500/40" />

              <div className="text-3xl shrink-0 select-none filter drop-shadow-[0_0_10px_rgba(226,176,84,0.4)]">
                {rewardsModalData.droppedTitleEmoji || '👑'}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="font-bold text-xs md:text-sm tracking-wide uppercase font-serif truncate text-amber-300">
                    {droppedTitleName}
                  </h3>
                  <span className="inline-block self-start sm:self-center px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[7px] font-mono font-bold uppercase tracking-widest text-amber-400 leading-none">
                    ★ TÍTULO RARO ★
                  </span>
                </div>
                <p className="text-[10px] text-amber-100/50 font-serif italic truncate mt-1">
                  Pode ser equipado na tela de Títulos.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   4. SESSION NOTES SCREEN
   ────────────────────────────────────────────────────────────────────────── */

interface SessionNotesScreenProps {
  rewardsModalData: RewardsModalData;
  gameState: CharacterState;
  completionNotes: string;
  setCompletionNotes: (notes: string) => void;
  completionTag: string;
  setCompletionTag: (tag: string) => void;
}

export function SessionNotesScreen({
  rewardsModalData,
  gameState,
  completionNotes,
  setCompletionNotes,
  completionTag,
  setCompletionTag,
}: SessionNotesScreenProps) {
  const currentSkillTags =
    gameState.skills[rewardsModalData.skillIdx]?.tags || [];

  return (
    <div className="w-full max-w-md py-6 select-none animate-fadeIn">
      <div className="text-center mb-6">
        <h2 className="text-[#E2B054] font-serif font-black text-lg tracking-[0.2em] uppercase">
          📜 CRÔNICA DA MISSÃO
        </h2>
        <div className="w-[85%] mx-auto border-b border-amber-500/15 mt-4" />
      </div>

      <div className="w-[85%] mx-auto space-y-6 text-left">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-serif font-black tracking-widest text-[#E2B054]/75 flex items-center gap-1.5 leading-none">
            ANOTAÇÕES DA SESSÃO
          </label>
          <textarea
            value={completionNotes}
            onChange={e => setCompletionNotes(e.target.value)}
            placeholder="O que você aprendeu ou fez nesta sessão?"
            className="w-full bg-stone-950/85 border border-[#C29544]/25 rounded-lg p-3 text-xs text-amber-200 placeholder-amber-100/25 focus:border-[#E2B054] focus:outline-none custom-scrollbar resize-none font-serif h-28 shadow-inner"
          />
        </div>

        {currentSkillTags.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-amber-500/5">
            <label className="text-[10px] uppercase font-serif font-black tracking-widest text-[#E2B054]/75 flex items-center gap-1.5 leading-none">
              VINCULAR SUBSKILL
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-stone-950/50 border border-amber-500/10 rounded-lg max-h-28 overflow-y-auto custom-scrollbar">
              {currentSkillTags.map(tag => {
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
          </div>
        )}
      </div>
    </div>
  );
}
