import React from 'react';
import { CharacterState } from '../../types';

export interface UseSkillsParams {
  gameState: CharacterState;
  setGameState: React.Dispatch<React.SetStateAction<CharacterState>>;
  isFocusSessionRunning: boolean;
  addSystemLog?: (msg: string, flash?: boolean) => void;
  muteSfx?: boolean;
  sound?: any;
  setCustomDialog?: (dialog: any) => void;
  setSelectedSkillIdx?: (idx: number) => void;
}

export interface UseSkillsReturn {
  addCustomSkill: (nameInput: string, emojiInput: string) => void;
  addTagToSkill: (skillIdx: number, newTag: string) => void;
  removeTagFromSkill: (skillIdx: number, tagIdx: number) => void;
  renameSkill: (idx: number, newName: string) => void;
  deleteSkill: (idx: number) => boolean;
  prestigeSkill: (idx: number) => void;
}

export function useSkills(params: UseSkillsParams): UseSkillsReturn {
  const {
    gameState,
    setGameState,
    isFocusSessionRunning,
    addSystemLog,
    muteSfx,
    sound,
    setCustomDialog,
    setSelectedSkillIdx,
  } = params;

  const addCustomSkill = (nameInput: string, emojiInput: string) => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    if (gameState.skills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      addSystemLog?.('❌ Erro: Alguma de suas Habilidades já possui este nome exato.', false);
      return;
    }

    setGameState(prev => {
      const addedSkill = { name: trimmed, level: 1, xp: 0, emoji: emojiInput, prestige: 0 };
      return {
        ...prev,
        skills: [...prev.skills, addedSkill]
      };
    });

    addSystemLog?.(`${emojiInput} Nova habilidade de foco incorporada: "${trimmed}"`, true);
  };

  const addTagToSkill = (skillIdx: number, newTag: string) => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    setGameState(prev => {
      const copySk = [...prev.skills];
      const sk = copySk[skillIdx];
      if (sk) {
        const currentTags = sk.tags || [];
        if (currentTags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
          return prev; // already exists
        }
        copySk[skillIdx] = {
          ...sk,
          tags: [...currentTags, trimmed]
        };
      }
      return { ...prev, skills: copySk };
    });
    addSystemLog?.(`🏷️ Subskill "${trimmed}" adicionada com sucesso!`, false);
  };

  const removeTagFromSkill = (skillIdx: number, tagIdx: number) => {
    const skillName = gameState.skills[skillIdx]?.name;
    const tagName = gameState.skills[skillIdx]?.tags?.[tagIdx];
    setGameState(prev => {
      const copySk = [...prev.skills];
      const sk = copySk[skillIdx];
      if (sk && sk.tags) {
        const newTags = [...sk.tags];
        newTags.splice(tagIdx, 1);
        copySk[skillIdx] = {
          ...sk,
          tags: newTags
        };
      }
      return { ...prev, skills: copySk };
    });
    if (tagName) addSystemLog?.(`🗑️ Subskill "${tagName}" removida de "${skillName}".`, false);
  };

  const renameSkill = (idx: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      addSystemLog?.('❌ Erro: O nome da habilidade não pode estar em branco.', false);
      return;
    }
    if (gameState.skills.some((s, sIdx) => sIdx !== idx && s.name.toLowerCase() === trimmed.toLowerCase())) {
      addSystemLog?.('❌ Erro: Outra habilidade de seu grimório já possui este nome exato.', false);
      return;
    }
    setGameState(prev => {
      const copySk = [...prev.skills];
      if (copySk[idx]) {
        copySk[idx] = { ...copySk[idx], name: trimmed };
      }
      return { ...prev, skills: copySk };
    });
    addSystemLog?.(`✍️ Habilidade renomeada para "${trimmed}" com sucesso!`, false);
  };

  const deleteSkill = (idx: number): boolean => {
    if (isFocusSessionRunning) {
      addSystemLog?.('❌ Bloqueado: Não é possível remover ou alterar habilidades enquanto uma sessão de foco estiver ativa.', false);
      return false;
    }

    if (gameState.skills.length <= 1) {
      setCustomDialog?.({
        isOpen: true,
        title: 'Falta de Habilidades',
        message: 'Seu personagem precisa ter pelo menos uma habilidade ativa remanescente!',
        isConfirm: false,
        onConfirm: () => setCustomDialog?.(null)
      });
      return false;
    }

    const removedName = gameState.skills[idx]?.name;
    const removedEmoji = gameState.skills[idx]?.emoji || '🎯';

    setCustomDialog?.({
      isOpen: true,
      title: 'Esquecer Habilidade?',
      message: `Tem certeza que deseja esquecer a habilidade "${removedEmoji} ${removedName}"? Todo o seu aprendizado e XP acumulados nela se perderão permanentemente.`,
      isConfirm: true,
      onConfirm: () => {
        setCustomDialog?.(null);
        setGameState(prev => {
          const copySk = [...prev.skills];
          copySk.splice(idx, 1);
          return {
            ...prev,
            skills: copySk
          };
        });

        setSelectedSkillIdx?.(0);
        addSystemLog?.(`🗑️ Esqueceu a Habilidade: "${removedEmoji} ${removedName}"`, false);
      }
    });

    return true;
  };

  const prestigeSkill = (idx: number) => {
    const sk = gameState.skills[idx];
    if (!sk) return;
    if (sk.level < 99) {
      addSystemLog?.(`⏳ Requisito Insuficiente: A habilidade "${sk.emoji || '🎯'} ${sk.name}" precisa alcançar o Nível 99 para obter Prestígio.`, false);
      return;
    }

    setCustomDialog?.({
      isOpen: true,
      title: '👑 Prestígio Transcendental',
      message: `Deseja reiniciar a habilidade "${sk.emoji || '🎯'} ${sk.name}"? Seu Nível voltará para 1 e o XP para 0. Em troca, ela receberá um multiplicador permanente de +25% de XP e um marcador visual exclusivo.`,
      isConfirm: true,
      onConfirm: () => {
        setCustomDialog?.(null);
        setGameState(prev => {
          const copySk = [...prev.skills];
          const currentPrestige = copySk[idx].prestige || 0;
          copySk[idx] = {
            ...copySk[idx],
            level: 1,
            xp: 0,
            prestige: currentPrestige + 1
          };
          return {
            ...prev,
            skills: copySk
          };
        });

        addSystemLog?.(`👑 PRESTÍGIO ALCANÇADO: Sua habilidade "${sk.emoji || '🎯'} ${sk.name}" alcançou o Prestígio Nível ${(sk.prestige || 0) + 1}! Bônus de XP definitivo ativo para esta habilidade!`, true);
        if (!muteSfx && sound?.playLevelUp) {
          sound.playLevelUp();
        }
      }
    });
  };

  return {
    addCustomSkill,
    addTagToSkill,
    removeTagFromSkill,
    renameSkill,
    deleteSkill,
    prestigeSkill,
  };
}
