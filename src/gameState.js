// Core game data and balance constants for Haggle.

export const GAME_CONFIG = {
  startingGold: 500,
  startingShelves: 4,
  totalDebt: 2500,
  loanPayment: 500,
  loanIntervalDays: 7,
  baseCustomersPerDay: 4,
  maxCustomersPerDay: 8,
  shelfUpgradeCostPerShelf: 150,
  maxShelves: 10,
};

// How many customers visit on a given day, scaled by reputation.
export function customersPerDay(reputation) {
  const bonus = Math.floor(Math.max(0, reputation) / 8);
  return Math.min(
    GAME_CONFIG.maxCustomersPerDay,
    GAME_CONFIG.baseCustomersPerDay + bonus
  );
}

export function shelfUpgradeCost(currentShelves) {
  return currentShelves * GAME_CONFIG.shelfUpgradeCostPerShelf;
}

// Reputation thresholds for wholesale market tiers
export const MARKET_TIER_THRESHOLDS = {
  Common: -Infinity,
  Uncommon: 10,
  Rare: 25,
};

// Reputation thresholds for customer tiers (index = tier)
export const CUSTOMER_TIER_THRESHOLDS = [-Infinity, 5, 15];

export function reputationTitle(reputation) {
  if (reputation < 0) return 'Suspected Swindler';
  if (reputation < 10) return 'Unknown Shopkeep';
  if (reputation < 25) return 'Respected Merchant';
  if (reputation < 40) return 'Renowned Trader';
  return 'Legendary Haggler';
}

export const ITEM_TIERS = ['Common', 'Uncommon', 'Rare'];

export const WHOLESALE_ITEMS = [
  // Common (always available)
  { id: 'wh001', name: 'Healing Potion', emoji: '🧪', category: 'potion', tier: 'Common', wholesalePrice: 10, baseValue: 40 },
  { id: 'wh002', name: 'Mana Potion', emoji: '⚗️', category: 'potion', tier: 'Common', wholesalePrice: 12, baseValue: 50 },
  { id: 'wh007', name: 'Rope (50ft)', emoji: '🪢', category: 'tool', tier: 'Common', wholesalePrice: 4, baseValue: 16 },
  { id: 'wh008', name: 'Torch', emoji: '🔥', category: 'tool', tier: 'Common', wholesalePrice: 2, baseValue: 8 },
  { id: 'wh006', name: 'Lockpicks', emoji: '🗝️', category: 'tool', tier: 'Common', wholesalePrice: 6, baseValue: 25 },
  { id: 'wh005', name: 'Wooden Shield', emoji: '🛡️', category: 'shield', tier: 'Common', wholesalePrice: 20, baseValue: 80 },
  { id: 'wh011', name: 'Dagger', emoji: '🔪', category: 'weapon', tier: 'Common', wholesalePrice: 15, baseValue: 65 },
  { id: 'wh012', name: "Traveler's Cloak", emoji: '🧥', category: 'armor', tier: 'Common', wholesalePrice: 12, baseValue: 50 },
  { id: 'wh013', name: 'Smelling Salts', emoji: '🧂', category: 'misc', tier: 'Common', wholesalePrice: 4, baseValue: 18 },

  // Uncommon (Rep >= 10)
  { id: 'wh003', name: 'Iron Sword', emoji: '⚔️', category: 'weapon', tier: 'Uncommon', wholesalePrice: 100, baseValue: 180 },
  { id: 'wh004', name: 'Leather Armor', emoji: '🦺', category: 'armor', tier: 'Uncommon', wholesalePrice: 80, baseValue: 150 },
  { id: 'wh009', name: 'Greater Healing Potion', emoji: '🏺', category: 'potion', tier: 'Uncommon', wholesalePrice: 75, baseValue: 150 },
  { id: 'wh010', name: 'Steel Shield', emoji: '🔰', category: 'shield', tier: 'Uncommon', wholesalePrice: 120, baseValue: 220 },
  { id: 'wh014', name: 'Crossbow', emoji: '🏹', category: 'weapon', tier: 'Uncommon', wholesalePrice: 150, baseValue: 280 },
  { id: 'wh015', name: 'Chain Shirt', emoji: '⛓️', category: 'armor', tier: 'Uncommon', wholesalePrice: 180, baseValue: 350 },
  { id: 'wh016', name: 'Tindertwig', emoji: '🧨', category: 'tool', tier: 'Uncommon', wholesalePrice: 20, baseValue: 45 },
  { id: 'wh017', name: 'Spyglass', emoji: '🔭', category: 'misc', tier: 'Uncommon', wholesalePrice: 200, baseValue: 400 },
  { id: 'wh024', name: 'Enchanted Quill', emoji: '🪶', category: 'misc', tier: 'Uncommon', wholesalePrice: 60, baseValue: 120 },

  // Rare (Rep >= 25)
  { id: 'wh018', name: 'Potion of Strength', emoji: '💪', category: 'potion', tier: 'Rare', wholesalePrice: 250, baseValue: 500 },
  { id: 'wh019', name: 'Steel Longsword', emoji: '🗡️', category: 'weapon', tier: 'Rare', wholesalePrice: 400, baseValue: 750 },
  { id: 'wh020', name: 'Plate Mail', emoji: '🥇', category: 'armor', tier: 'Rare', wholesalePrice: 600, baseValue: 1100 },
  { id: 'wh021', name: 'Amulet of Warding', emoji: '📿', category: 'misc', tier: 'Rare', wholesalePrice: 500, baseValue: 1000 },
  { id: 'wh022', name: 'Masterwork Lockpicks', emoji: '🔐', category: 'tool', tier: 'Rare', wholesalePrice: 150, baseValue: 300 },
  { id: 'wh023', name: 'Elixir of Invisibility', emoji: '👻', category: 'potion', tier: 'Rare', wholesalePrice: 300, baseValue: 600 },
];

export const CUSTOMER_TYPES = [
  // Tier 0 — common folk
  {
    name: 'Nervous Apprentice', portrait: '🧑‍🎓',
    description: 'a young apprentice clutching a small coin purse',
    personalityTraits: ['timid', 'easily impressed', 'frugal'],
    budget: 60, interests: ['potion', 'tool'], tier: 0,
  },
  {
    name: 'Weary Farmer', portrait: '🧑‍🌾',
    description: 'a farmer looking for simple tools or protection',
    personalityTraits: ['practical', 'frugal', 'honest'],
    budget: 80, interests: ['tool', 'shield', 'general'], tier: 0,
  },
  {
    name: 'City Guard', portrait: '💂',
    description: 'an off-duty member of the city watch, looking weary',
    personalityTraits: ['dutiful', 'observant', 'weary', 'fair', 'slightly suspicious'],
    budget: 70, interests: ['general', 'weapon', 'armor', 'tool'], tier: 0,
  },
  {
    name: 'Local Crafter', portrait: '🧑‍🔧',
    description: 'a local artisan looking for tools or materials',
    personalityTraits: ['practical', 'focused', 'frugal', 'knowledgeable about crafts'],
    budget: 90, interests: ['tool', 'misc', 'general'], tier: 0,
  },
  {
    name: 'Errand Runner', portrait: '🏃',
    description: 'a youngster sent on an errand, clutching a note',
    personalityTraits: ['distracted', 'impatient', 'easily confused', "frugal with someone else's money"],
    budget: 50, interests: ['general', 'potion', 'tool'], tier: 0,
  },
  {
    name: 'Traveling Peddler', portrait: '🧳',
    description: 'a dusty peddler looking to restock cheap wares',
    personalityTraits: ['stingy', 'talkative', 'observant', 'always looking for a deal'],
    budget: 60, interests: ['general', 'tool', 'misc'], tier: 0,
  },
  {
    name: 'Village Elder', portrait: '🧓',
    description: 'an elderly villager leaning on a cane',
    personalityTraits: ['patient', 'kind', 'forgetful', 'storyteller', 'frugal'],
    budget: 40, interests: ['potion', 'general', 'misc'], tier: 0,
  },
  {
    name: 'Concerned Parent', portrait: '👪',
    description: 'a worried parent looking for something for their child',
    personalityTraits: ['cautious', 'protective', 'frugal', 'anxious'],
    budget: 80, interests: ['shield', 'armor', 'misc'], tier: 0,
  },

  // Tier 1 — professionals (Rep >= 5)
  {
    name: 'Gruff Mercenary', portrait: '🧔',
    description: 'a battle-scarred mercenary looking for functional gear',
    personalityTraits: ['practical', 'impatient', 'fair'],
    budget: 250, interests: ['weapon', 'armor', 'potion'], tier: 1,
  },
  {
    name: 'Curious Scholar', portrait: '🤓',
    description: 'a scholar interested in unusual items',
    personalityTraits: ['curious', 'patient', 'distracted'],
    budget: 120, interests: ['potion', 'tool', 'misc'], tier: 1,
  },
  {
    name: 'Eager Adventurer', portrait: '🤺',
    description: 'bright-eyed and equipped for a journey',
    personalityTraits: ['brave', 'optimistic', 'practical', 'sometimes reckless'],
    budget: 150, interests: ['weapon', 'tool', 'potion', 'armor'], tier: 1,
  },
  {
    name: "Noble's Attendant", portrait: '🤵',
    description: 'a servant in fine livery, looking slightly stressed',
    personalityTraits: ['dutiful', 'discreet', 'slightly arrogant', "budget-conscious with the employer's money"],
    budget: 120, interests: ['general', 'misc', 'potion'], tier: 1,
  },
  {
    name: 'Hedge Wizard', portrait: '🧙',
    description: 'smells faintly of sulfur, peering intently at ingredients',
    personalityTraits: ['curious', 'focused', 'eccentric', 'knowledgeable about the arcane'],
    budget: 200, interests: ['potion', 'misc', 'tool'], tier: 1,
  },
  {
    name: 'Guild Artisan', portrait: '🧑‍🎨',
    description: 'a skilled artisan looking for quality tools or components',
    personalityTraits: ['detail-oriented', 'proud', 'fair', 'values quality'],
    budget: 180, interests: ['tool', 'misc', 'armor'], tier: 1,
  },
  {
    name: 'Retired Soldier', portrait: '🪖',
    description: 'carries themselves with discipline, looking for reliable gear',
    personalityTraits: ['practical', 'disciplined', 'nostalgic', 'fair', 'observant'],
    budget: 140, interests: ['weapon', 'armor', 'shield', 'tool'], tier: 1,
  },

  // Tier 2 — deep pockets (Rep >= 15)
  {
    name: 'Shrewd Trader', portrait: '🧐',
    description: 'a traveling trader with a keen eye for value',
    personalityTraits: ['calculating', 'patient', 'stingy', 'knowledgeable'],
    budget: 300, interests: ['general', 'tool', 'misc'], tier: 2,
  },
  {
    name: 'Flustered Noble', portrait: '👑',
    description: 'a minor noble, clearly out of their element',
    personalityTraits: ['arrogant', 'impatient', 'distracted', 'impulsive', 'generous'],
    budget: 450, interests: ['armor', 'weapon', 'misc'], tier: 2,
  },
  {
    name: 'Dragon-Slayer Captain', portrait: '🐉',
    description: 'a famous adventuring captain outfitting a dangerous expedition',
    personalityTraits: ['bold', 'decisive', 'generous', 'values quality', 'in a hurry'],
    budget: 700, interests: ['weapon', 'armor', 'potion'], tier: 2,
  },
];

// Minor random traits added per visit for flavor
export const MINOR_TRAITS = [
  'in a hurry', 'distracted', 'cheerful', 'grumpy',
  'curious', 'suspicious', 'talkative', 'quiet',
];

export function getEligibleCustomers(reputation) {
  let maxTier = 0;
  for (let i = CUSTOMER_TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (reputation >= CUSTOMER_TIER_THRESHOLDS[i]) { maxTier = i; break; }
  }
  return CUSTOMER_TYPES.filter((c) => c.tier <= maxTier);
}

export function getAvailableWholesale(reputation) {
  return WHOLESALE_ITEMS.filter(
    (item) => reputation >= (MARKET_TIER_THRESHOLDS[item.tier] ?? 0)
  );
}

// Default asking price when an item is placed on the shelf.
export function defaultAskingPrice(item) {
  return Math.round(item.baseValue * 1.2);
}

export function createInitialState() {
  return {
    version: 2,
    day: 1,
    gold: GAME_CONFIG.startingGold,
    phase: 'management', // 'management' | 'setting up' | 'selling'
    inventory: [],
    displayedItems: [],
    shopShelves: GAME_CONFIG.startingShelves,
    dialogue: [
      {
        speaker: 'system',
        text: 'You have the keys to your very own shop — and the 2,500g debt that came with it. Buy stock from the wholesale market, then start the day.',
      },
    ],
    currentCustomer: null,
    currentNegotiation: null,
    customersServedToday: 0,
    reputation: 0,
    loanPayment: GAME_CONFIG.loanPayment,
    loanDueDay: GAME_CONFIG.loanIntervalDays,
    totalLoanOwed: GAME_CONFIG.totalDebt,
    gameOver: false,
    victory: false,
    daySummary: null,
    dayStats: { revenue: 0, itemsSold: 0, customersServed: 0, failed: 0 },
    stats: { itemsSold: 0, totalRevenue: 0, totalSpent: 0, failedNegotiations: 0, bestFlip: null },
  };
}
