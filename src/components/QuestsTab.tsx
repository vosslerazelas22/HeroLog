import React from 'react';
import { CharacterState } from '../types';
import { Target, Trophy, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/audio';

interface QuestsTabProps {
  state: CharacterState;
  onClaimQuestReward: (gold: number, xp: number, questId: string) => void;
}

export const QuestsTab: React.FC<QuestsTabProps> = ({ state, onClaimQuestReward }) => {
  const todayClaimKey = new Date().toDateString();
  const isQuestClaimed = (questId: string) => {
    const claimHistory = state.achievements || [];
    if (!questId.startsWith('daily_')) return claimHistory.includes(`claimed_${questId}`);

    const datedClaim = `claimed_${questId}_${todayClaimKey}`;
    const legacyClaimFromToday = state.todayDate === todayClaimKey && claimHistory.includes(`claimed_${questId}`);
    return claimHistory.includes(datedClaim) || legacyClaimFromToday;
  };

  // We establish standard quests built on current study metrics dynamically
  const dailyQuests = [
    {
      id: 'daily_1',
      name: 'Devotamento Diário',
      desc: 'Complete pelo menos uma sessão de estudo hoje.',
      progress: state.todayMinutes > 0 ? 1 : 0,
      target: 1,
      rewardGold: 100,
      rewardXp: 50,
    },
    {
      id: 'daily_2',
      name: 'Diligência Extrema',
      desc: 'Acumule 50 minutos de estudo concentrado hoje.',
      progress: Math.min(state.todayMinutes, 50),
      target: 50,
      rewardGold: 250,
      rewardXp: 120,
    },
    {
      id: 'daily_3',
      name: 'Ouro do Conhecimento',
      desc: 'Estude na perigosa floresta de Wilderness hoje.',
      progress: state.history.some(h => {
        const todayStr = new Date().toLocaleDateString('pt-BR');
        return h.date.includes(todayStr) && h.wilderness;
      }) ? 1 : 0,
      target: 1,
      rewardGold: 150,
      rewardXp: 80,
    }
  ];

  const guildQuests = [
    {
      id: 'guild_1',
      name: 'Iniciado da Guilda',
      desc: 'Atinja Combat Level 5 ou superior.',
      progress: Math.min(state.combatLevel, 5),
      target: 5,
      rewardGold: 400,
      rewardXp: 200,
    },
    {
      id: 'guild_2',
      name: 'Maratona Mágica',
      desc: 'Conclua um total de 12 sessões acumuladas.',
      progress: Math.min(state.totalSessions, 12),
      target: 12,
      rewardGold: 500,
      rewardXp: 300,
    },
    {
      id: 'guild_3',
      name: 'Campeão da Constância',
      desc: 'Atinja ou supere uma série recorde de 3 dias de estudo.',
      progress: Math.min(state.bestStreak, 3),
      target: 3,
      rewardGold: 350,
      rewardXp: 150,
    }
  ];

  const handleClaim = (questId: string, gold: number, xp: number) => {
    sound.playCoins();
    onClaimQuestReward(gold, xp, questId);
  };

  const renderQuestCard = (q: typeof dailyQuests[0]) => {
    const isCompleted = q.progress >= q.target;
    // Checked if this quest is already claimed (we can save claimed quests array if desired,
    // but a lightweight pattern checks if they successfully fulfill states or toggled state tracker)
    const isClaimed = isQuestClaimed(q.id);

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
              {q.progress} / {q.target}
            </span>
          </div>
          <div className="h-2 w-full bg-stone-900 border border-amber-500/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isCompleted
                  ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                  : 'bg-amber-600/40'
              }`}
              style={{ width: `${(q.progress / q.target) * 100}%` }}
            />
          </div>
        </div>

        {/* Reward claims footer */}
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
      {/* Daily lists */}
      <div className="space-y-4">
        <h3 className="font-serif text-lg text-amber-400 border-b border-amber-500/20 pb-2 mb-4 tracking-wider uppercase flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-500" />
          Proclamações do Dia (Diárias)
        </h3>
        <div className="space-y-3">
          {dailyQuests.map(renderQuestCard)}
        </div>
      </div>

      {/* Campaign goals */}
      <div className="space-y-4 pt-4">
        <h3 className="font-serif text-lg text-amber-400 border-b border-amber-500/20 pb-2 mb-4 tracking-wider uppercase flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Teses de Campanha (Guilda)
        </h3>
        <div className="space-y-3">
          {guildQuests.map(renderQuestCard)}
        </div>
      </div>
    </div>
  );
};
