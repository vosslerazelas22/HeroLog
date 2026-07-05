import React from 'react';
import { CharacterState } from '../../types';

export interface UseTitlesParams {
  gameState: CharacterState;
  setGameState: React.Dispatch<React.SetStateAction<CharacterState>>;
  addSystemLog?: (msg: string, flash?: boolean) => void;
  muteSfx?: boolean;
  sound?: any;
}

export interface UseTitlesReturn {
  equipTitle: (titleId: string | null) => void;
  buyTitle: (titleId: string, price: number) => void;
  claimAchievementTitle: (titleId: string) => void;
}

export function useTitles(params: UseTitlesParams): UseTitlesReturn {
  const { gameState, setGameState, addSystemLog, muteSfx, sound } = params;

  const equipTitle = (titleId: string | null) => {
    setGameState(prev => {
      return {
        ...prev,
        equippedTitle: titleId
      };
    });
    if (titleId) {
      addSystemLog?.(`👑 TÍTULO EQUIPADO: Agora você ostenta o título de [${titleId}]! Seus buffs de passivos agora estão ativos.`, true);
      if (!muteSfx && sound?.playCoins) {
        sound.playCoins();
      }
    } else {
      addSystemLog?.('👑 TÍTULO REVEZADO: Você desequipou seu título honorário.', false);
    }
  };

  const buyTitle = (titleId: string, price: number) => {
    setGameState(prev => {
      if (prev.gold < price) return prev;
      const nextOwned = [...(prev.ownedTitles || [])];
      if (!nextOwned.includes(titleId)) {
        nextOwned.push(titleId);
      }
      return {
        ...prev,
        gold: prev.gold - price,
        ownedTitles: nextOwned
      };
    });
    addSystemLog?.(`👑 TÍTULO ADQUIRIDO: Você obteve o brasão honorário de [${titleId}] por ${price} GP!`, true);
    if (!muteSfx && sound?.playCoins) {
      sound.playCoins();
    }
  };

  const claimAchievementTitle = (titleId: string) => {
    setGameState(prev => {
      const nextOwned = [...(prev.ownedTitles || [])];
      if (!nextOwned.includes(titleId)) {
        nextOwned.push(titleId);
      }
      return {
        ...prev,
        ownedTitles: nextOwned
      };
    });
    addSystemLog?.(`🏆 RESGATE DE SUPREMACIA: Você resgatou e desbloqueou com sucesso o título de Conquista [${titleId}]!`, true);
    if (!muteSfx && sound?.playLevelUp) {
      sound.playLevelUp();
    }
  };

  return {
    equipTitle,
    buyTitle,
    claimAchievementTitle,
  };
}
