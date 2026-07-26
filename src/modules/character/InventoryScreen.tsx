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
        {physicalItems.length > 0 ? (
          physicalItems.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => onInspectItem(item)}
              className={`py-3.5 px-3 bg-stone-900 border ${
                item.isEquipment
                  ? 'border-amber-500/40 bg-amber-500/[0.04] hover:border-amber-400'
                  : 'border-amber-500/10 bg-stone-900/60 hover:border-amber-500/30'
              } rounded-lg flex items-center gap-3 cursor-pointer transition-all active:scale-[0.99] group`}
              title={`${item.name} — Clique para interagir`}
            >
              {/* Ícone em destaque à esquerda (~60px) */}
              <div
                className={`w-[60px] h-[60px] shrink-0 rounded-md bg-stone-950/70 border ${
                  item.isEquipment ? 'border-amber-500/30' : 'border-stone-800'
                } flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform`}
              >
                {item.emoji}
              </div>

              {/* Nome, Badge de Raridade e Descrição */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-amber-100 truncate group-hover:text-amber-300 transition-colors">
                    {item.name}
                  </span>

                  {item.rarity && (
                    <span
                      className={`shrink-0 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        item.rarity === 'especial'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-stone-800/80 text-stone-400 border-stone-700'
                      }`}
                    >
                      {item.rarity === 'especial' ? 'Especial' : 'Comum'}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-stone-400 truncate leading-tight font-serif">
                  {item.desc}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-[10px] italic text-amber-100/35 font-serif py-3 text-center animate-pulse border border-dashed border-amber-500/10 rounded-lg bg-stone-900/30">
            Mochila vazia. Drops ocorrem ao concluir focos ou compre no Bazar.
          </div>
        )}
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
