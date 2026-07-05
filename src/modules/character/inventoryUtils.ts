import { InventoryItem } from '../../types';

/**
 * Adds an item to the character's inventory in an immutable way.
 * Returns the updated inventory array.
 */
export function addItemToInventory(inventory: InventoryItem[], item: Omit<InventoryItem, 'id'> & { id?: string }): InventoryItem[] {
  const finalId = item.id || `item_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const newItem: InventoryItem = {
    ...item,
    id: finalId,
  };
  return [...inventory, newItem];
}
