import { BuffType } from '../../types';

export interface LootItem {
  name: string;
  emoji: string;
  desc: string;
  buff: BuffType;
  price: number;
  isEquipment: boolean;
  charges: number;
  maxCharges: number;
  rarity: 'comum' | 'especial';
}

export const LOOT_TABLE: LootItem[] = [
  // Raridade ESPECIAL
  {
    name: 'Coruja Pixelada',
    emoji: '🦉',
    desc: 'Equipável: +5% de XP em todas as sessões. (8 Cargas)',
    buff: 'PixelOwl',
    price: 250,
    isEquipment: true,
    charges: 8,
    maxCharges: 8,
    rarity: 'especial'
  },
  {
    name: 'Pena de Dragão',
    emoji: '🪶',
    desc: 'Equipável: +8% de XP em sessões de 45 min+. (8 Cargas)',
    buff: 'DragonQuill',
    price: 300,
    isEquipment: true,
    charges: 8,
    maxCharges: 8,
    rarity: 'especial'
  },
  {
    name: 'Bola de Cristal',
    emoji: '🔮',
    desc: 'Equipável: +10% de XP em todas as sessões. (10 Cargas)',
    buff: 'CrystalBall',
    price: 400,
    isEquipment: true,
    charges: 10,
    maxCharges: 10,
    rarity: 'especial'
  },
  {
    name: 'Tomo Antigo',
    emoji: '📖',
    desc: 'Equipável: +15% de XP em sessões de 60 min+. (8 Cargas)',
    buff: 'AncientTome',
    price: 500,
    isEquipment: true,
    charges: 8,
    maxCharges: 8,
    rarity: 'especial'
  },

  // Raridade COMUM
  {
    name: 'Grimório de Prata',
    emoji: '📚',
    desc: 'Equipável: +1% de XP em todas as sessões. (5 Cargas)',
    buff: 'SilverGrimoire',
    price: 80,
    isEquipment: true,
    charges: 5,
    maxCharges: 5,
    rarity: 'comum'
  },
  {
    name: 'Pergaminho Antigo',
    emoji: '📜',
    desc: 'Equipável: +1% de Ouro em todas as sessões. (5 Cargas)',
    buff: 'AncientScroll',
    price: 80,
    isEquipment: true,
    charges: 5,
    maxCharges: 5,
    rarity: 'comum'
  },
  {
    name: 'Poção Celestina',
    emoji: '🧪',
    desc: 'Equipável: +2% de XP em sessões de 30 min+. (4 Cargas)',
    buff: 'CelestinePotion',
    price: 100,
    isEquipment: true,
    charges: 4,
    maxCharges: 4,
    rarity: 'comum'
  },
  {
    name: 'Fécula de Estrelas',
    emoji: '✨',
    desc: 'Equipável: +2% de Ouro em sessões de 30 min+. (4 Cargas)',
    buff: 'StarPowder',
    price: 100,
    isEquipment: true,
    charges: 4,
    maxCharges: 4,
    rarity: 'comum'
  },
  {
    name: 'Broche de Ouro',
    emoji: '🏅',
    desc: 'Equipável: +1% de XP e +1% de Ouro em todas as sessões. (5 Cargas)',
    buff: 'GoldBrooch',
    price: 90,
    isEquipment: true,
    charges: 5,
    maxCharges: 5,
    rarity: 'comum'
  },
  {
    name: 'Grimório Lendário do Caos',
    emoji: '🔮',
    desc: 'Equipável: +2% de XP em todas as sessões. (5 Cargas)',
    buff: 'ChaosGrimoire',
    price: 110,
    isEquipment: true,
    charges: 5,
    maxCharges: 5,
    rarity: 'comum'
  },
  {
    name: 'Espada do Foco Inabalável',
    emoji: '🗡️',
    desc: 'Equipável: +2% de Ouro em todas as sessões. (5 Cargas)',
    buff: 'UnwaveringSword',
    price: 110,
    isEquipment: true,
    charges: 5,
    maxCharges: 5,
    rarity: 'comum'
  },
  {
    name: 'Cálice Sagrado da Sabedoria',
    emoji: '🏆',
    desc: 'Equipável: +1% de XP e +1% de Ouro. (5 Cargas)',
    buff: 'SacredChalice',
    price: 100,
    isEquipment: true,
    charges: 5,
    maxCharges: 5,
    rarity: 'comum'
  },
  {
    name: 'Relíquia Secreta Arcana',
    emoji: '🔱',
    desc: 'Equipável: +3% de XP em sessões de 45 min+. (4 Cargas)',
    buff: 'ArcaneRelic',
    price: 130,
    isEquipment: true,
    charges: 4,
    maxCharges: 4,
    rarity: 'comum'
  },
  {
    name: 'Pedra Filosofal Rúnica',
    emoji: '💎',
    desc: 'Equipável: +3% de Ouro em sessões de 45 min+. (4 Cargas)',
    buff: 'RunicStone',
    price: 130,
    isEquipment: true,
    charges: 4,
    maxCharges: 4,
    rarity: 'comum'
  }
];
