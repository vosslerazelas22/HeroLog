import React from 'react';
import { motion } from 'motion/react';
import { CharacterState } from '../types';
import { Sparkles, ShoppingBag, Award, Star, Flame, Skull, Compass, Shield } from 'lucide-react';

export interface TitleItem {
  id: string;
  name: string;
  emoji: string;
  category: 'common' | 'rare' | 'epic' | 'legendary' | 'achievement' | 'drop';
  price?: number;
  perks?: string[];
  requirementText?: string;
  checkUnlocked?: (state: CharacterState) => boolean;
  dropChanceText?: string;
  colorClass: string;
  textGlowClass?: string;
}

export const TITLE_CATALOG: TitleItem[] = [
  // --- PURCHASABLE COMMON (150-500 GP) ---
  {
    id: 'APPRENTICE',
    name: 'Aprendiz',
    emoji: '⭐',
    category: 'common',
    price: 150,
    colorClass: 'border-stone-700/50 hover:border-amber-500/30 bg-stone-900/40 text-stone-300 font-sans',
    textGlowClass: 'text-amber-200/80'
  },
  {
    id: 'SCHOLAR',
    name: 'Erudito',
    emoji: '📖',
    category: 'common',
    price: 200,
    colorClass: 'border-stone-700/50 hover:border-amber-500/30 bg-stone-900/40 text-stone-300 font-sans',
    textGlowClass: 'text-amber-200/80 font-sans'
  },
  {
    id: 'GRINDER',
    name: 'Incansável',
    emoji: '⚔️',
    category: 'common',
    price: 200,
    colorClass: 'border-stone-700/50 hover:border-amber-500/30 bg-stone-900/40 text-stone-300 font-sans',
    textGlowClass: 'text-amber-200/80 font-sans'
  },
  {
    id: 'SCRIBE',
    name: 'Escriba',
    emoji: '📝',
    category: 'common',
    price: 250,
    colorClass: 'border-stone-700/50 hover:border-amber-500/30 bg-stone-900/40 text-stone-300 font-sans',
    textGlowClass: 'text-amber-200/80 font-sans'
  },
  {
    id: 'ARCANE',
    name: 'Arcanista',
    emoji: '🔮',
    category: 'common',
    price: 300,
    colorClass: 'border-stone-700/50 hover:border-amber-500/30 bg-stone-900/40 text-stone-300 font-sans',
    textGlowClass: 'text-amber-200/80 font-sans'
  },
  {
    id: 'WANDERER',
    name: 'Andarilho',
    emoji: '🌿',
    category: 'common',
    price: 300,
    colorClass: 'border-stone-700/50 hover:border-amber-500/30 bg-stone-900/40 text-stone-300 font-sans',
    textGlowClass: 'text-amber-200/80 font-sans'
  },
  {
    id: 'SEEKER',
    name: 'Buscador',
    emoji: '🔍',
    category: 'common',
    price: 400,
    colorClass: 'border-stone-700/50 hover:border-amber-500/30 bg-stone-900/40 text-stone-300 font-sans',
    textGlowClass: 'text-amber-200/80 font-sans'
  },
  {
    id: 'NIGHT_OWL',
    name: 'Coruja Noturna',
    emoji: '🦉',
    category: 'common',
    price: 500,
    colorClass: 'border-stone-700/50 hover:border-amber-500/30 bg-stone-900/40 text-stone-300 font-sans',
    textGlowClass: 'text-amber-200/80 font-sans'
  },

  // --- PURCHASABLE RARE (1,500-6,000 GP) ---
  {
    id: 'CHAMPION',
    name: 'Campeão',
    emoji: '👑',
    category: 'rare',
    price: 1500,
    colorClass: 'border-amber-600/30 hover:border-amber-400 bg-amber-950/10 text-amber-100 font-sans',
    textGlowClass: 'text-amber-300 font-serif'
  },
  {
    id: 'DUELIST',
    name: 'Duelista',
    emoji: '🗡️',
    category: 'rare',
    price: 2000,
    colorClass: 'border-amber-600/30 hover:border-amber-400 bg-amber-950/10 text-amber-100 font-sans',
    textGlowClass: 'text-amber-300 font-serif'
  },
  {
    id: 'STORMBORN',
    name: 'Nascido da Tempestade',
    emoji: '⛈️',
    category: 'rare',
    price: 2500,
    colorClass: 'border-amber-600/30 hover:border-amber-400 bg-amber-950/10 text-amber-100 font-sans',
    textGlowClass: 'text-amber-300 font-serif'
  },
  {
    id: 'ALCHEMIST',
    name: 'Alquimista',
    emoji: '🧪',
    category: 'rare',
    price: 3000,
    colorClass: 'border-amber-600/30 hover:border-amber-400 bg-amber-950/10 text-amber-100 font-sans',
    textGlowClass: 'text-amber-300 font-serif'
  },
  {
    id: 'ILLUMINATED',
    name: 'Iluminado',
    emoji: '💡',
    category: 'rare',
    price: 4000,
    colorClass: 'border-amber-600/30 hover:border-amber-400 bg-amber-950/10 text-amber-100 font-sans',
    textGlowClass: 'text-amber-300 font-serif'
  },
  {
    id: 'WARLORD',
    name: 'Senhor da Guerra',
    emoji: '🔱',
    category: 'rare',
    price: 6000,
    colorClass: 'border-amber-600/30 hover:border-amber-400 bg-amber-950/10 text-amber-100 font-sans',
    textGlowClass: 'text-amber-300 font-serif'
  },

  // --- PURCHASABLE EPIC (10,000-50,000 GP) ---
  {
    id: 'LEGEND_GP',
    name: 'Lenda',
    emoji: '💀',
    category: 'epic',
    price: 10000,
    perks: ['+5% de XP em todas as sessões'],
    colorClass: 'border-purple-500/20 hover:border-purple-400 bg-purple-950/10 text-purple-100 font-sans',
    textGlowClass: 'text-purple-300 font-semibold font-serif'
  },
  {
    id: 'INFERNO',
    name: 'Inferno',
    emoji: '🔥',
    category: 'epic',
    price: 15000,
    perks: ['+8% de XP · Eventos multiplicadores duram 15% mais'],
    colorClass: 'border-purple-500/20 hover:border-purple-400 bg-purple-950/10 text-purple-100 font-sans',
    textGlowClass: 'text-purple-300 font-semibold font-serif'
  },
  {
    id: 'STARBOUND',
    name: 'Nascido das Estrelas',
    emoji: '☀️',
    category: 'epic',
    price: 22000,
    perks: ['+10% de XP · +8% de ouro de todas as fontes'],
    colorClass: 'border-purple-500/20 hover:border-purple-400 bg-purple-950/10 text-purple-100 font-sans',
    textGlowClass: 'text-purple-300 font-semibold font-serif'
  },
  {
    id: 'DRAGONBORN',
    name: 'Dragonborn',
    emoji: '🐉',
    category: 'epic',
    price: 35000,
    perks: ['+15% de XP · Bônus de XP de Prestígio 25% mais fortes'],
    colorClass: 'border-purple-500/20 hover:border-purple-400 bg-purple-950/10 text-purple-100 font-sans',
    textGlowClass: 'text-purple-300 font-semibold font-serif'
  },
  {
    id: 'VOIDWALKER',
    name: 'Caminhante do Vazio',
    emoji: '🌌',
    category: 'epic',
    price: 50000,
    perks: ['+20% de XP · Chance de drop de saques e títulos +50%'],
    colorClass: 'border-purple-500/20 hover:border-purple-400 bg-purple-950/10 text-purple-100 font-sans',
    textGlowClass: 'text-purple-300 font-semibold font-serif'
  },

  // --- PURCHASABLE LEGENDARY (100,000-500,000 GP) ---
  {
    id: 'THE_WATCHER',
    name: 'O Vigilante',
    emoji: '👁️',
    category: 'legendary',
    price: 100000,
    perks: ['+25% de XP · +15% de ouro de todas as fontes'],
    colorClass: 'border-orange-500/30 hover:border-orange-400 bg-orange-950/10 text-orange-100 font-sans',
    textGlowClass: 'text-orange-300 font-bold font-serif'
  },
  {
    id: 'TRANSCENDENT',
    name: 'Transcendente',
    emoji: '♾️',
    category: 'legendary',
    price: 250000,
    perks: ['+30% de XP · +20% de ouro · Taxas de drop de saques duplicadas'],
    colorClass: 'border-orange-500/30 hover:border-orange-400 bg-orange-950/10 text-orange-100 font-sans',
    textGlowClass: 'text-orange-300 font-bold font-serif'
  },
  {
    id: 'THE_ETERNAL_SCHOLAR',
    name: 'O Erudito Eterno',
    emoji: '🌠',
    category: 'legendary',
    price: 500000,
    perks: ['+50% de XP · +30% de ouro · Bônus de Prestígio 50% mais fortes'],
    colorClass: 'border-yellow-600/30 hover:border-yellow-400 bg-yellow-950/10 text-yellow-105 font-sans',
    textGlowClass: 'text-yellow-400 font-black font-serif'
  },

  // --- ACHIEVEMENT MILESTONES ---
  {
    id: 'IRON_WILL',
    name: 'IRON WILL',
    emoji: '🔥',
    category: 'achievement',
    perks: ['+5% XP from all sessions'],
    requirementText: '30-Day streak',
    checkUnlocked: (state) => state.bestStreak >= 30,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'DIAMOND_MIND',
    name: 'DIAMOND MIND',
    emoji: '💎',
    category: 'achievement',
    perks: ['+8% XP · +5% gold earned'],
    requirementText: '60-Day streak',
    checkUnlocked: (state) => state.bestStreak >= 60,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'THE_CENTURY',
    name: 'THE CENTURY',
    emoji: '💯',
    category: 'achievement',
    perks: ['+12% XP · +8% gold earned'],
    requirementText: '100-Day streak',
    checkUnlocked: (state) => state.bestStreak >= 100,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'A_FULL_YEAR',
    name: 'A FULL YEAR',
    emoji: '☀️',
    category: 'achievement',
    perks: ['+25% XP · +15% gold earned'],
    requirementText: '365-Day streak',
    checkUnlocked: (state) => state.bestStreak >= 365,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'CENTURION',
    name: 'CENTURION',
    emoji: '⚔️',
    category: 'achievement',
    perks: ['+5% XP from all sessions'],
    requirementText: '100 sessions',
    checkUnlocked: (state) => state.totalSessions >= 100,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'THE_OBSESSED',
    name: 'THE OBSESSED',
    emoji: '💫',
    category: 'achievement',
    perks: ['+15% XP · +10% gold earned'],
    requirementText: '1,000 sessions',
    checkUnlocked: (state) => state.totalSessions >= 1000,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'IMMORTAL_SCHOLAR',
    name: 'IMMORTAL SCHOLAR',
    emoji: '🏛️',
    category: 'achievement',
    perks: ['+25% XP · +20% gold · Loot rates +50%'],
    requirementText: '2,500 sessions',
    checkUnlocked: (state) => state.totalSessions >= 2500,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'DEATH_PROOF',
    name: 'DEATH-PROOF',
    emoji: '💀',
    category: 'achievement',
    perks: ['+25% XP in Wilderness · Can never die in Wilderness'],
    requirementText: 'Survive 50 Wilderness',
    checkUnlocked: (state) => state.wildernessWins >= 50,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'DUNGEON_LORD',
    name: 'DUNGEON LORD',
    emoji: '🏰',
    category: 'achievement',
    perks: ['+15% XP inside dungeons'],
    requirementText: 'Clear 10 dungeons',
    checkUnlocked: (state) => state.dungeonProgress >= 10,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'RAID_VETERAN',
    name: 'RAID VETERAN',
    emoji: '🔱',
    category: 'achievement',
    perks: ['+25% XP in dungeons · +20% dungeon gold rewards'],
    requirementText: 'Clear 25 dungeons',
    checkUnlocked: (state) => state.dungeonProgress >= 25,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'LEGEND_ACH',
    name: 'LEGEND',
    emoji: '👑',
    category: 'achievement',
    perks: ['+10% XP from all sessions'],
    requirementText: 'Level 99 in any skill',
    checkUnlocked: (state) => state.skills?.some(s => s.level >= 99) || false,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'PANTHEON',
    name: 'PANTHEON',
    emoji: '🌠',
    category: 'achievement',
    perks: ['+20% XP · Prestige XP bonuses 30% stronger'],
    requirementText: 'Level 99 in 5 skills',
    checkUnlocked: (state) => (state.skills?.filter(s => s.level >= 99).length || 0) >= 5,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'MANIAC',
    name: 'MANIAC',
    emoji: '⚡',
    category: 'achievement',
    perks: ['+10% XP · Multiplier events last 30% longer'],
    requirementText: '50-Session combo',
    checkUnlocked: (state) => state.combo >= 50,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'IN_THE_ZONE',
    name: 'IN THE ZONE',
    emoji: '🌀',
    category: 'achievement',
    perks: ['+5% XP · Multiplier events last 20% longer'],
    requirementText: '30-Session combo',
    checkUnlocked: (state) => state.combo >= 30,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'MARATHONER',
    name: 'MARATHONER',
    emoji: '🏃',
    category: 'achievement',
    perks: ['+15% XP for sessions longer than 60 minutes'],
    requirementText: '10 sessions of 90+ min',
    checkUnlocked: (state) => (state.history?.filter(h => h.duration >= 90).length || 0) >= 10,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'XP_GOD',
    name: 'XP GOD',
    emoji: '💥',
    category: 'achievement',
    perks: ['+20% XP · +10% gold earned'],
    requirementText: '5,000,000 total XP',
    checkUnlocked: (state) => state.totalXP >= 5000000,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'NOCTURNAL',
    name: 'NOCTURNAL',
    emoji: '🌙',
    category: 'achievement',
    perks: ['+15% XP · Loot & title drop rates +30%'],
    requirementText: '500 hours studied',
    checkUnlocked: (state) => state.totalMinutes >= 30000, // 500 hours * 60 min
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },
  {
    id: 'ASCENDED',
    name: 'ASCENDED',
    emoji: '♾️',
    category: 'achievement',
    perks: ['+10% XP · Prestige XP bonuses 50% stronger'],
    requirementText: 'Prestige 10 times',
    checkUnlocked: (state) => (state.skills?.reduce((sum, s) => sum + (s.prestige || 0), 0) || 0) >= 10,
    colorClass: 'border-[#4e3c28]/70 hover:border-amber-500/30 bg-[#251e16] text-[#ccbda8] font-sans'
  },

  // --- RARE LOOT DROP TITLES ---
  {
    id: 'BLESSED',
    name: 'BLESSED',
    emoji: '🌸',
    category: 'drop',
    perks: ['+8% XP · +10% gold from all sources'],
    dropChanceText: 'ULTRA-RARE SESSION DROP',
    colorClass: 'border-[#92400e]/35 bg-[#451a03]/30 text-[#fef3c7] font-sans'
  },
  {
    id: 'SHADOW',
    name: 'SHADOW',
    emoji: '🌑',
    category: 'drop',
    perks: ['+10% XP · Loot & title drop rates +75%'],
    dropChanceText: 'ULTRA-RARE SESSION DROP',
    colorClass: 'border-[#1e293b]/70 bg-[#0f172a]/40 text-[#f1f5f9] font-sans'
  },
  {
    id: 'THE_FORSAKEN',
    name: 'THE FORSAKEN',
    emoji: '🔮',
    category: 'drop',
    perks: ['+15% Wilderness XP · Can never die in the Wilderness'],
    dropChanceText: 'EXTREMELY RARE SESSION DROP',
    colorClass: 'border-[#581c87]/50 bg-[#3b0764]/30 text-[#f3e8ff] font-sans'
  },
  {
    id: 'CELESTIAL',
    name: 'CELESTIAL',
    emoji: '✨',
    category: 'drop',
    perks: ['+20% XP · +15% gold · Loot rates doubled'],
    dropChanceText: 'RAREST OF ALL DROP TITLES',
    colorClass: 'border-yellow-500/40 bg-yellow-950/20 text-[#fef3c7] font-sans'
  },
  {
    id: 'THUNDERSTRUCK',
    name: 'THUNDERSTRUCK',
    emoji: '⚡',
    category: 'drop',
    perks: ['+25% Wilderness XP · Can never die · +10% gold'],
    dropChanceText: 'RARE WILDERNESS-ONLY DROP',
    colorClass: 'border-amber-500/30 bg-[#1e293b]/40 text-[#fef3c7] font-sans'
  },
  {
    id: 'HAUNTED',
    name: 'HAUNTED',
    emoji: '👻',
    category: 'drop',
    perks: ['+10% XP · +20% gold from all sources'],
    dropChanceText: 'RARE WILDERNESS-ONLY DROP',
    colorClass: 'border-purple-500/30 bg-[#0f172a]/30 text-[#f3e8ff] font-sans'
  },
  {
    id: 'BLOOD_FORGED',
    name: 'BLOOD-FORGED',
    emoji: '🩸',
    category: 'drop',
    perks: ['+20% XP in dungeons · +20% dungeon gold rewards'],
    dropChanceText: 'DUNGEON LOOT ONLY',
    colorClass: 'border-rose-950 bg-[#450a0a]/30 text-[#ffe4e6] font-sans'
  }
];

interface TitlesTabProps {
  state: CharacterState;
  onEquipTitle: (titleId: string | null) => void;
  onBuyTitle: (titleId: string, price: number) => void;
  onClaimAchievementTitle: (titleId: string) => void;
}

export const TitlesTab: React.FC<TitlesTabProps> = ({
  state,
  onEquipTitle,
  onBuyTitle,
  onClaimAchievementTitle
}) => {
  const ownedTitles = state.ownedTitles || [];
  const equippedTitleId = state.equippedTitle || null;

  // Render title card helper
  const renderTitleCard = (title: TitleItem) => {
    const isOwned = ownedTitles.includes(title.id);
    const isEquipped = equippedTitleId === title.id;

    // Determine lock state for achievements
    let isAchievementUnlocked = false;
    if (title.category === 'achievement' && title.checkUnlocked) {
      isAchievementUnlocked = title.checkUnlocked(state);
    }

    return (
      <div
        key={title.id}
        className={`border p-3 rounded flex flex-col justify-between transition-all duration-300 relative ${
          isEquipped
            ? 'border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25)] bg-[#1c1917]/90'
            : title.colorClass
        }`}
      >
        {/* Equiv indicator badge */}
        {isEquipped && (
          <div className="absolute -top-2.5 -right-2 bg-amber-500 text-stone-950 font-serif uppercase text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider shadow">
            Ativo
          </div>
        )}

        <div>
          {/* Title Header */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm select-none">{title.emoji}</span>
            <strong className={`text-[11px] font-serif uppercase tracking-wider ${title.textGlowClass || 'text-amber-100/90'}`}>
              {title.name}
            </strong>
          </div>

          {/* Perks (Epic and Legendary / Achievement / Drops get blueprints) */}
          {title.perks && title.perks.length > 0 && (
            <div className="space-y-0.5 my-1.5">
              {title.perks.map((p, idx) => (
                <span key={idx} className="text-[9px] text-[#38bdf8] block font-mono">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="border-t border-amber-500/5 pt-2 mt-2 flex items-center justify-between">
          {/* Price or requirement text */}
          <div>
            {title.category === 'achievement' ? (
              <span className={`text-[9px] font-mono flex items-center gap-1 uppercase font-bold ${isOwned ? 'text-emerald-400' : isAchievementUnlocked ? 'text-amber-400' : 'text-stone-500'}`}>
                {isOwned ? (
                  '🔓 Desbloqueado'
                ) : (
                  <>🔒 {title.requirementText}</>
                )}
              </span>
            ) : title.category === 'drop' ? (
              <span className="text-[9px] font-bold text-amber-500/60 font-serif uppercase tracking-tight">
                ♦ {title.dropChanceText}
              </span>
            ) : (
              // purchasables
              !isOwned && title.price ? (
                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 font-mono">
                  {title.price.toLocaleString()} <span className="text-[8px] text-amber-600">GP</span>
                </span>
              ) : (
                <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">Adquirido</span>
              )
            )}
          </div>

          {/* Interaction Button */}
          <div>
            {isOwned ? (
              isEquipped ? (
                <button
                  onClick={() => onEquipTitle(null)}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-serif font-black uppercase text-[8px] tracking-widest px-2.5 py-1 rounded transition-all cursor-pointer border border-stone-700/50"
                >
                  Remover
                </button>
              ) : (
                <button
                  onClick={() => onEquipTitle(title.id)}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-black uppercase text-[8px] tracking-widest px-2.5 py-1 rounded transition-all cursor-pointer shadow border border-amber-400"
                >
                  Equipar
                </button>
              )
            ) : (
              // locked/not owned
              title.category === 'achievement' ? (
                isAchievementUnlocked ? (
                  <button
                    onClick={() => onClaimAchievementTitle(title.id)}
                    className="bg-amber-600 hover:bg-amber-500 text-amber-100 font-serif font-black uppercase text-[8px] tracking-widest px-2.5 py-1 rounded transition-all cursor-pointer animate-pulse"
                  >
                    Resgatar
                  </button>
                ) : (
                  <button
                    disabled
                    className="bg-stone-900 text-stone-600 font-serif font-black uppercase text-[8px] tracking-widest px-2.5 py-1 rounded opacity-50 cursor-not-allowed border border-stone-800"
                  >
                    Bloqueado
                  </button>
                )
              ) : title.category === 'drop' ? (
                <button
                  disabled
                  className="bg-stone-900 text-stone-500 font-serif font-black uppercase text-[8px] tracking-widest px-2 px-1 py-1 rounded opacity-40 cursor-not-allowed border border-stone-800"
                  title="Só pode ser obtido ao completar sessões do foco"
                >
                  Loot Raro
                </button>
              ) : (
                // Shop purchasable
                <button
                  onClick={() => title.price && onBuyTitle(title.id, title.price)}
                  disabled={state.gold < (title.price || 0)}
                  className={`font-serif font-black uppercase text-[8px] tracking-widest px-2.5 py-1 rounded transition-all cursor-pointer border ${
                    state.gold >= (title.price || 0)
                      ? 'bg-[#40301a] hover:bg-[#543f22] text-amber-300 border-amber-500/20'
                      : 'bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed opacity-50'
                  }`}
                >
                  Comprar
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 font-serif leading-relaxed text-amber-100/90">
      
      {/* Intro Header Section */}
      <div className="flex flex-col gap-1 border-b border-amber-500/10 pb-4">
        <p className="text-xs uppercase font-serif tracking-[0.14em] text-amber-400 font-bold">
          Equipe títulos honorários para reluzir no reino do foco e liberar buffs poderosos.
        </p>
      </div>

      {/* SECTION 1: PURCHASABLE TITLES */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-amber-500/10 pb-1.5">
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs uppercase font-bold tracking-widest text-amber-300">Títulos Adquiríveis (GP)</h4>
        </div>

        {/* COMMON */}
        <div className="space-y-2">
          <h5 className="text-[9px] uppercase font-mono tracking-widest text-amber-100/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-500" /> COMMON · 150 - 500 GP
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TITLE_CATALOG.filter(t => t.category === 'common').map(renderTitleCard)}
          </div>
        </div>

        {/* RARE */}
        <div className="space-y-2 pt-2">
          <h5 className="text-[9px] uppercase font-mono tracking-widest text-[#d97706] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> RARE · 1.500 - 6.000 GP
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TITLE_CATALOG.filter(t => t.category === 'rare').map(renderTitleCard)}
          </div>
        </div>

        {/* EPIC */}
        <div className="space-y-2 pt-2">
          <h5 className="text-[9px] uppercase font-mono tracking-widest text-purple-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" /> EPIC · 10.000 - 50.000 GP <span className="text-[8px] text-[#38bdf8] font-serif font-normal lowercase">(concede atributos heróicos passivos em azul)</span>
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TITLE_CATALOG.filter(t => t.category === 'epic').map(renderTitleCard)}
          </div>
        </div>

        {/* LEGENDARY */}
        <div className="space-y-2 pt-2">
          <h5 className="text-[9px] uppercase font-mono tracking-widest text-yellow-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> LEGENDARY · 100.000 - 500.000 GP <span className="text-[8px] text-[#38bdf8] font-serif font-normal lowercase">(concede atributos supremos passivos em azul)</span>
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TITLE_CATALOG.filter(t => t.category === 'legendary').map(renderTitleCard)}
          </div>
        </div>
      </div>

      {/* SECTION 2: ACHIEVEMENT MILESTONES */}
      <div className="space-y-4 pt-4 border-t border-amber-500/10">
        <div className="flex items-center gap-2 border-b border-amber-500/10 pb-1.5">
          <Award className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs uppercase font-bold tracking-widest text-purple-300">Achievements Titles · Resgate por Milestones de Conquista</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TITLE_CATALOG.filter(t => t.category === 'achievement').map(renderTitleCard)}
        </div>
      </div>

      {/* SECTION 3: RARE DECAY DROP TITLES */}
      <div className="space-y-4 pt-4 border-t border-amber-500/10">
        <div className="flex items-center gap-2 border-b border-amber-500/10 pb-1.5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs uppercase font-bold tracking-widest text-emerald-300">Rare Drop Titles · Sorteados ao Completar Sessões de Estudo</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TITLE_CATALOG.filter(t => t.category === 'drop').map(renderTitleCard)}
        </div>
      </div>
    </div>
  );
};
