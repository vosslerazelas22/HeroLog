import React from 'react';
import { Shield, Heart } from 'lucide-react';
import { InventoryItem } from '../../types';
import { TITLE_CATALOG } from './titleCatalog';
import { TitleEquipModal } from '../../components/TitleEquipModal';
import { ItemInspectModal } from '../../components/ItemInspectModal';

const CLASS_AVATAR_MAP: Record<'Mage' | 'Warrior' | 'Ranger', string> = {
  Mage: 'avatars/mage-idle.png',
  Warrior: 'avatars/warrior-idle.png',
  Ranger: 'avatars/ranger-idle.png',
};
const DEFAULT_AVATAR = CLASS_AVATAR_MAP.Warrior;

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

  const avatarSrc = CLASS_AVATAR_MAP[charClass as keyof typeof CLASS_AVATAR_MAP] ?? DEFAULT_AVATAR;

  const [isTitleModalOpen, setIsTitleModalOpen] = React.useState(false);
  const [inspectingItem, setInspectingItem] = React.useState<InventoryItem | null>(null);
  const [inspectingSlotIdx, setInspectingSlotIdx] = React.useState<number | null>(null);

  const modalActions = React.useMemo(() => {
    if (!inspectingItem) return [];
    if (inspectingSlotIdx !== null) {
      return [
        {
          label: 'Desequipar',
          onClick: () => {
            onUnequipItem(inspectingSlotIdx);
            setInspectingItem(null);
            setInspectingSlotIdx(null);
          },
          variant: 'danger' as const,
        },
      ];
    }
    return [];
  }, [inspectingItem, inspectingSlotIdx, onUnequipItem]);

  return (
    <div className="space-y-5">
      {/* MOBILE-ONLY RESTRUCTURED CARD */}
      <div className="sm:hidden bg-stone-950/20 border border-amber-500/10 p-3.5 rounded-lg space-y-3">
        {/* TOP: Avatar + Identity */}
        <div className="flex items-center gap-3">
          <div className="w-[115px] h-[115px] bg-stone-950 rounded-xl border-2 border-amber-500/40 flex items-center justify-center shadow-[0_4px_20px_rgba(226,176,84,0.15)] select-none relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-950/40 via-transparent to-transparent pointer-events-none" />
            <img
              src={avatarSrc}
              alt={charClass}
              className="relative z-10 w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center items-center text-center space-y-1">
            <h3 className="font-serif font-black text-base text-amber-200 tracking-wide uppercase leading-tight truncate w-full text-center">
              {charName}
            </h3>
            {equippedTitle ? (() => {
              const found = TITLE_CATALOG.find(t => t.id === equippedTitle);
              if (!found) return null;
              return (
                <button
                  type="button"
                  onClick={() => setIsTitleModalOpen(true)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-serif uppercase font-black text-[9px] px-2 py-0.5 rounded tracking-wider select-none shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95"
                  title="Clique para alterar seu Título"
                >
                  {found.emoji} {found.name}
                </button>
              );
            })() : (
              <button
                type="button"
                onClick={() => setIsTitleModalOpen(true)}
                className="bg-stone-900/60 hover:bg-amber-500/10 border border-stone-800 hover:border-amber-500/30 text-stone-400 hover:text-amber-300 font-serif uppercase font-black text-[9px] px-2 py-0.5 rounded tracking-wider cursor-pointer transition-all hover:scale-105 active:scale-95"
                title="Clique para equipar um Título"
              >
                + Equipar Título
              </button>
            )}
            <p className="text-xs font-bold text-purple-400 tracking-widest uppercase font-serif leading-tight text-center">
              {charClass === 'Mage' ? "🧙 Mago d'Arraia" : charClass === 'Warrior' ? '🛡️ Guerreiro de Aço' : '🏹 Patrulheiro Silvestre'}
            </p>
          </div>
        </div>

        {/* 2-COLUMN HIGHLIGHT TILES */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Tile 1: Sequência */}
          <div className="bg-stone-950/60 border border-amber-500/20 p-2.5 rounded-lg flex flex-col justify-between text-center shadow-sm">
            <div className="text-[9px] text-amber-100/50 uppercase tracking-[0.12em] font-serif flex items-center justify-center gap-1 select-none">
              <span>🔥</span> Sequência
            </div>
            <div className="text-2xl font-mono font-black text-amber-400 my-1">
              {streak} <span className="text-xs font-normal text-amber-400/80">{streak === 1 ? 'dia' : 'dias'}</span>
            </div>
            <div className="text-[8.5px] text-stone-400 font-normal font-sans tracking-wide select-none">
              (Recorde: {bestStreak}d)
            </div>
          </div>

          {/* Tile 2: Nível de Combate + XP */}
          <div className="bg-stone-950/60 border border-amber-500/20 p-2.5 rounded-lg flex flex-col justify-between text-center shadow-sm">
            <div className="text-[9px] text-amber-100/50 uppercase tracking-[0.12em] font-serif flex items-center justify-center gap-1 select-none">
              <span>⚔️</span> Nível
            </div>
            <div className="text-2xl font-mono font-black text-[#E2B054] my-1">
              {combatLevel}
            </div>
            <div className="space-y-0.5">
              <div className="flex justify-between items-center text-[8px] font-mono text-emerald-400 font-bold px-0.5">
                <span>XP</span>
                <span>{combatXP}/{combatLevel * 100}</span>
              </div>
              <div className="h-1.5 w-full bg-stone-900 border border-amber-500/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (combatXP / (combatLevel * 100)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* COMPACT FOCO TOTAL LINE */}
        <div className="bg-stone-950/40 border border-amber-500/10 px-3 py-2 rounded-md flex items-center justify-between">
          <span className="text-[9.5px] text-amber-100/50 uppercase tracking-[0.12em] font-serif flex items-center gap-1.5 select-none">
            <span>⏱️</span> Foco Total
          </span>
          <span className="text-xs font-mono font-black text-amber-400">
            {Math.floor(totalMinutes / 60)}h{String(totalMinutes % 60).padStart(2, '0')}m
          </span>
        </div>

        {/* COMPACT HP BAR LINE */}
        <div className="bg-stone-950/40 border border-amber-500/10 px-3 py-2 rounded-md space-y-1">
          <div className="flex justify-between items-center text-[9px] font-sans font-bold">
            <span className="text-rose-400 uppercase tracking-widest font-serif flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" /> HP (PONTOS DE VIDA)
            </span>
            <span className="text-rose-400 font-mono text-[9px]">
              {hp} / {maxHp}
            </span>
          </div>
          <div className="h-2 w-full bg-stone-900 border border-amber-500/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (hp / maxHp) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* DESKTOP TWO-COLUMN RPG LAYOUT */}
      <div className="hidden sm:grid sm:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: AVATAR & PERSONAL STATS */}
        <div className="sm:col-span-5 flex flex-col justify-between bg-stone-950/20 border border-amber-500/10 p-3.5 rounded-lg">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-stone-950 rounded-xl border-2 border-amber-500/40 flex items-center justify-center shadow-[0_4px_25px_rgba(226,176,84,0.18)] select-none relative overflow-hidden group self-center">
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/40 via-transparent to-transparent pointer-events-none" />
              <img
                src={avatarSrc}
                alt={charClass}
                className="relative z-10 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
              />
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
                onClick={() => {
                  if (eqItem) {
                    setInspectingItem(eqItem);
                    setInspectingSlotIdx(slotIdx);
                  }
                }}
                className={`aspect-square bg-stone-950/40 border ${
                  eqItem ? 'border-amber-500/30 bg-amber-500/[0.04] hover:border-amber-500/50 cursor-pointer active:scale-95' : 'border-dashed border-amber-500/10'
                } rounded flex flex-col items-center justify-center p-1 relative transition-all`}
              >
                {eqItem ? (
                  <>
                    <span className="text-xl select-none">{eqItem.emoji}</span>
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
                      className="absolute -top-1 -right-1 bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-200 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold cursor-pointer transition-all active:scale-95 z-10 animate-fade-in"
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
                onClick={() => {
                  setInspectingItem(item);
                  setInspectingSlotIdx(null);
                }}
                className="text-[10px] font-serif font-bold bg-purple-950/40 border border-purple-500/30 text-purple-300 px-2.5 py-0.5 rounded flex items-center gap-1 shadow cursor-pointer hover:bg-purple-900/40 hover:border-purple-400 active:scale-95 transition-all"
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

      <ItemInspectModal
        item={inspectingItem}
        onClose={() => {
          setInspectingItem(null);
          setInspectingSlotIdx(null);
        }}
        showSlotSelector={false}
        actions={modalActions}
      />
    </div>
  );
};
