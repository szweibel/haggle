export const initialState = {
  day: 1,
  gold: 1000,
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
  reputation: 0 // Player's reputation score
};

// Define item categories used in interests
// const ITEM_CATEGORIES = ['potion', 'weapon', 'armor', 'shield', 'tool', 'general'];

export const CUSTOMER_TYPES = [
  {
    name: 'Nervous Apprentice',
    description: 'a young apprentice clutching a small coin purse',
    personalityTraits: ['timid', 'easily impressed', 'frugal'],
    budget: 60, // Lowered
    interests: ['potion', 'tool']
  },
  {
    name: 'Gruff Mercenary',
    description: 'a battle-scarred mercenary looking for functional gear',
    personalityTraits: ['practical', 'impatient', 'fair'],
    budget: 250, // Lowered
    interests: ['weapon', 'armor', 'potion']
  },
  {
    name: 'Shrewd Trader',
    description: 'a traveling trader with a keen eye for value',
    personalityTraits: ['calculating', 'patient', 'stingy', 'knowledgeable'],
    budget: 300, // Lowered
    interests: ['general', 'tool'] // Interested in items they can resell
  },
  {
    name: 'Flustered Noble',
    description: 'a minor noble, clearly out of their element',
    personalityTraits: ['arrogant', 'impatient', 'distracted', 'impulsive'],
    budget: 400, // Lowered significantly
    interests: ['armor', 'weapon'] // Wants something flashy?
  },
  {
    name: 'Curious Scholar',
    description: 'a scholar interested in unusual items',
    personalityTraits: ['curious', 'patient', 'distracted'],
    budget: 120, // Lowered
    interests: ['potion', 'tool'] // Might like potions or interesting tools like lockpicks
  },
  {
    name: 'Weary Farmer',
    description: 'a farmer looking for simple tools or protection',
    personalityTraits: ['practical', 'frugal', 'honest'],
    budget: 80, // Lowered
    interests: ['tool', 'shield', 'general']
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

// Items available for purchase during the management phase
export const WHOLESALE_ITEMS = [
  { id: 'wh001', name: 'Healing Potion', wholesalePrice: 25, baseValue: 50 },
  { id: 'wh002', name: 'Mana Potion', wholesalePrice: 30, baseValue: 60 },
  { id: 'wh003', name: 'Iron Sword', wholesalePrice: 100, baseValue: 180 },
  { id: 'wh004', name: 'Leather Armor', wholesalePrice: 80, baseValue: 150 },
  { id: 'wh005', name: 'Wooden Shield', wholesalePrice: 50, baseValue: 90 },
  { id: 'wh006', name: 'Lockpicks', wholesalePrice: 15, baseValue: 35 },
  { id: 'wh007', name: 'Rope (50ft)', wholesalePrice: 10, baseValue: 20 },
  { id: 'wh008', name: 'Torch', wholesalePrice: 5, baseValue: 10 },
];
