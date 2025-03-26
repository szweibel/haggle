export const initialState = {
  day: 1,
  gold: 500, // Lowered starting gold
  phase: 'management', // Start in management phase for buying
  time: 'night', // Corresponds to phase: morning=morning, selling=day, management=night (Adjust time too)
  inventory: [],
  displayedItems: [],
  shopShelves: 4,
  dialogue: [],
  currentCustomer: null,
  currentNegotiation: null,
  webllmStatus: 'Loading...',
  uiAreas: {
    nextCustomerButton: null,
    advanceTimeButton: null,
    acceptOfferButton: null,
    counterOfferButton: null
  },
  reputation: 0, // Player's reputation score
  loanAmount: 500, // Amount due each week
  loanDueDate: 7, // Day the next loan payment is due
  totalLoanOwed: 5000, // Total outstanding debt
  gameOver: false // Game over state
};

// Define item categories used in interests
// const ITEM_CATEGORIES = ['potion', 'weapon', 'armor', 'shield', 'tool', 'general'];

export const CUSTOMER_TYPES = [
  {
    name: 'Nervous Apprentice',
    description: 'a young apprentice clutching a small coin purse',
    personalityTraits: ['timid', 'easily impressed', 'frugal'],
    budget: 60, // Lowered
    interests: ['potion', 'tool'],
    tier: 0 // Common customer
  },
  {
    name: 'Weary Farmer', // Moved farmer to tier 0
    description: 'a farmer looking for simple tools or protection',
    personalityTraits: ['practical', 'frugal', 'honest'],
    budget: 80, // Lowered
    interests: ['tool', 'shield', 'general'],
    tier: 0 // Common customer
  },
  {
    name: 'Gruff Mercenary',
    description: 'a battle-scarred mercenary looking for functional gear',
    personalityTraits: ['practical', 'impatient', 'fair'],
    budget: 250, // Lowered
    interests: ['weapon', 'armor', 'potion'],
    tier: 1 // Uncommon customer
  },
   {
    name: 'Curious Scholar', // Moved scholar to tier 1
    description: 'a scholar interested in unusual items',
    personalityTraits: ['curious', 'patient', 'distracted'],
    budget: 120, // Lowered
    interests: ['potion', 'tool', 'misc'], // Added misc interest
    tier: 1 // Uncommon customer
  },
  {
    name: 'Shrewd Trader',
    description: 'a traveling trader with a keen eye for value',
    personalityTraits: ['calculating', 'patient', 'stingy', 'knowledgeable'],
    budget: 300, // Lowered
    interests: ['general', 'tool', 'misc'], // Added misc interest
    tier: 2 // Rare customer
  },
  {
    name: 'Flustered Noble',
    description: 'a minor noble, clearly out of their element',
    personalityTraits: ['arrogant', 'impatient', 'distracted', 'impulsive', 'generous'], // Added generous paradox
    budget: 400, // Lowered significantly
    interests: ['armor', 'weapon', 'misc'], // Added misc interest
    tier: 2 // Rare customer
  }
];
// NOTE: The 'personality' field is no longer used directly in Controls.jsx prompt,
// it relies on 'personalityTraits' now. We need to update the prompt generation.

// New Color Palette for a Fantasy Shop Theme
export const COLORS = {
  background: '#2E2925',      // Dark wood/stone background
  panel: '#F5EEDC',          // Parchment/beige panels
  panelStroke: '#C8BBAE',      // Muted brown stroke for panels
  text: '#3A3531',          // Dark brown text for readability on parchment
  textLight: '#7A7067',      // Lighter brown for secondary text
  textGold: '#E6A800',      // Brighter, richer gold
  textDanger: '#C0392B',      // Deep red for danger/errors
  textAccent: '#27AE60',      // Muted green for success/accent
  button: '#795548',          // Wood/leather brown button
  buttonHover: '#5D4037',      // Darker brown on hover
  buttonStroke: '#4E342E',      // Darkest brown for button stroke
  highlight: 'rgba(230, 168, 0, 0.2)', // Subtle gold highlight
  dragHighlight: 'rgba(121, 85, 72, 0.3)', // Brownish drag highlight
  dropHighlight: 'rgba(39, 174, 96, 0.2)'  // Greenish drop highlight
};

export const UI_PADDING = 16; // Keeping padding the same for now

// Define item categories used in interests and items
export const ITEM_CATEGORIES = ['potion', 'weapon', 'armor', 'shield', 'tool', 'misc'];
export const ITEM_TIERS = ['Common', 'Uncommon', 'Rare'];

// Items available for purchase during the management phase
export const WHOLESALE_ITEMS = [
  // Common Items (Tier 0 - Always Available) - Lowered Wholesale Prices
  { id: 'wh001', name: 'Healing Potion', category: 'potion', tier: 'Common', wholesalePrice: 10, baseValue: 40 }, // W:10, BV:40
  { id: 'wh002', name: 'Mana Potion', category: 'potion', tier: 'Common', wholesalePrice: 12, baseValue: 50 }, // W:12, BV:50
  { id: 'wh007', name: 'Rope (50ft)', category: 'tool', tier: 'Common', wholesalePrice: 4, baseValue: 16 }, // W:4, BV:16
  { id: 'wh008', name: 'Torch', category: 'tool', tier: 'Common', wholesalePrice: 2, baseValue: 8 }, // W:2, BV:8
  { id: 'wh006', name: 'Lockpicks', category: 'tool', tier: 'Common', wholesalePrice: 6, baseValue: 25 }, // W:6, BV:25
  { id: 'wh005', name: 'Wooden Shield', category: 'shield', tier: 'Common', wholesalePrice: 20, baseValue: 80 }, // W:20, BV:80
  { id: 'wh011', name: 'Dagger', category: 'weapon', tier: 'Common', wholesalePrice: 15, baseValue: 65 }, // W:15, BV:65
  { id: 'wh012', name: 'Traveler\'s Cloak', category: 'armor', tier: 'Common', wholesalePrice: 12, baseValue: 50 }, // W:12, BV:50
  { id: 'wh013', name: 'Smelling Salts', category: 'misc', tier: 'Common', wholesalePrice: 4, baseValue: 18 }, // W:4, BV:18

  // Uncommon Items (Tier 1 - Requires Rep >= 10)
  { id: 'wh003', name: 'Iron Sword', category: 'weapon', tier: 'Uncommon', wholesalePrice: 100, baseValue: 180 },
  { id: 'wh004', name: 'Leather Armor', category: 'armor', tier: 'Uncommon', wholesalePrice: 80, baseValue: 150 },
  { id: 'wh009', name: 'Greater Healing Potion', category: 'potion', tier: 'Uncommon', wholesalePrice: 75, baseValue: 150 },
  { id: 'wh010', name: 'Steel Shield', category: 'shield', tier: 'Uncommon', wholesalePrice: 120, baseValue: 220 },
  { id: 'wh014', name: 'Crossbow', category: 'weapon', tier: 'Uncommon', wholesalePrice: 150, baseValue: 280 },
  { id: 'wh015', name: 'Chain Shirt', category: 'armor', tier: 'Uncommon', wholesalePrice: 180, baseValue: 350 },
  { id: 'wh016', name: 'Tindertwig', category: 'tool', tier: 'Uncommon', wholesalePrice: 20, baseValue: 45 }, // Magical firestarter
  { id: 'wh017', name: 'Spyglass', category: 'misc', tier: 'Uncommon', wholesalePrice: 200, baseValue: 400 },

  // Rare Items (Tier 2 - Requires Rep >= 25)
  { id: 'wh018', name: 'Potion of Strength', category: 'potion', tier: 'Rare', wholesalePrice: 250, baseValue: 500 },
  { id: 'wh019', name: 'Steel Longsword', category: 'weapon', tier: 'Rare', wholesalePrice: 400, baseValue: 750 },
  { id: 'wh020', name: 'Plate Mail', category: 'armor', tier: 'Rare', wholesalePrice: 600, baseValue: 1100 },
  { id: 'wh021', name: 'Amulet of Warding', category: 'misc', tier: 'Rare', wholesalePrice: 500, baseValue: 1000 },
  { id: 'wh022', name: 'Masterwork Lockpicks', category: 'tool', tier: 'Rare', wholesalePrice: 150, baseValue: 300 },
];
