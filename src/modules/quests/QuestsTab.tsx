import React from 'react';
import { Target, Trophy } from 'lucide-react';
import { sound } from '../../utils/audio';
import { ProcessedQuest } from './useQuestProgress';

interface QuestsTabProps {
  dailyQuests: ProcessedQuest[];
  guildQuests: ProcessedQuest[];
  onClaimQuestReward: (gold: number, xp: number, questId: string) => void;
  activeSubTab?: 'daily' | 'journey';
}

export const QuestsTab: React.FC<QuestsTabProps> = ({
  dailyQuests,
  guildQuests,
  onClaimQuestReward,
  activeSubTab = 'daily',
}) => {
  const handleClaim = (questId: string, gold: number, xp: number) => {
    sound.playCoins();
    onClaimQuestReward(gold, xp, questId);
  };

  const renderQuestCard = (q: ProcessedQuest) => {
    const { progress, isCompleted, isClaimed } = q;

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
      {activeSubTab === 'daily' && (
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-medium text-amber-200/70 mb-4">
              Sorteio rotativo — 3 missões por dia. Renova à meia-noite.
            </p>
          </div>
          <div className="space-y-3">
            {dailyQuests.map(q => renderQuestCard(q))}
          </div>
        </div>
      )}

      {/* Guild Quests */}
      {activeSubTab === 'journey' && (
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-medium text-amber-200/70 mb-4">
              Marcos de progresso do herói e conquistas de longo prazo.
            </p>
          </div>
          <div className="space-y-3">
            {guildQuests.map(q => renderQuestCard(q))}
          </div>
        </div>
      )}
    </div>
  );
};
