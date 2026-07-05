import { CharacterState } from '../../types';

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
