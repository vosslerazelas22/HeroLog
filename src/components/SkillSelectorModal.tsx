import React from 'react';
import { Modal } from './Modal';
import { Skill } from '../types';
import { Award, Star, Tag } from 'lucide-react';

interface SkillSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: Skill[];
  selectedSkillIdx: number;
  onSelectSkill: (idx: number) => void;
}

export function SkillSelectorModal({
  isOpen,
  onClose,
  skills,
  selectedSkillIdx,
  onSelectSkill,
}: SkillSelectorModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Selecionar Habilidade Ativa"
      variant="amber"
    >
      <div className="space-y-4 max-h-[65vh] pr-1">
        <p className="text-xs text-zinc-300/60 font-serif leading-relaxed italic">
          Escolha qual habilidade receberá o bônus de XP obtido durante esta sessão de foco:
        </p>

        <div className="space-y-2.5">
          {skills.map((sk, idx) => {
            const reqXP = sk.level * 80;
            const progressPercent = Math.min(100, Math.max(0, (sk.xp / reqXP) * 100));
            const isActive = idx === selectedSkillIdx;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectSkill(idx);
                  onClose();
                }}
                className={`w-full text-left bg-stone-950/60 border rounded-xl p-3.5 transition-all duration-300 relative group flex flex-col gap-3 cursor-pointer ${
                  isActive
                    ? 'border-champagne-400 shadow-[0_0_15px_rgba(229,193,88,0.15)] bg-champagne-500/[0.04]'
                    : 'border-stone-800 hover:border-champagne-400/40 hover:bg-champagne-500/[0.02]'
                }`}
              >
                {/* Active Badge / Indicator */}
                {isActive && (
                  <div className="absolute top-3.5 right-3.5 bg-champagne-400 text-stone-950 text-[9px] uppercase font-serif font-black px-2 py-0.5 rounded-full tracking-wider shadow-md">
                    Ativa
                  </div>
                )}

                {/* Header info */}
                <div className="flex items-start gap-3 pr-12">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-2xl shrink-0 transition-transform duration-300 group-hover:scale-110 border ${
                    isActive
                      ? 'bg-champagne-500/10 border-champagne-400/40'
                      : 'bg-stone-900 border-stone-800 group-hover:border-champagne-400/20'
                  }`}>
                    {sk.emoji || '🎯'}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className={`font-serif font-bold text-sm truncate ${
                        isActive ? 'text-champagne-300' : 'text-zinc-300/90 group-hover:text-champagne-300'
                      }`}>
                        {sk.name}
                      </h4>
                      {sk.prestige && sk.prestige > 0 ? (
                        <div className="flex items-center text-yellow-400 text-[10px] font-black shrink-0" title={`Prestígio Nível ${sk.prestige}`}>
                          👑{'★'.repeat(sk.prestige)}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-champagne-400 font-bold">Nv. {sk.level}</span>
                      {sk.prestige ? (
                        <span className="text-yellow-500/70 text-[10px]">+{sk.prestige * 25}% XP</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Progress bar info */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-900">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isActive ? 'bg-gradient-to-r from-champagne-500 to-champagne-300' : 'bg-champagne-500/70'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-zinc-300/40 font-mono">
                    <span>Progresso: {sk.xp} / {reqXP} XP</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                </div>

                {/* Subskills tags */}
                {sk.tags && sk.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1.5 border-t border-stone-850">
                    {sk.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-1.5 py-0.5 bg-stone-900/80 border border-stone-800 text-[9px] text-zinc-300/50 rounded flex items-center gap-1 font-sans"
                      >
                        <Tag className="w-2 h-2 opacity-50" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
