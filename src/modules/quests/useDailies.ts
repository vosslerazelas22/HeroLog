import React from 'react';
import { CharacterState, Daily } from '../../types';
import { sound } from '../../utils/audio';
import { getDifficultyRewards } from './useHabits';

export function useDailies(
  gameState: CharacterState,
  setGameState: React.Dispatch<React.SetStateAction<CharacterState>>,
  addSystemLog: (msg: string, isPositive?: boolean) => void,
  muteSfx: boolean
) {
  const handleToggleDaily = (dailyId: string) => {
    const daily = gameState.dailies.find(d => d.id === dailyId);
    if (!daily) return;

    const isCompleting = !daily.completed;
    const { xp, gold } = getDifficultyRewards(daily.difficulty);

    setGameState(prev => {
      let finalGold = gold;
      let finalXP = xp;
      let updatedDailies = prev.dailies;

      if (isCompleting) {
        let mulXP = 1.0;
        let mulGold = 1.0;
        if (prev.charClass === 'Mage') mulXP += 0.2;
        if (prev.charClass === 'Warrior') mulGold += 0.2;

        finalGold = Math.floor(gold * mulGold);
        finalXP = Math.floor(xp * mulXP);

        updatedDailies = prev.dailies.map(d => {
          if (d.id === dailyId) {
            return { ...d, completed: true, streak: d.streak + 1 };
          }
          return d;
        });

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
            addSystemLog(`🆙 COMBAT LEVEL UP: Nível de combate heróico subiu para ${currentCombatLevel}! HP restaurado!`, true);
            if (!muteSfx) sound.playLevelUp();
          }, 100);
        }

        setTimeout(() => {
          addSystemLog(`📅 Voto Diário Cumprido: Concluiu "${daily.title}"! (+${finalGold} GP, +${finalXP} XP, Streak: ${daily.streak + 1} dias)`, true);
          if (!muteSfx) sound.playCoins();
        }, 10);

        return {
          ...prev,
          gold: prev.gold + finalGold,
          totalGoldEarned: prev.totalGoldEarned + finalGold,
          totalXP: prev.totalXP + finalXP,
          combatLevel: currentCombatLevel,
          combatXP: combatXPApplied,
          hp: nextHp,
          dailies: updatedDailies
        };
      } else {
        let mulXP = 1.0;
        let mulGold = 1.0;
        if (prev.charClass === 'Mage') mulXP += 0.2;
        if (prev.charClass === 'Warrior') mulGold += 0.2;

        finalGold = Math.floor(gold * mulGold);
        finalXP = Math.floor(xp * mulXP);

        updatedDailies = prev.dailies.map(d => {
          if (d.id === dailyId) {
            return { ...d, completed: false, streak: Math.max(0, d.streak - 1) };
          }
          return d;
        });

        let combatXPApplied = prev.combatXP - finalXP;
        let currentCombatLevel = prev.combatLevel;

        while (combatXPApplied < 0 && currentCombatLevel > 1) {
          currentCombatLevel -= 1;
          const requirement = currentCombatLevel * 100;
          combatXPApplied += requirement;
        }
        if (combatXPApplied < 0) combatXPApplied = 0;

        setTimeout(() => {
          addSystemLog(`↩️ Reversão de Voto: Diária "${daily.title}" desmarcada. Perdidos -${finalGold} GP e -${finalXP} XP.`);
        }, 10);

        return {
          ...prev,
          gold: Math.max(0, prev.gold - finalGold),
          totalGoldEarned: Math.max(0, prev.totalGoldEarned - finalGold),
          totalXP: Math.max(0, prev.totalXP - finalXP),
          combatLevel: currentCombatLevel,
          combatXP: combatXPApplied,
          dailies: updatedDailies
        };
      }
    });
  };

  const handleToggleDailyChecklistItem = (dailyId: string, itemId: string) => {
    setGameState(prev => {
      const updatedDailies = prev.dailies.map(d => {
        if (d.id === dailyId) {
          const updatedChecklist = d.checklist.map(item => {
            if (item.id === itemId) {
              return { ...item, completed: !item.completed };
            }
            return item;
          });
          return { ...d, checklist: updatedChecklist };
        }
        return d;
      });
      return {
        ...prev,
        dailies: updatedDailies
      };
    });
  };

  const handleAddDaily = (newDaily: Omit<Daily, 'id' | 'completed' | 'checklist'> & { checklist: string[] }) => {
    setGameState(prev => {
      const formattedChecklist = newDaily.checklist.map((text, idx) => ({
        id: `dc-${Date.now()}-${idx}`,
        text,
        completed: false
      }));

      const added: Daily = {
        id: `d-${Date.now()}`,
        title: newDaily.title,
        notes: newDaily.notes,
        difficulty: newDaily.difficulty,
        completed: false,
        streak: newDaily.streak,
        repeats: newDaily.repeats,
        every: newDaily.every,
        tags: newDaily.tags,
        checklist: formattedChecklist,
      };

      return {
        ...prev,
        dailies: [...prev.dailies, added]
      };
    });
    addSystemLog(`📅 Novo Voto de Diária Consagrado: "${newDaily.title}"!`);
  };

  const handleEditDaily = (edited: Daily) => {
    setGameState(prev => ({
      ...prev,
      dailies: prev.dailies.map(d => d.id === edited.id ? edited : d)
    }));
    addSystemLog(`⚙️ Diária Modificada: "${edited.title}" atualizada.`);
  };

  const handleDeleteDaily = (dailyId: string) => {
    setGameState(prev => ({
      ...prev,
      dailies: prev.dailies.filter(d => d.id !== dailyId)
    }));
    addSystemLog(`🗑️ Voto de Diária Aniquilado.`);
  };

  return {
    dailies: gameState.dailies,
    onToggleDaily: handleToggleDaily,
    onToggleChecklistItem: handleToggleDailyChecklistItem,
    onAddDaily: handleAddDaily,
    onEditDaily: handleEditDaily,
    onDeleteDaily: handleDeleteDaily
  };
}
