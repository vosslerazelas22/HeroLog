import React from 'react';
import { CharacterState, Todo } from '../../types';
import { sound } from '../../utils/audio';
import { getDifficultyRewards } from './useHabits';

export function useTodos(
  gameState: CharacterState,
  setGameState: React.Dispatch<React.SetStateAction<CharacterState>>,
  addSystemLog: (msg: string, isPositive?: boolean) => void,
  muteSfx: boolean
) {
  const handleToggleTodo = (todoId: string) => {
    const todo = gameState.todos.find(t => t.id === todoId);
    if (!todo) return;

    const isCompleting = !todo.completed;
    const { xp, gold } = getDifficultyRewards(todo.difficulty);

    setGameState(prev => {
      let finalGold = gold;
      let finalXP = xp;
      let updatedTodos = prev.todos;

      if (isCompleting) {
        let mulXP = 1.0;
        let mulGold = 1.0;
        if (prev.charClass === 'Mage') mulXP += 0.2;
        if (prev.charClass === 'Warrior') mulGold += 0.2;

        finalGold = Math.floor(gold * mulGold);
        finalXP = Math.floor(xp * mulXP);

        updatedTodos = prev.todos.map(t => {
          if (t.id === todoId) {
            return { ...t, completed: true };
          }
          return t;
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
          addSystemLog(`✔️ Afazer Cumprido: Concluiu aventura "${todo.title}"! (+${finalGold} GP, +${finalXP} XP!)`, true);
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
          todos: updatedTodos
        };
      } else {
        let mulXP = 1.0;
        let mulGold = 1.0;
        if (prev.charClass === 'Mage') mulXP += 0.2;
        if (prev.charClass === 'Warrior') mulGold += 0.2;

        finalGold = Math.floor(gold * mulGold);
        finalXP = Math.floor(xp * mulXP);

        updatedTodos = prev.todos.map(t => {
          if (t.id === todoId) {
            return { ...t, completed: false };
          }
          return t;
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
          addSystemLog(`↩️ Reversão de Contrato: Afazer "${todo.title}" reaberto. Perdidos -${finalGold} GP e -${finalXP} XP.`);
        }, 10);

        return {
          ...prev,
          gold: Math.max(0, prev.gold - finalGold),
          totalGoldEarned: Math.max(0, prev.totalGoldEarned - finalGold),
          totalXP: Math.max(0, prev.totalXP - finalXP),
          combatLevel: currentCombatLevel,
          combatXP: combatXPApplied,
          todos: updatedTodos
        };
      }
    });
  };

  const handleToggleTodoChecklistItem = (todoId: string, itemId: string) => {
    setGameState(prev => {
      const updatedTodos = prev.todos.map(t => {
        if (t.id === todoId) {
          const updatedChecklist = t.checklist.map(item => {
            if (item.id === itemId) {
              return { ...item, completed: !item.completed };
            }
            return item;
          });
          return { ...t, checklist: updatedChecklist };
        }
        return t;
      });
      return {
        ...prev,
        todos: updatedTodos
      };
    });
  };

  const handleAddTodo = (newTodo: Omit<Todo, 'id' | 'completed' | 'checklist'> & { checklist: string[] }) => {
    setGameState(prev => {
      const formattedChecklist = newTodo.checklist.map((text, idx) => ({
        id: `tc-${Date.now()}-${idx}`,
        text,
        completed: false
      }));

      const added: Todo = {
        id: `t-${Date.now()}`,
        title: newTodo.title,
        notes: newTodo.notes,
        difficulty: newTodo.difficulty,
        completed: false,
        tags: newTodo.tags,
        checklist: formattedChecklist,
      };

      return {
        ...prev,
        todos: [...prev.todos, added]
      };
    });
    addSystemLog(`📜 Novo Contrato / Afazer em mãos: "${newTodo.title}"!`);
  };

  const handleEditTodo = (edited: Todo) => {
    setGameState(prev => ({
      ...prev,
      todos: prev.todos.map(t => t.id === edited.id ? edited : t)
    }));
    addSystemLog(`⚙️ Afazer Editado: "${edited.title}" atualizado.`);
  };

  const handleDeleteTodo = (todoId: string) => {
    setGameState(prev => ({
      ...prev,
      todos: prev.todos.filter(t => t.id !== todoId)
    }));
    addSystemLog(`🗑️ Contrato de Afazer Destruído.`);
  };

  return {
    todos: gameState.todos,
    onToggleTodo: handleToggleTodo,
    onToggleChecklistItem: handleToggleTodoChecklistItem,
    onAddTodo: handleAddTodo,
    onEditTodo: handleEditTodo,
    onDeleteTodo: handleDeleteTodo
  };
}
