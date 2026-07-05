import React, { useState } from 'react';
import { Skill } from '../../types';

export interface QuickSkillsGridProps {
  skills: Skill[];
  selectedSkillIdx: number;
  onSelectSkill: (idx: number) => void;
  onManageSkills: () => void;
  onInspectSkill: (idx: number, name: string) => void;
  addSystemLog: (msg: string) => void;
  isRunning: boolean;
  isBreakActive: boolean;
}

export const QuickSkillsGrid: React.FC<QuickSkillsGridProps> = ({
  skills,
  selectedSkillIdx,
  onSelectSkill,
  onManageSkills,
  onInspectSkill,
  addSystemLog,
  isRunning,
  isBreakActive,
}) => {
  const [showSkillsTooltip, setShowSkillsTooltip] = useState(false);

  return (
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
              onManageSkills();
            }}
            className="px-2 py-0.5 bg-[#C29544] hover:bg-[#d1a654] text-stone-950 text-[8px] font-black uppercase tracking-wide rounded cursor-pointer transition-all hover:scale-105 active:scale-95"
            title="Criar ou Excluir Habilidades"
          >
            + MANAGE
          </button>
          <span className="text-[9px] font-mono opacity-60 font-bold">{skills.length} Ativas</span>
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
        {skills.map((sk, idx) => {
          const reqXP = sk.level * 80;
          const percent = Math.min((sk.xp / reqXP) * 100, 100);
          const isTimerSelected = selectedSkillIdx === idx;

          return (
            <div
              key={idx}
              onClick={() => {
                if (isRunning || isBreakActive) {
                  addSystemLog(`⚠️ Não é possível trocar de habilidade durante uma jornada de foco ou descanso ativo.`);
                  return;
                }
                onSelectSkill(idx);
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
                  onInspectSkill(idx, sk.name);
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
                  onInspectSkill(idx, sk.name);
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
  );
};
