import React from 'react';
import { CharacterState, InventoryItem } from '../../types';
import { addItemToInventory } from '../character/inventoryUtils';

export interface UseShopParams {
  gameState: CharacterState;
  setGameState: React.Dispatch<React.SetStateAction<CharacterState>>;
  addSystemLog?: (msg: string, flash?: boolean) => void;
}

export interface UseShopReturn {
  buyGoblinShopItem: (item: InventoryItem) => void;
}

export function useShop(params: UseShopParams): UseShopReturn {
  const { gameState, setGameState, addSystemLog } = params;

  const buyGoblinShopItem = (item: InventoryItem) => {
    setGameState(prev => {
      if (prev.gold < item.price) return prev;
      return {
        ...prev,
        gold: prev.gold - item.price,
        inventory: addItemToInventory(prev.inventory, item)
      };
    });
    addSystemLog?.(`🎒 Comprado no Bazar: ${item.emoji} "${item.name}" por ${item.price} GP!`, true);
  };

  return {
    buyGoblinShopItem,
  };
}
