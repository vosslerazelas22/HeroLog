import React from 'react';
import { Shield, Heart } from 'lucide-react';
import { InventoryItem } from '../../types';
import { TITLE_CATALOG } from './titleCatalog';
import { TitleEquipModal } from '../../components/TitleEquipModal';

export interface CharacterSummary {
  charName: string;
  charClass: 'Mage' | 'Warrior' | 'Ranger' | string;
  equippedTitle: string | null;
  streak: number;
  bestStreak: number;
  totalMinutes: number;
  combatLevel: number;
  combatXP: number;
  hp: number;
  maxHp: number;
}

export interface CharacterScreenProps {
  character: CharacterSummary;
  equippedEquipment: (InventoryItem | null)[];
  activeBuffs: InventoryItem[];
  onUnequipItem: (slotIdx: number) => void;
  ownedTitles?: string[];
  onEquipTitle?: (titleId: string | null) => void;
}

export const CharacterScreen: React.FC<CharacterScreenProps> = ({
  character,
  equippedEquipment,
  activeBuffs,
  onUnequipItem,
  ownedTitles = [],
  onEquipTitle = () => {},
}) => {
  const {
    charName,
    charClass,
    equippedTitle,
    streak,
    bestStreak,
    totalMinutes,
    combatLevel,
    combatXP,
    hp,
    maxHp,
  } = character;

  const [isTitleModalOpen, setIsTitleModalOpen] = React.useState(false);

  return (
    <div className="space-y-5">
      {/* REDESIGNED TWO-COLUMN RPG LAYOUT */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: AVATAR & PERSONAL STATS */}
        <div className="sm:col-span-5 flex flex-col justify-between bg-stone-950/20 border border-amber-500/10 p-3.5 rounded-lg">
          <div className="flex flex-col items-center">
            <div className="text-5xl md:text-6xl w-24 h-24 bg-stone-950 rounded-xl border-2 border-amber-500/40 flex items-center justify-center shadow-[0_4px_25px_rgba(226,176,84,0.18)] select-none relative overflow-hidden group self-center">
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/40 via-transparent to-transparent pointer-events-none" />
              <span className="relative z-10 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] transform group-hover:scale-110 transition-transform duration-300">
                {charClass === 'Mage' ? '🧙' : charClass === 'Warrior' ? '⚔️' : '🏹'}
              </span>
            </div>
          </div>

          {/* Personal Non-Combat Stats */}
          <div className="space-y-2 mt-4">
            <div className="bg-stone-950/40 border border-amber-500/10 p-2.5 rounded text-center transition-all hover:bg-stone-950/60 shadow-sm">
              <div className="text-[9px] text-amber-100/40 uppercase tracking-[0.12em] font-serif flex items-center justify-center gap-1 select-none">
                <span>🔥</span> Sequência Atual
              </div>
              <div className="text-xs font-mono font-black text-amber-400 mt-1">
                {streak} {streak === 1 ? 'dia' : 'dias'}
              </div>
              <div className="text-[8.5px] text-stone-500 font-normal font-sans tracking-wide mt-0.5 select-none">
                (Recorde: {bestStreak}d)
              </div>
            </div>
            
            <div className="bg-stone-950/40 border border-amber-500/10 p-2.5 rounded text-center transition-all hover:bg-stone-950/60 shadow-sm">
              <div className="text-[9px] text-amber-100/40 uppercase tracking-[0.12em] font-serif flex items-center justify-center gap-1 select-none">
                <span>⏱️</span> Foco Total
              </div>
              <div className="text-xs font-mono font-black text-amber-400 mt-1">
                {Math.floor(totalMinutes / 60)}h{String(totalMinutes % 60).padStart(2, '0')}m
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
                  {charName}
                </h3>
                {equippedTitle ? (() => {
                  const found = TITLE_CATALOG.find(t => t.id === equippedTitle);
                  if (!found) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => setIsTitleModalOpen(true)}
                      className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-serif uppercase font-black text-[8px] px-1.5 py-0.5 rounded tracking-wider select-none animate-pulse hover:animate-none shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95"
                      title="Clique para alterar seu Título"
                    >
                      {found.emoji} {found.name}
                    </button>
                  );
                })() : (
                  <button
                    type="button"
                    onClick={() => setIsTitleModalOpen(true)}
                    className="bg-stone-900/60 hover:bg-amber-500/10 border border-stone-800 hover:border-amber-500/30 text-stone-400 hover:text-amber-300 font-serif uppercase font-black text-[8px] px-1.5 py-0.5 rounded tracking-wider cursor-pointer transition-all hover:scale-105 active:scale-95"
                    title="Clique para equipar um Título"
                  >
                    + Equipar Título
                  </button>
                )}
              </div>
              <p className="text-[10px] md:text-[11px] font-bold text-purple-400 tracking-widest uppercase font-serif">
                {charClass === 'Mage' ? "🧙 Mago d'Arraia" : charClass === 'Warrior' ? '🛡️ Guerreiro de Aço' : '🏹 Patrulheiro Silvestre'}
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
                {combatLevel}
              </div>
            </div>

            {/* Combat Experience Progress (XP) */}
            <div className="space-y-1">
              <div className="flex justify-between items-baseline text-[8.5px] font-sans font-bold">
                <span className="text-amber-100/40 uppercase tracking-widest font-serif flex items-center gap-1">
                  ✨ XP (Experiência de Combate)
                </span>
                <span className="text-emerald-400 font-mono text-[8.5px]">
                  {combatXP} / {combatLevel * 100}
                </span>
              </div>
              <div className="h-2 w-full bg-stone-900 border border-amber-500/5 rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                  style={{ width: `${(combatXP / (combatLevel * 100)) * 100}%` }}
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
                {hp} / {maxHp}
              </span>
            </div>
            <div className="h-2 w-full bg-stone-900 border border-amber-500/5 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300 fill-rose-500"
                style={{ width: `${(hp / maxHp) * 100}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ACTIVE EQUIPMENT SLOTS (3 total) */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-serif font-bold tracking-wider uppercase text-amber-100/40 pb-0.5 border-b border-amber-500/5">
          🛡️ Equipamentos Equipados (3 Slots)
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((slotIdx) => {
            const eqItem = (equippedEquipment || [null, null, null])[slotIdx];
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
                        onUnequipItem(slotIdx);
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
          {activeBuffs.length > 0 ? (
            activeBuffs.map((item, idx) => (
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
            <span className="text-[10px] italic text-amber-100/30 font-serif">
              Não há bençãos ativas. Vá ao Bazar de Mystara
            </span>
          )}
        </div>
      </div>

      <TitleEquipModal
        isOpen={isTitleModalOpen}
        onClose={() => setIsTitleModalOpen(false)}
        ownedTitles={ownedTitles}
        equippedTitle={equippedTitle}
        onEquipTitle={onEquipTitle}
      />
    </div>
  );
};
