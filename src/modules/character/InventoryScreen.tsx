import React from 'react';
import { InventoryItem } from '../../types';
import { ItemInspectModal } from '../../components/ItemInspectModal';

export interface InventoryScreenProps {
  inventory: InventoryItem[];
  inspectingItem: InventoryItem | null;
  onInspectItem: (item: InventoryItem) => void;
  onCloseInspection: () => void;
  onEquipItem: (item: InventoryItem, slotIdx: number) => void;
  onSellItem: (item: InventoryItem) => void;
  onDiscardItem: (item: InventoryItem) => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  inventory,
  inspectingItem,
  onInspectItem,
  onCloseInspection,
  onEquipItem,
  onSellItem,
  onDiscardItem,
}) => {
  // Filter out the virtual buffs/consumables from showing as physical backpack inventory items
  const physicalItems = inventory.filter(
    (i) => !['DoubleLoot', 'FocusElixir', 'CrystalClarity', 'RuneFortune', 'StreakShield'].includes(i.buff)
  );

  return (
    <>
      {/* COLLECTED BAG ITEMS VIEWPORT */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-serif font-bold tracking-wider uppercase text-amber-100/40 pb-0.5 border-b border-amber-500/5">
          Mochila de Relíquias & Itens
        </h4>
        <div className="grid grid-cols-5 gap-1.5 max-h-[120px] overflow-y-auto pr-0.5">
          {physicalItems.length > 0 ? (
            physicalItems.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => onInspectItem(item)}
                className={`aspect-square bg-stone-900 border ${
                  item.isEquipment
                    ? 'border-amber-500/40 bg-amber-500/[0.03] hover:border-amber-400'
                    : 'border-amber-500/10 hover:border-amber-500/30'
                } rounded flex items-center justify-center text-xl cursor-pointer transition-all active:scale-95`}
                title={`${item.name} — Clique para interagir`}
              >
                {item.emoji}
              </div>
            ))
          ) : (
            <div className="col-span-5 text-[10px] italic text-amber-100/35 font-serif py-1 animate-pulse">
              Mochila vazia. Drops ocorrem ao concluir focos ou compre no Bazar.
            </div>
          )}
        </div>
      </div>

      {/* ITEM INSPECTION MODAL */}
      <ItemInspectModal
        item={inspectingItem}
        onClose={onCloseInspection}
        showSlotSelector={true}
        onSelectSlot={(slotIdx) => onEquipItem(inspectingItem!, slotIdx)}
        actions={inspectingItem ? [
          {
            label: `💰 Vender (${inspectingItem.isEquipment ? Math.floor(inspectingItem.price * 0.5) : 50} GP)`,
            onClick: () => onSellItem(inspectingItem),
            variant: 'success',
          },
          {
            label: 'Descartar',
            onClick: () => onDiscardItem(inspectingItem),
            variant: 'danger',
          }
        ] : []}
      />
    </>
  );
};
