import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InventoryItem } from '../types';
import { incrementModalCount, decrementModalCount } from '../utils/modalHelper';

export interface ItemInspectAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'success' | 'stone' | 'amber';
}

interface ItemInspectModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  actions?: ItemInspectAction[];
  showSlotSelector?: boolean;
  onSelectSlot?: (slotIdx: number) => void;
}

export const ItemInspectModal: React.FC<ItemInspectModalProps> = ({
  item,
  onClose,
  actions = [],
  showSlotSelector = false,
  onSelectSlot,
}) => {
  useEffect(() => {
    if (item) {
      incrementModalCount();
      return () => {
        decrementModalCount();
      };
    }
  }, [item]);

  // Map variant to Tailwind classes
  const getButtonClass = (variant: string = 'stone') => {
    const isSingle = actions.length === 1;
    switch (variant) {
      case 'success':
        return `${isSingle ? 'w-full' : 'flex-1'} py-2 px-3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 rounded text-xs font-serif font-bold uppercase tracking-wider text-center transition-all cursor-pointer`;
      case 'danger':
        return `${isSingle ? 'w-full' : ''} py-2 px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 rounded text-xs font-serif uppercase tracking-wider text-center transition-all cursor-pointer`;
      case 'primary':
      case 'amber':
        return `${isSingle ? 'w-full' : 'flex-1'} py-2 px-3 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 rounded text-xs font-serif uppercase tracking-wider text-center transition-all cursor-pointer`;
      case 'stone':
      default:
        return 'py-2 px-4 bg-stone-900 hover:bg-stone-850 border border-amber-500/20 text-amber-100/70 rounded text-xs font-serif uppercase tracking-wider cursor-pointer';
    }
  };

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Card Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-stone-950 border border-amber-500/20 max-w-sm w-full rounded-lg shadow-2xl overflow-hidden font-sans z-10"
          >
            <div className="p-4 bg-gradient-to-b from-stone-900 to-stone-950 border-b border-amber-500/10 flex items-center gap-3">
              <span className="text-3xl select-none">{item.emoji}</span>
              <div>
                <h4 className="font-serif font-black text-amber-400 uppercase tracking-widest text-sm">
                  {item.name}
                </h4>
                <span className="text-[9px] font-mono uppercase text-amber-100/40">
                  {item.isEquipment ? '🛡️ Equipamento Legendário' : '🎒 Relíquia Colecionável'}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-amber-100/80 leading-relaxed font-serif">
                {item.desc}
              </p>

              {item.isEquipment && (
                <div className="bg-amber-500/[0.04] border border-amber-500/20 p-2.5 rounded-lg text-center space-y-1">
                  <span className="text-[10px] uppercase font-serif text-amber-400 block tracking-wider">
                    📦 Informações de Durabilidade
                  </span>
                  <span className="text-sm font-mono font-bold text-emerald-400 block">
                    🔋 {item.charges} / {item.maxCharges || 8} Cargas
                  </span>
                  <span className="text-[9px] text-amber-100/50 block font-serif">
                    Perde 1 de durabilidade toda vez que for ativado ao completar uma sessão de foco.
                  </span>
                </div>
              )}

              <div className="space-y-2">
                {showSlotSelector && item.isEquipment && onSelectSlot && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono block text-amber-100/30">
                      Selecione o espaço para equipar:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((slotIdx) => (
                        <button
                          key={slotIdx}
                          onClick={() => {
                            onSelectSlot(slotIdx);
                          }}
                          className="py-1.5 px-2 bg-stone-900 hover:bg-amber-500 hover:text-stone-950 border border-amber-500/20 rounded text-[10px] font-serif font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                        >
                          Slot {slotIdx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {actions.length > 0 && (
                  <div className="flex gap-2 pt-2 border-t border-amber-500/5">
                    {actions.map((action, actionIdx) => (
                      <button
                        key={actionIdx}
                        onClick={action.onClick}
                        className={getButtonClass(action.variant)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-stone-900/40 border-t border-amber-500/10 flex justify-end">
              <button
                onClick={onClose}
                className="py-1.5 px-4 bg-stone-900 hover:bg-stone-850 border border-amber-500/20 text-amber-100/70 rounded text-xs font-serif uppercase tracking-wider cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
