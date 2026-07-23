export const BASE_LOOT_CHANCE = {
  SHORT: 0.25,   // < 50 min
  MEDIUM: 0.45,  // 50 - 89 min
  LONG: 0.70,    // >= 90 min
  DUNGEON: 0.40, // Dungeon mode (fixed per roll)
} as const;

export const TITLE_LOOT_MULTIPLIERS: Record<string, number> = {
  TRANSCENDENT: 1.00, // +100%
  CELESTIAL: 1.00,    // +100%
  SHADOW: 0.75,       // +75%
  VOIDWALKER: 0.50,   // +50%
  IMMORTAL_SCHOLAR: 0.50, // +50%
  NOCTURNAL: 0.30,    // +30%
};

export const MAX_LOOT_CHANCE_CAP = 0.95;

export interface LootChanceResult {
  baseChance: number;
  lootRateMultiplier: number;
  finalChance: number;
}

export function calculateLootChance(
  studiedMinutes: number,
  isDungeon: boolean,
  equippedTitleId?: string | null
): LootChanceResult {
  let baseChance: number = BASE_LOOT_CHANCE.SHORT;
  if (isDungeon) {
    baseChance = BASE_LOOT_CHANCE.DUNGEON;
  } else if (studiedMinutes >= 90) {
    baseChance = BASE_LOOT_CHANCE.LONG;
  } else if (studiedMinutes >= 50) {
    baseChance = BASE_LOOT_CHANCE.MEDIUM;
  }

  let bonus = 0;
  if (equippedTitleId && equippedTitleId in TITLE_LOOT_MULTIPLIERS) {
    bonus = TITLE_LOOT_MULTIPLIERS[equippedTitleId];
  }
  const lootRateMultiplier = 1.0 + bonus;

  const finalChance = Math.min(MAX_LOOT_CHANCE_CAP, baseChance * lootRateMultiplier);

  return {
    baseChance,
    lootRateMultiplier,
    finalChance,
  };
}
