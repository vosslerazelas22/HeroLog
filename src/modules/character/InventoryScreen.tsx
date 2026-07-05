import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InventoryItem } from '../../types';

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
      <AnimatePresence>
        {inspectingItem && (
          <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-950 border border-amber-500/20 max-w-sm w-full rounded-lg shadow-2xl overflow-hidden font-sans"
            >
              <div className="p-4 bg-gradient-to-b from-stone-900 to-stone-950 border-b border-amber-500/10 flex items-center gap-3">
                <span className="text-3xl select-none">{inspectingItem.emoji}</span>
                <div>
                  <h4 className="font-serif font-black text-amber-400 uppercase tracking-widest text-sm">
                    {inspectingItem.name}
                  </h4>
                  <span className="text-[9px] font-mono uppercase text-amber-100/40">
                    {inspectingItem.isEquipment ? '🛡️ Equipamento Legendário' : '🎒 Relíquia Colecionável'}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <p className="text-xs text-amber-100/80 leading-relaxed font-serif">
                  {inspectingItem.desc}
                </p>

                {inspectingItem.isEquipment && (
                  <div className="bg-amber-500/[0.04] border border-amber-500/20 p-2.5 rounded-lg text-center space-y-1">
                    <span className="text-[10px] uppercase font-serif text-amber-400 block tracking-wider">
                      📦 Informações de Durabilidade
                    </span>
                    <span className="text-sm font-mono font-bold text-emerald-400 block">
                      🔋 {inspectingItem.charges} / {inspectingItem.maxCharges || 8} Cargas
                    </span>
                    <span className="text-[9px] text-amber-100/50 block font-serif">
                      Perde 1 de durabilidade toda vez que for ativado ao completar uma sessão de foco.
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  {inspectingItem.isEquipment && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-mono block text-amber-100/30">
                        Selecione o espaço para equipar:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[0, 1, 2].map((slotIdx) => (
                          <button
                            key={slotIdx}
                            onClick={() => {
                              onEquipItem(inspectingItem, slotIdx);
                            }}
                            className="py-1.5 px-2 bg-stone-900 hover:bg-amber-500 hover:text-stone-950 border border-amber-500/20 rounded text-[10px] font-serif font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                          >
                            Slot {slotIdx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-amber-500/5">
                    <button
                      onClick={() => {
                        onSellItem(inspectingItem);
                      }}
                      className="flex-1 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 rounded text-xs font-serif font-bold uppercase tracking-wider text-center transition-all cursor-pointer"
                    >
                      💰 Vender ({inspectingItem.isEquipment ? Math.floor(inspectingItem.price * 0.5) : 50} GP)
                    </button>
                    <button
                      onClick={() => {
                        onDiscardItem(inspectingItem);
                      }}
                      className="py-2 px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 rounded text-xs font-serif uppercase tracking-wider text-center transition-all cursor-pointer"
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-900/40 border-t border-amber-500/10 flex justify-end">
                <button
                  onClick={() => onCloseInspection()}
                  className="py-1.5 px-4 bg-stone-900 hover:bg-stone-850 border border-amber-500/20 text-amber-100/70 rounded text-xs font-serif uppercase tracking-wider cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
