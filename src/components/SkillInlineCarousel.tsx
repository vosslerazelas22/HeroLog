import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Skill } from '../types';
import { sound } from '../utils/audio';

interface SkillInlineCarouselProps {
  skills: Skill[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  disabled?: boolean;
  onOpenSkillsManager?: () => void;
  muteSfx?: boolean;
}

export function SkillInlineCarousel({
  skills,
  selectedIndex,
  onSelectIndex,
  disabled = false,
  onOpenSkillsManager,
  muteSfx = false,
}: SkillInlineCarouselProps) {
  const [direction, setDirection] = useState<number>(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const didSwipeRef = useRef<boolean>(false);

  const activeIdx = skills.length > 0
    ? Math.max(0, Math.min(selectedIndex, skills.length - 1))
    : 0;

  const currentSkill = skills[activeIdx];

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (disabled || skills.length <= 1) return;
    if (!muteSfx) sound.playClick();
    setDirection(-1);
    const newIdx = (activeIdx - 1 + skills.length) % skills.length;
    onSelectIndex(newIdx);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (disabled || skills.length <= 1) return;
    if (!muteSfx) sound.playClick();
    setDirection(1);
    const newIdx = (activeIdx + 1) % skills.length;
    onSelectIndex(newIdx);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    didSwipeRef.current = false;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled || touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;

    if (skills.length > 1 && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
      didSwipeRef.current = true;
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const handleCenterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    if (onOpenSkillsManager) {
      if (!muteSfx) sound.playClick();
      onOpenSkillsManager();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  if (!skills || skills.length === 0) {
    return (
      <button
        onClick={onOpenSkillsManager}
        aria-label="Adicione sua primeira Habilidade de Foco"
        className="w-full py-2 px-3 bg-transparent border border-dashed border-[#e5c158]/30 hover:border-[#e5c158] text-xs text-[#e5c158] rounded-xl transition-all font-serif italic flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#e5c158]/[0.04] focus:outline-none focus:ring-1 focus:ring-zinc-400"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Adicione sua primeira Habilidade de Foco</span>
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Seletor de habilidade de foco"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 rounded-xl"
    >
      <div className="flex items-center justify-between gap-1.5 py-1 px-1 rounded-xl transition-colors">
        <button
          type="button"
          disabled={disabled || skills.length <= 1}
          onClick={handlePrev}
          aria-label="Habilidade anterior (Seta para a esquerda)"
          title="Habilidade anterior (ou deslize para a direita)"
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-all shrink-0 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${
            disabled || skills.length <= 1
              ? 'opacity-20 cursor-not-allowed text-zinc-600'
              : 'text-[#e5c158]/60 hover:text-[#e5c158] hover:bg-[#e5c158]/10 active:scale-90'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleCenterClick}
          aria-label={`Habilidade atual: ${currentSkill.name}, Nível ${currentSkill.level}. Pressione Enter para abrir detalhes da habilidade.`}
          aria-haspopup="dialog"
          disabled={disabled}
          className={`flex-1 overflow-hidden relative min-h-[36px] flex flex-col items-center justify-center cursor-pointer py-1 px-2 rounded-lg hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 ${
            disabled ? 'opacity-60 cursor-not-allowed' : 'group'
          }`}
          title="Clique para ver detalhes da habilidade (ou deslize / use as setas para trocar)"
        >
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={currentSkill.id || activeIdx}
              custom={direction}
              aria-live="polite"
              initial={{
                opacity: 0,
                x: direction > 0 ? 24 : direction < 0 ? -24 : 0,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                x: direction > 0 ? -24 : direction < 0 ? 24 : 0,
                scale: 0.96,
              }}
              transition={{
                duration: 0.18,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="flex items-center justify-center gap-2 max-w-full px-2"
            >
              <span className="text-base sm:text-lg shrink-0 drop-shadow-[0_0_8px_rgba(229,193,88,0.25)]" aria-hidden="true">
                {currentSkill.emoji || '🎯'}
              </span>

              <span className="font-serif font-bold text-xs sm:text-sm text-[#f4f4f5] group-hover:text-[#e5c158] transition-colors truncate">
                {currentSkill.name}
              </span>

              <span className="text-[11px] font-mono font-medium text-[#e5c158]/80 shrink-0 bg-[#16161d] px-1.5 py-0.5 rounded border border-white/[0.06]">
                Nv. {currentSkill.level}
                {currentSkill.prestige && currentSkill.prestige > 0 ? (
                  <span className="text-yellow-400 ml-1 font-bold">
                    {'★'.repeat(currentSkill.prestige)}
                  </span>
                ) : null}
              </span>
            </motion.div>
          </AnimatePresence>

          {skills.length > 1 && (
            <div
              className="flex items-center justify-center gap-1.5 mt-1"
              role="tablist"
              aria-label="Indicadores de habilidades"
            >
              {skills.map((s, idx) => (
                <button
                  key={s.id || idx}
                  type="button"
                  role="tab"
                  aria-selected={idx === activeIdx}
                  aria-label={`Selecionar habilidade ${idx + 1} de ${skills.length}: ${s.name}`}
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (disabled || idx === activeIdx) return;
                    if (!muteSfx) sound.playClick();
                    setDirection(idx > activeIdx ? 1 : -1);
                    onSelectIndex(idx);
                  }}
                  className={`transition-all duration-200 rounded-full cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${
                    idx === activeIdx
                      ? 'w-3 h-1 bg-zinc-300'
                      : 'w-1 h-1 bg-zinc-600/70 hover:bg-zinc-400'
                  }`}
                  title={`Ir para ${s.name}`}
                />
              ))}
            </div>
          )}
        </button>

        <button
          type="button"
          disabled={disabled || skills.length <= 1}
          onClick={handleNext}
          aria-label="Próxima habilidade (Seta para a direita)"
          title="Próxima habilidade (ou deslize para a esquerda)"
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-all shrink-0 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${
            disabled || skills.length <= 1
              ? 'opacity-20 cursor-not-allowed text-zinc-600'
              : 'text-[#e5c158]/60 hover:text-[#e5c158] hover:bg-[#e5c158]/10 active:scale-90'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
