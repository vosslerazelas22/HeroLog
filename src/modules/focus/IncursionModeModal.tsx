import React from 'react';
import { Modal } from '../../components/Modal';
import { Sparkles, Swords, Skull, Clock } from 'lucide-react';

export interface IncursionModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDungeonMode: boolean;
  isWildernessChecked: boolean;
  dungeonCooldownRemaining: number;
  formatDungeonCooldown: (ms: number) => string;
  onSelectMode: (mode: 'standard' | 'dungeon' | 'wilderness') => void;
}

export const IncursionModeModal: React.FC<IncursionModeModalProps> = ({
  isOpen,
  onClose,
  isDungeonMode,
  isWildernessChecked,
  dungeonCooldownRemaining,
  formatDungeonCooldown,
  onSelectMode,
}) => {
  const isStandardActive = !isDungeonMode && !isWildernessChecked;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚔️ Modo de Incursão"
      variant="amber"
    >
      <div className="space-y-3 font-sans">
        <p className="text-xs text-amber-100/60 font-serif leading-relaxed">
          Selecione o estilo de jornada para sua próxima sessão de foco:
        </p>

        {/* 1. Modo Padrão */}
        <button
          type="button"
          onClick={() => {
            onSelectMode('standard');
            onClose();
          }}
          className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer select-none space-y-1.5 ${
            isStandardActive
              ? 'bg-amber-500/15 border-amber-400/80 ring-1 ring-amber-400/30 shadow-md'
              : 'bg-stone-900/40 border-amber-500/15 hover:bg-stone-900/80 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-serif font-bold text-sm text-amber-200">
                🎯 Padrão
              </span>
            </div>
            {isStandardActive && (
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Ativo
              </span>
            )}
          </div>
          <p className="text-xs text-amber-100/70 leading-relaxed font-sans">
            Chance de saque baseada na duração da sessão.
          </p>
        </button>

        {/* 2. Modo Masmorra */}
        <button
          type="button"
          disabled={dungeonCooldownRemaining > 0}
          onClick={() => {
            if (dungeonCooldownRemaining <= 0) {
              onSelectMode('dungeon');
              onClose();
            }
          }}
          className={`w-full text-left p-3.5 rounded-lg border transition-all select-none space-y-1.5 ${
            dungeonCooldownRemaining > 0
              ? 'opacity-50 cursor-not-allowed bg-stone-950/40 border-purple-500/15'
              : isDungeonMode
              ? 'bg-purple-950/80 border-purple-400/80 ring-1 ring-purple-400/30 shadow-md cursor-pointer'
              : 'bg-stone-900/40 border-purple-500/25 hover:bg-purple-950/30 hover:border-purple-500/50 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="font-serif font-bold text-sm text-purple-200">
                ⚔️ Masmorra
              </span>
            </div>
            {dungeonCooldownRemaining > 0 ? (
              <span className="text-[9px] font-mono font-medium tracking-normal text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-400" />
                ⏳ {formatDungeonCooldown(dungeonCooldownRemaining)}
              </span>
            ) : isDungeonMode ? (
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Ativo
              </span>
            ) : null}
          </div>
          <p className="text-xs text-purple-100/70 leading-relaxed font-sans">
            4 sessões seguidas sem abandonar. +2.500 GP e Quad Loot ao concluir.
          </p>
        </button>

        {/* 3. Modo Selvagem */}
        <button
          type="button"
          onClick={() => {
            onSelectMode('wilderness');
            onClose();
          }}
          className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer select-none space-y-1.5 ${
            isWildernessChecked
              ? 'bg-red-950/80 border-red-500/80 ring-1 ring-red-400/30 shadow-md'
              : 'bg-stone-900/40 border-red-500/25 hover:bg-red-950/30 hover:border-red-500/50'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Skull className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-serif font-bold text-sm text-red-200">
                💀 Selvagem
              </span>
            </div>
            {isWildernessChecked && (
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                Ativo
              </span>
            )}
          </div>
          <p className="text-xs text-red-100/70 leading-relaxed font-sans">
            +25% XP & GP. Minimizar a aba cancela o bônus.
          </p>
        </button>
      </div>
    </Modal>
  );
};
