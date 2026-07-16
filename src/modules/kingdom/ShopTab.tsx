import React from 'react';
import { InventoryItem } from '../../types';
import { ShoppingBag, ChevronRight, Coins } from 'lucide-react';
import { sound } from '../../utils/audio';

const SHOP_CATALOG: Omit<InventoryItem, 'id'>[] = [
  {
    name: 'Pergaminho de Espólios',
    emoji: '📜',
    desc: 'Dobra o ganho de Ouro (GP) base na próxima Missão de Foco.',
    price: 200,
    buff: 'DoubleLoot'
  },
  {
    name: 'Elixir do Foco Extremo',
    emoji: '⚗️',
    desc: 'Aumenta em +20% a quantidade de Experiência (XP) ganha na próxima sessão.',
    price: 150,
    buff: 'FocusElixir'
  },
  {
    name: 'Cristal da Clareza Rúnica',
    emoji: '💎',
    desc: 'Concede +100% de bônus base de XP nas próximas 2 sessões concluídas.',
    price: 400,
    buff: 'CrystalClarity'
  },
  {
    name: 'Runa das Riquezas',
    emoji: '🔮',
    desc: 'O herói sintoniza a sorte rúnica para dobrar as recompensas de Ouro.',
    price: 300,
    buff: 'RuneFortune'
  },
  {
    name: 'Escudo do Santuário',
    emoji: '🛡️',
    desc: 'Protege e congela automaticamente sua série de dias se você esquecer de focar um dia.',
    price: 500,
    buff: 'StreakShield'
  },
  {
    name: 'Coruja Pixelada',
    emoji: '🦉',
    desc: 'Equipável: +5% de XP em todas as sessões. (8 Cargas)',
    price: 250,
    buff: 'PixelOwl',
    isEquipment: true,
    charges: 8,
    maxCharges: 8
  },
  {
    name: 'Pena de Dragão',
    emoji: '🪶',
    desc: 'Equipável: +8% de XP em sessões de 45 min+. (8 Cargas)',
    price: 300,
    buff: 'DragonQuill',
    isEquipment: true,
    charges: 8,
    maxCharges: 8
  },
  {
    name: 'Bola de Cristal',
    emoji: '🔮',
    desc: 'Equipável: +10% de XP em todas as sessões. (10 Cargas)',
    price: 400,
    buff: 'CrystalBall',
    isEquipment: true,
    charges: 10,
    maxCharges: 10
  },
  {
    name: 'Tomo Antigo',
    emoji: '📖',
    desc: 'Equipável: +15% de XP em sessões de 60 min+. (8 Cargas)',
    price: 500,
    buff: 'AncientTome',
    isEquipment: true,
    charges: 8,
    maxCharges: 8
  }
];

interface ShopTabProps {
  gold: number;
  inventory: InventoryItem[];
  onBuyItem: (item: InventoryItem) => void;
}

export const ShopTab: React.FC<ShopTabProps> = ({ gold, inventory, onBuyItem }) => {
  const handlePurchase = (item: Omit<InventoryItem, 'id'>) => {
    if (gold < item.price) return;
    
    sound.playCoins();
    onBuyItem({
      ...item,
      id: `${item.buff}_${Date.now()}`
    });
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-5">
      <div className="space-y-3">
        {SHOP_CATALOG.map((item, idx) => {
          const canAfford = gold >= item.price;
          const isHoldingShield = item.buff === 'StreakShield' && inventory.some(i => i.buff === 'StreakShield');
          
          return (
            <div
              key={idx}
              className={`bg-stone-950/20 border rounded-lg p-3.5 flex items-center justify-between gap-4 transition-all ${
                canAfford ? 'border-amber-500/10 hover:border-amber-500/30' : 'border-stone-800 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg flex-shrink-0 flex items-center justify-center">
                  {item.emoji}
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-amber-200">{item.name}</h4>
                  <p className="text-xs text-amber-100/50 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                {isHoldingShield ? (
                  <span className="text-[10px] text-amber-500 font-serif font-semibold border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 rounded">
                    Já ativo
                  </span>
                ) : (
                  <button
                    disabled={!canAfford}
                    onClick={() => handlePurchase(item)}
                    className={`px-3 py-1.5 font-bold font-mono text-xs rounded border transition-all flex items-center gap-1 ${
                      canAfford
                        ? 'bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border-amber-500/40 cursor-pointer select-none active:scale-95'
                        : 'bg-stone-800/10 text-stone-500 border-stone-800'
                    }`}
                  >
                    <span>{item.price} GP</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
