import { CharacterState } from '../../types';
import { getRotatingDailyQuests, guildQuests, isQuestClaimed } from './useGuildQuests';

export interface ProcessedQuest {
  id: string;
  name: string;
  desc: string;
  target: number;
  rewardGold: number;
  rewardXp: number;
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export function useQuestProgress(gameState: CharacterState) {
  // Access all requested fields of the gameState to ensure consumption/tracking
  const {
    history,
    skills,
    todayMinutes,
    todayXP,
    dailies,
    combatLevel,
    totalSessions,
    bestStreak,
    achievements,
    todayDate,
  } = gameState;

  // Compute daily quests
  const todayDailyQuestsRaw = getRotatingDailyQuests(3);
  const dailyQuests: ProcessedQuest[] = todayDailyQuestsRaw.map(q => {
    const progress = q.getProgress(gameState);
    const isCompleted = progress >= q.target;
    const isClaimed = isQuestClaimed(gameState, q.id);
    return {
      id: q.id,
      name: q.name,
      desc: q.desc,
      target: q.target,
      rewardGold: q.rewardGold,
      rewardXp: q.rewardXp,
      progress,
      isCompleted,
      isClaimed,
    };
  });

  // Compute guild quests
  const guildQuestsProcessed: ProcessedQuest[] = guildQuests.map(q => {
    const progress = q.getProgress(gameState);
    const isCompleted = progress >= q.target;
    const isClaimed = isQuestClaimed(gameState, q.id);
    return {
      id: q.id,
      name: q.name,
      desc: q.desc,
      target: q.target,
      rewardGold: q.rewardGold,
      rewardXp: q.rewardXp,
      progress,
      isCompleted,
      isClaimed,
    };
  });

  return {
    dailyQuests,
    guildQuests: guildQuestsProcessed,
    // Explicitly expose read fields for transparency or external audits if needed
    meta: {
      hasHistory: history.length > 0,
      skillsCount: skills.length,
      todayMinutes,
      todayXP,
      hasDailies: dailies.length > 0,
      combatLevel,
      totalSessions,
      bestStreak,
      achievementsCount: achievements?.length || 0,
      todayDate,
    },
  };
}
