import React, { useState } from 'react';
import { CharacterState, InventoryItem } from '../../types';
import { addItemToInventory } from './inventoryUtils';

export interface UseInventoryParams {
  gameState: CharacterState;
  setGameState: React.Dispatch<React.SetStateAction<CharacterState>>;
  addSystemLog?: (msg: string, flash?: boolean) => void;
  muteSfx?: boolean;
  sound?: any;
}

export interface UseInventoryReturn {
  inspectingItem: InventoryItem | null;
  inspectItem: (item: InventoryItem) => void;
  closeInspection: () => void;
  equipItem: (item: InventoryItem, slotIdx: number) => void;
  unequipItem: (slotIdx: number) => void;
  sellItem: (item: InventoryItem) => void;
  discardItem: (item: InventoryItem) => void;
}

export function useInventory(params: UseInventoryParams): UseInventoryReturn {
  const { gameState, setGameState, addSystemLog, muteSfx, sound } = params;
  const [inspectingItem, setInspectingItem] = useState<InventoryItem | null>(null);

  const inspectItem = (item: InventoryItem) => {
    setInspectingItem(item);
  };

  const closeInspection = () => {
    setInspectingItem(null);
  };

  const equipItem = (item: InventoryItem, slotIdx: number) => {
    setGameState(prev => {
      const equipped = prev.equippedEquipment ? [...prev.equippedEquipment] : [null, null, null];
      let inventory = [...prev.inventory];

      // Remove item from inventory
      const invIdx = inventory.findIndex(i => i.id === item.id);
      if (invIdx >= 0) {
        inventory.splice(invIdx, 1);
      }

      // If there's already an item in that slot, return it to inventory using helper
      const existing = equipped[slotIdx];
      if (existing) {
        inventory = addItemToInventory(inventory, existing);
      }

      // Equip the new item
      equipped[slotIdx] = { ...item };

      return {
        ...prev,
        inventory,
        equippedEquipment: equipped
      };
    });

    addSystemLog?.(`⚔️ EQUIPADO: "${item.emoji} ${item.name}" foi colocado no Espaço de Equipamento ${slotIdx + 1}!`, true);
    if (!muteSfx && sound?.playCoins) {
      sound.playCoins();
    }
    // Also, if the inspected item is the one being equipped, update inspection or close it if no longer in inventory
    setInspectingItem(null);
  };

  const unequipItem = (slotIdx: number) => {
    setGameState(prev => {
      const equipped = prev.equippedEquipment ? [...prev.equippedEquipment] : [null, null, null];
      let inventory = [...prev.inventory];

      const item = equipped[slotIdx];
      if (!item) return prev;

      equipped[slotIdx] = null;
      inventory = addItemToInventory(inventory, item);

      return {
        ...prev,
        inventory,
        equippedEquipment: equipped
      };
    });

    addSystemLog?.('⚔️ DESEQUIPADO: Item retornado para a mochila.', false);
  };

  const sellItem = (item: InventoryItem) => {
    // Standard sale: 50% of buying price if equipment, 50 GP if drop
    const sellingPrice = item.isEquipment ? Math.floor(item.price * 0.5) : 50;

    setGameState(prev => {
      const inventory = prev.inventory.filter(i => i.id !== item.id);
      return {
        ...prev,
        gold: prev.gold + sellingPrice,
        inventory
      };
    });

    addSystemLog?.(`💰 VENDIDO: Você vendeu "${item.emoji} ${item.name}" por ${sellingPrice} GP!`, true);
    if (!muteSfx && sound?.playCoins) {
      sound.playCoins();
    }
    setInspectingItem(null);
  };

  const discardItem = (item: InventoryItem) => {
    setGameState(prev => {
      const inventory = prev.inventory.filter(i => i.id !== item.id);
      return {
        ...prev,
        inventory
      };
    });
    addSystemLog?.(`🎒 DESCARTADO: Você descartou o item "${item.emoji} ${item.name}".`, false);
    setInspectingItem(null);
  };

  return {
    inspectingItem,
    inspectItem,
    closeInspection,
    equipItem,
    unequipItem,
    sellItem,
    discardItem,
  };
}
