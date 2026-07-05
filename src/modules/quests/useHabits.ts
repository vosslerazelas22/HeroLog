import React from 'react';
import { CharacterState, Habit } from '../../types';
import { sound } from '../../utils/audio';

// Helper to get difficulty rewards (same as in App.tsx)
export const getDifficultyRewards = (difficulty: 'Trivial' | 'Easy' | 'Medium' | 'Hard') => {
  switch (difficulty) {
    case 'Trivial':
      return { xp: 4, gold: 2, damage: 1 };
    case 'Easy':
      return { xp: 12, gold: 6, damage: 3 };
    case 'Medium':
      return { xp: 28, gold: 14, damage: 7 };
    case 'Hard':
      return { xp: 60, gold: 25, damage: 15 };
    default:
      return { xp: 12, gold: 6, damage: 3 };
  }
};

export function useHabits(
  gameState: CharacterState,
  setGameState: React.Dispatch<React.SetStateAction<CharacterState>>,
  addSystemLog: (msg: string, isPositive?: boolean) => void,
  muteSfx: boolean,
  setIsPlayerDead: (dead: boolean) => void
) {
  const handleTriggerHabit = (habitId: string, isUp: boolean) => {
    const habit = gameState.habits.find(h => h.id === habitId);
    if (!habit) return;

    const { xp, gold, damage } = getDifficultyRewards(habit.difficulty);

    if (isUp) {
      setGameState(prev => {
        let mulXP = 1.0;
        let mulGold = 1.0;
        if (prev.charClass === 'Mage') mulXP += 0.2;
        if (prev.charClass === 'Warrior') mulGold += 0.2;

        const finalGold = Math.floor(gold * mulGold);
        const finalXP = Math.floor(xp * mulXP);

        let combatXPApplied = prev.combatXP + finalXP;
        let currentCombatLevel = prev.combatLevel;
        let requirement = currentCombatLevel * 100;
        let didLevelUp = false;

        while (combatXPApplied >= requirement) {
          combatXPApplied -= requirement;
          currentCombatLevel += 1;
          requirement = currentCombatLevel * 100;
          didLevelUp = true;
        }

        const nextHp = didLevelUp ? prev.maxHp : prev.hp;

        if (didLevelUp) {
          setTimeout(() => {
            addSystemLog(`🆙 COMBAT LEVEL UP: Nível de combate militar subiu para ${currentCombatLevel}! Vitalidade restaurada!`, true);
            if (!muteSfx) sound.playLevelUp();
          }, 100);
        }

        const updatedHabits = prev.habits.map(h => {
          if (h.id === habitId) {
            return { ...h, upCount: h.upCount + 1, streak: h.streak + 1, lastTriggeredDate: new Date().toDateString() };
          }
          return h;
        });

        return {
          ...prev,
          gold: prev.gold + finalGold,
          totalGoldEarned: prev.totalGoldEarned + finalGold,
          totalXP: prev.totalXP + finalXP,
          combatLevel: currentCombatLevel,
          combatXP: combatXPApplied,
          hp: nextHp,
          habits: updatedHabits
        };
      });

      if (!muteSfx) sound.playCoins();
      addSystemLog(`✨ Prática Virtuosa: Completou o hábito positivo "${habit.title}"! Ganhou +${gold} GP e +${xp} XP.`, true);
    } else {
      setGameState(prev => {
        let finalDamage = damage;
        if (prev.charClass === 'Ranger') finalDamage = Math.max(1, Math.floor(damage * 0.7));

        const nextHp = Math.max(0, prev.hp - finalDamage);
        const didDie = nextHp === 0;

        if (didDie) {
          setTimeout(() => {
            setIsPlayerDead(true);
            if (!muteSfx) sound.playDeath();
          }, 100);
        }

        const updatedHabits = prev.habits.map(h => {
          if (h.id === habitId) {
            return { ...h, downCount: h.downCount + 1, streak: Math.max(0, h.streak - 1), lastTriggeredDate: new Date().toDateString() };
          }
          return h;
        });

        return {
          ...prev,
          hp: nextHp,
          habits: updatedHabits
        };
      });

      if (!muteSfx) {
        try {
          sound.playWildernessWarning();
        } catch {}
      }
      addSystemLog(`⚠️ Desvio Espiritual: Sofreu dano pelo hábito negativo "${habit.title}"! Perdeu -${damage} HP de sua integridade.`, false);
    }
  };

  const handleAddHabit = (newHabit: Omit<Habit, 'id' | 'upCount' | 'downCount' | 'streak'>) => {
    setGameState(prev => {
      const added: Habit = {
        ...newHabit,
        id: `h-${Date.now()}`,
        upCount: 0,
        downCount: 0,
        streak: 0,
      };
      return {
        ...prev,
        habits: [...prev.habits, added]
      };
    });
    addSystemLog(`🔥 Runas Consagradas: Novo hábito "${newHabit.title}" adicionado à sua capela diária!`);
  };

  const handleEditHabit = (edited: Habit) => {
    setGameState(prev => ({
      ...prev,
      habits: prev.habits.map(h => h.id === edited.id ? edited : h)
    }));
    addSystemLog(`⚙️ Runas Alteradas: Hábito "${edited.title}" atualizado.`);
  };

  const handleDeleteHabit = (habitId: string) => {
    setGameState(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== habitId)
    }));
    addSystemLog(`🗑️ Runas Banidas: Hábito removido com sucesso.`);
  };

  return {
    habits: gameState.habits,
    onTriggerHabit: handleTriggerHabit,
    onAddHabit: handleAddHabit,
    onEditHabit: handleEditHabit,
    onDeleteHabit: handleDeleteHabit
  };
}
