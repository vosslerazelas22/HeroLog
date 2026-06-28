import React from 'react';
import { CharacterState } from '../types';
import { Target, Trophy } from 'lucide-react';
import { sound } from '../utils/audio';

interface QuestsTabProps {
  state: CharacterState;
  onClaimQuestReward: (gold: number, xp: number, questId: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns "27/06/2025" — matches the prefix of h.date (toLocaleString pt-BR) */
const todayLocalStr = () => new Date().toLocaleDateString('pt-BR');

/** Sessions registered today */
const todaySessions = (state: CharacterState) => {
  const today = todayLocalStr();
  return state.history.filter(h => h.date.startsWith(today));
};

/** Unique skill names studied today */
const todaySkillNames = (state: CharacterState): string[] => {
  const today = todayLocalStr();
  const names = state.history
    .filter(h => h.date.startsWith(today))
    .map(h => h.skillName);
  return [...new Set(names)];
};

/** Skill with the lowest level (falls back to first skill) */
const weakestSkill = (state: CharacterState): string | null => {
  if (!state.skills.length) return null;
  return state.skills.reduce((a, b) => (a.level <= b.level ? a : b)).name;
};

// ─── Daily Quest Catalog ─────────────────────────────────────────────────────

export type QuestDef = {
  summary?: string;
  id: string;
  name: string;
  desc: string;
  getProgress: (s: CharacterState) => number;
  target: number;
  rewardGold: number;
  rewardXp: number;
};

export const DAILY_QUEST_CATALOG: QuestDef[] = [
  // ── Foco Básico ────────────────────────────────────────────────────────────
  {
    id: 'daily_first_torch',
    name: 'Acender a Primeira Tocha',
    summary: '1 foco hoje',
    desc: 'Conclua 1 sessão de foco hoje.',
    getProgress: s => Math.min(todaySessions(s).length, 1),
    target: 1,
    rewardGold: 80,
    rewardXp: 40,
  },
  {
    id: 'daily_rite_25',
    name: 'Rito dos 25 Minutos',
    summary: '25 min de foco',
    desc: 'Acumule 25 minutos de foco hoje.',
    getProgress: s => Math.min(s.todayMinutes, 25),
    target: 25,
    rewardGold: 100,
    rewardXp: 50,
  },
  {
    id: 'daily_apprentice_vigil',
    name: 'Vigília do Aprendiz',
    summary: '40 min de foco',
    desc: 'Acumule 40 minutos de foco hoje.',
    getProgress: s => Math.min(s.todayMinutes, 40),
    target: 40,
    rewardGold: 130,
    rewardXp: 65,
  },
  {
    id: 'daily_two_bells',
    name: 'O Sino Tocou Duas Vezes',
    summary: '2 sessões hoje',
    desc: 'Conclua 2 sessões de foco hoje.',
    getProgress: s => Math.min(todaySessions(s).length, 2),
    target: 2,
    rewardGold: 150,
    rewardXp: 75,
  },
  {
    id: 'daily_three_incursions',
    name: 'Três Investidas ao Santuário',
    summary: '3 sessões hoje',
    desc: 'Conclua 3 sessões de foco hoje.',
    getProgress: s => Math.min(todaySessions(s).length, 3),
    target: 3,
    rewardGold: 200,
    rewardXp: 100,
  },

  // ── Tempo Total ────────────────────────────────────────────────────────────
  {
    id: 'daily_sacred_hour',
    name: 'Hora Sagrada',
    summary: '60 min de foco',
    desc: 'Acumule 60 minutos de foco hoje.',
    getProgress: s => Math.min(s.todayMinutes, 60),
    target: 60,
    rewardGold: 200,
    rewardXp: 100,
  },
  {
    id: 'daily_concentration_circle',
    name: 'Círculo de Concentração',
    summary: '90 min de foco',
    desc: 'Acumule 90 minutos de foco hoje.',
    getProgress: s => Math.min(s.todayMinutes, 90),
    target: 90,
    rewardGold: 270,
    rewardXp: 135,
  },
  {
    id: 'daily_half_heroic_journey',
    name: 'Meia Jornada Heroica',
    summary: '120 min de foco',
    desc: 'Acumule 120 minutos de foco hoje.',
    getProgress: s => Math.min(s.todayMinutes, 120),
    target: 120,
    rewardGold: 350,
    rewardXp: 175,
  },
  {
    id: 'daily_wall_150',
    name: 'Muralha dos 150 Minutos',
    summary: '150 min de foco',
    desc: 'Acumule 150 minutos de foco hoje.',
    getProgress: s => Math.min(s.todayMinutes, 150),
    target: 150,
    rewardGold: 420,
    rewardXp: 210,
  },
  {
    id: 'daily_great_vigil',
    name: 'Grande Vigília',
    summary: '180 min de foco',
    desc: 'Acumule 180 minutos de foco hoje.',
    getProgress: s => Math.min(s.todayMinutes, 180),
    target: 180,
    rewardGold: 500,
    rewardXp: 250,
  },

  // ── Wilderness ─────────────────────────────────────────────────────────────
  {
    id: 'daily_wilderness_step',
    name: 'Passo na Terra Selvagem',
    summary: '1 Wilderness',
    desc: 'Conclua 1 sessão Wilderness hoje.',
    getProgress: s => Math.min(todaySessions(s).filter(h => h.wilderness).length, 1),
    target: 1,
    rewardGold: 150,
    rewardXp: 80,
  },
  {
    id: 'daily_no_looking_back',
    name: 'Sem Olhar Para Trás',
    summary: 'Wilderness 25 min',
    desc: 'Conclua 1 sessão Wilderness de pelo menos 25 minutos hoje.',
    getProgress: s =>
      Math.min(todaySessions(s).filter(h => h.wilderness && h.duration >= 25).length, 1),
    target: 1,
    rewardGold: 200,
    rewardXp: 100,
  },
  {
    id: 'daily_border_scout',
    name: 'Batedor da Fronteira',
    summary: '40 min Wilderness',
    desc: 'Acumule 40 minutos em Wilderness hoje.',
    getProgress: s => {
      const total = todaySessions(s)
        .filter(h => h.wilderness)
        .reduce((acc, h) => acc + h.duration, 0);
      return Math.min(total, 40);
    },
    target: 40,
    rewardGold: 250,
    rewardXp: 120,
  },
  {
    id: 'daily_survive_wilds',
    name: 'Sobreviva ao Ermo',
    summary: '2 Wilderness',
    desc: 'Conclua 2 sessões Wilderness hoje.',
    getProgress: s => Math.min(todaySessions(s).filter(h => h.wilderness).length, 2),
    target: 2,
    rewardGold: 300,
    rewardXp: 150,
  },

  // ── Skills e Variedade ─────────────────────────────────────────────────────
  {
    id: 'daily_two_mastery_paths',
    name: 'Duas Trilhas de Maestria',
    summary: '2 skills hoje',
    desc: 'Estude 2 skills diferentes hoje.',
    getProgress: s => Math.min(todaySkillNames(s).length, 2),
    target: 2,
    rewardGold: 150,
    rewardXp: 75,
  },
  {
    id: 'daily_triad_of_knowledge',
    name: 'Tríade de Saberes',
    summary: '3 skills hoje',
    desc: 'Estude 3 skills diferentes hoje.',
    getProgress: s => Math.min(todaySkillNames(s).length, 3),
    target: 3,
    rewardGold: 220,
    rewardXp: 110,
  },
  {
    id: 'daily_weakest_link',
    name: 'Reforço do Elo Fraco',
    summary: 'Skill menor nível',
    desc: 'Faça uma sessão na skill de menor nível hoje.',
    getProgress: s => {
      const weak = weakestSkill(s);
      if (!weak) return 0;
      return todaySessions(s).some(h => h.skillName === weak) ? 1 : 0;
    },
    target: 1,
    rewardGold: 170,
    rewardXp: 85,
  },
  {
    id: 'daily_arcane_polish',
    name: 'Lapidação Arcana',
    summary: 'Ganhar XP hoje',
    desc: 'Ganhe XP em qualquer skill hoje.',
    getProgress: s => (s.todayXP > 0 ? 1 : 0),
    target: 1,
    rewardGold: 80,
    rewardXp: 40,
  },

  // ── Hábitos, Dailies e Todos ───────────────────────────────────────────────
  {
    id: 'daily_chapel_order',
    name: 'Capela em Ordem',
    summary: '1 Daily feita',
    desc: 'Complete 1 Daily da aba de tarefas.',
    getProgress: s => Math.min(s.dailies.filter(d => d.completed).length, 1),
    target: 1,
    rewardGold: 100,
    rewardXp: 50,
  },
  {
    id: 'daily_morning_ritual',
    name: 'Ritual Matinal',
    summary: '2 Dailies feitas',
    desc: 'Complete 2 Dailies hoje.',
    getProgress: s => Math.min(s.dailies.filter(d => d.completed).length, 2),
    target: 2,
    rewardGold: 160,
    rewardXp: 80,
  },
];

// ─── Rotation Logic ───────────────────────────────────────────────────────────

/**
 * Deterministic daily rotation: same 3 quests for everyone on the same calendar day.
 * Uses the date string as a seed so the result is stable across re-renders.
 */
function rotateDailyQuests(catalog: QuestDef[], count = 3): QuestDef[] {
  // Simple deterministic seed from today's date
  const seed = new Date().toDateString()
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  // Fisher-Yates with seeded LCG
  const arr = [...catalog];
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.slice(0, count);
}

// ─── Guild Quests (unchanged) ─────────────────────────────────────────────────

export function getRotatingDailyQuests(count = 3): QuestDef[] {
  return rotateDailyQuests(DAILY_QUEST_CATALOG, count);
}

export const guildQuests: QuestDef[] = [
  {
    id: 'guild_1',
    name: 'Iniciado da Guilda',
    desc: 'Atinja Combat Level 5 ou superior.',
    target: 5,
    rewardGold: 400,
    rewardXp: 200,
    getProgress: (s: CharacterState) => Math.min(s.combatLevel, 5),
  },
  {
    id: 'guild_2',
    name: 'Maratona Mágica',
    desc: 'Conclua um total de 12 sessões acumuladas.',
    target: 12,
    rewardGold: 500,
    rewardXp: 300,
    getProgress: (s: CharacterState) => Math.min(s.totalSessions, 12),
  },
  {
    id: 'guild_3',
    name: 'Campeão da Constância',
    desc: 'Atinja ou supere uma série recorde de 3 dias de estudo.',
    target: 3,
    rewardGold: 350,
    rewardXp: 150,
    getProgress: (s: CharacterState) => Math.min(s.bestStreak, 3),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const getQuestClaimId = (questId: string, date = new Date()) =>
  questId.startsWith('daily_')
    ? `claimed_${questId}_${date.toDateString()}`
    : `claimed_${questId}`;

export const isQuestClaimed = (
  state: CharacterState,
  questId: string,
  date = new Date()
) => {
  const claimHistory = state.achievements || [];
  const todayClaimKey = date.toDateString();

  if (!questId.startsWith('daily_')) {
    return claimHistory.includes(`claimed_${questId}`);
  }

  const datedClaim = getQuestClaimId(questId, date);
  const legacyClaimFromToday =
    state.todayDate === todayClaimKey && claimHistory.includes(`claimed_${questId}`);

  return claimHistory.includes(datedClaim) || legacyClaimFromToday;
};

export const QuestsTab: React.FC<QuestsTabProps> = ({ state, onClaimQuestReward }) => {
  // Stable rotation for today
  const todayDailyQuests = getRotatingDailyQuests(3);

  const handleClaim = (questId: string, gold: number, xp: number) => {
    sound.playCoins();
    onClaimQuestReward(gold, xp, questId);
  };

  type AnyQuest = { id: string; name: string; desc: string; target: number; rewardGold: number; rewardXp: number; getProgress: (s: CharacterState) => number };

  const renderQuestCard = (q: AnyQuest) => {
    const progress = q.getProgress(state);
    const isCompleted = progress >= q.target;
    const isClaimed = isQuestClaimed(state, q.id);

    return (
      <div
        key={q.id}
        className={`bg-stone-950/20 border rounded-lg p-3.5 transition-all relative overflow-hidden ${
          isClaimed
            ? 'border-emerald-500/10 opacity-60'
            : isCompleted
            ? 'border-amber-400 bg-amber-500/[0.03] shadow-[0_0_10px_rgba(232,201,106,0.15)]'
            : 'border-amber-500/10 hover:border-amber-500/20'
        }`}
      >
        <div className="flex justify-between items-start mb-2 gap-2">
          <div>
            <h4 className="font-serif font-bold text-sm text-amber-200 flex items-center gap-1.5">
              {q.name}
              {isCompleted && !isClaimed && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </h4>
            <p className="text-xs text-amber-100/50 leading-relaxed mt-0.5">{q.desc}</p>
          </div>
          {isClaimed && (
            <span className="text-emerald-400 text-xs font-serif font-medium flex items-center gap-1 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20">
              ✔️ Concluído
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1 mt-3">
          <div className="flex justify-between items-baseline text-[10px] font-mono font-bold">
            <span className="text-amber-100/30">Progresso</span>
            <span className={isCompleted ? 'text-amber-400' : 'text-stone-400'}>
              {progress} / {q.target}
            </span>
          </div>
          <div className="h-2 w-full bg-stone-900 border border-amber-500/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isCompleted
                  ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                  : 'bg-amber-600/40'
              }`}
              style={{ width: `${Math.min((progress / q.target) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Reward footer */}
        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-amber-500/5">
          <div className="flex gap-3 text-[11px] font-bold font-mono">
            <span className="text-amber-400">💎 {q.rewardGold} GP</span>
            <span className="text-emerald-400">⚡ {q.rewardXp} XP</span>
          </div>

          {isCompleted && !isClaimed ? (
            <button
              onClick={() => handleClaim(q.id, q.rewardGold, q.rewardXp)}
              className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold font-serif text-[11px] rounded uppercase tracking-wider cursor-pointer select-none transition-all shadow-[0_2px_4px_rgba(200,162,60,0.3)] shadow-inner"
            >
              Reivindicar
            </button>
          ) : isClaimed ? (
            <span className="text-[10px] text-amber-100/30 italic font-serif">Baú de espólios recolhido</span>
          ) : (
            <span className="text-[10px] text-amber-100/30 font-serif">Desbloqueia ao atingir progresso</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-5">
      {/* Daily Quests */}
      <div className="space-y-4">
        <div>
          <h3 className="font-serif text-lg text-amber-400 border-b border-amber-500/20 pb-2 mb-1 tracking-wider uppercase flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-500" />
            Proclamações do Dia (Diárias)
          </h3>
          <p className="text-[10px] text-amber-100/30 italic font-serif mb-4">
            Sorteio rotativo — 3 missões por dia. Renova à meia-noite.
          </p>
        </div>
        <div className="space-y-3">
          {todayDailyQuests.map(q => renderQuestCard({ ...q, getProgress: q.getProgress }))}
        </div>
      </div>

      {/* Guild Quests */}
      <div className="space-y-4 pt-4">
        <h3 className="font-serif text-lg text-amber-400 border-b border-amber-500/20 pb-2 mb-4 tracking-wider uppercase flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Teses de Campanha (Guilda)
        </h3>
        <div className="space-y-3">
          {guildQuests.map(q => renderQuestCard({ ...q, getProgress: q.getProgress }))}
        </div>
      </div>
    </div>
  );
};
