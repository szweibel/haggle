import { createContext, useContext, useReducer } from 'react';
import { initialState } from '../gameState';

const GameStateContext = createContext();

// Helper to determine starting patience based on traits
function calculateStartingPatience(traits = []) {
  if (traits.includes('impatient')) return 3;
  if (traits.includes('patient')) return 7;
  return 5; // Default patience
}

function gameReducer(state, action) {
  const now = Date.now();
  switch (action.type) {
    case 'SET_GOLD':
      return { ...state, gold: action.payload, lastUpdated: now };
    case 'ADD_ITEM':
      return { 
        ...state, 
        inventory: [...state.inventory, action.payload],
        lastUpdated: now 
      };
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'ADD_DIALOGUE':
      return { ...state, dialogue: [...state.dialogue, action.payload] };
    
    case 'SET_DAY': // Add case for setting the day
      return { ...state, day: action.payload };

    case 'BUY_ITEM': {
      const itemToBuy = action.payload;
      if (state.gold >= itemToBuy.wholesalePrice) {
        // Create a unique instance for the inventory
        const newItemInstance = { 
          ...itemToBuy, 
          instanceId: `${itemToBuy.id}-${Date.now()}` // Simple unique ID
        };
        return {
          ...state,
          gold: state.gold - itemToBuy.wholesalePrice,
          inventory: [...state.inventory, newItemInstance],
          dialogue: [...state.dialogue, `Bought ${itemToBuy.name} for ${itemToBuy.wholesalePrice}g.`]
        };
      } else {
        return {
          ...state,
          dialogue: [...state.dialogue, `Not enough gold to buy ${itemToBuy.name} (${itemToBuy.wholesalePrice}g).`]
        };
      }
    }

    case 'MOVE_ITEM_TO_SHELF': {
      const itemToMove = action.payload;
      console.log('Attempting to move item to shelf:', itemToMove);
      console.log('Current inventory:', state.inventory);
      
      // Find the exact item instance in inventory
      console.log('Full inventory contents:', state.inventory);
      const itemIndex = state.inventory.findIndex(item => {
        const match = item.instanceId === itemToMove.instanceId;
        console.log(`Checking item ${item.instanceId} (${item.name}) vs ${itemToMove.instanceId} (${itemToMove.name}) - match: ${match}`);
        return match;
      });
      
      if (itemIndex === -1) {
        console.warn("Attempted to move item to shelf that wasn't in inventory:", itemToMove);
        console.warn("Current inventory contents:", state.inventory);
        return state;
      }

      // Use the inventory item instance to ensure we have the correct reference
      const inventoryItem = state.inventory[itemIndex];
      const newInventory = [...state.inventory];
      newInventory.splice(itemIndex, 1);
      const newDisplayedItems = [...state.displayedItems, inventoryItem];
      
      console.log('Post-move inventory count:', newInventory.length);
      console.log('Post-move displayed items count:', newDisplayedItems.length);
      
      return {
        ...state,
        inventory: newInventory,
        displayedItems: newDisplayedItems,
        lastUpdated: Date.now()
      };
    }

    case 'START_NEGOTIATION': {
      const { item, customer, customerOffer, spokenResponse } = action.payload;
      // Ensure we don't start if already negotiating
      if (state.currentNegotiation) return state; 

      return {
        ...state,
        currentNegotiation: {
          item: item, 
          customer: customer,
          customerOffer: customerOffer, 
          playerOffer: null, // Player hasn't offered yet
          // Initialize history with the customer's first move
          history: [{
            speaker: 'customer',
            text: spokenResponse,
            offer: customerOffer
          }],
          patience: calculateStartingPatience(customer.personalityTraits), // Initialize patience
          status: 'active' // Negotiation is now active
        }
      };
    }

    case 'PLAYER_RESPONSE': {
      console.log('Handling PLAYER_RESPONSE with payload:', action.payload);
      if (!state.currentNegotiation) {
        console.warn('No current negotiation to respond to');
        return state;
      }
      
      const { text, price } = action.payload;
      console.log('Updating negotiation state with player response');
      return {
        ...state,
        currentNegotiation: {
          ...state.currentNegotiation,
          playerOffer: price,
          history: [
            ...state.currentNegotiation.history,
            {
              speaker: 'player',
              text: text,
              offer: price
            }
          ]
        },
        dialogue: [
          ...state.dialogue,
          `You: ${text}`
        ]
      };
    }

    // Decrease patience on player/customer counter-offers
    case 'PLAYER_RESPONSE': {
      console.log('Handling PLAYER_RESPONSE with payload:', action.payload);
      if (!state.currentNegotiation) {
        console.warn('No current negotiation to respond to');
        return state;
      }
      
      const { text, price } = action.payload;
      const currentPatience = state.currentNegotiation.patience ?? 5; // Default if undefined
      const nextPatience = Math.max(0, currentPatience - 1); // Decrease patience, min 0
      console.log('Updating negotiation state with player response, patience:', nextPatience);

      // If patience hits 0 after player response, end negotiation immediately
      if (nextPatience === 0) {
        console.log('Patience hit 0, ending negotiation.');
        const reputationChange = -1; // Lose reputation
        return {
          ...state,
          currentNegotiation: null,
          reputation: state.reputation + reputationChange,
          dialogue: [
            ...state.dialogue,
            `You: ${text}`, // Show player's last attempt
            `${state.currentNegotiation.customer.name} has run out of patience! Negotiation ended. (${reputationChange} Rep)`
          ]
        };
      }

      // Otherwise, update state normally for AI to respond
      return {
        ...state,
        currentNegotiation: {
          ...state.currentNegotiation,
          playerOffer: price,
          patience: nextPatience, // Update patience
          history: [
            ...state.currentNegotiation.history,
            {
              speaker: 'player',
              text: text,
              offer: price
            }
          ]
        },
        dialogue: [
          ...state.dialogue,
          `You: ${text}`
        ]
      };
    }

    case 'CUSTOMER_RESPONSE': {
      console.log('Handling CUSTOMER_RESPONSE with payload:', action.payload);
      if (!state.currentNegotiation) {
        console.warn('No current negotiation for customer to respond to');
        return state;
      }

      const { text, offer } = action.payload;
      const currentPatience = state.currentNegotiation.patience ?? 5; // Default if undefined
      // Only decrease patience if it's a counter, not initial offer (already handled)
      // We might refine this - maybe decrease less if offer is good? For now, decrease on counter.
      const nextPatience = state.currentNegotiation.history.length > 1 
                           ? Math.max(0, currentPatience - 1) 
                           : currentPatience; 
      console.log('Updating negotiation state with customer response, patience:', nextPatience);

      return {
        ...state,
        currentNegotiation: {
          ...state.currentNegotiation,
          customerOffer: offer,
          patience: nextPatience, // Update patience
          history: [
            ...state.currentNegotiation.history,
            {
              speaker: 'customer',
              text: text,
              offer: offer
            }
          ]
        },
        dialogue: [
          ...state.dialogue,
          `${state.currentNegotiation.customer.name}: ${text}`
        ]
      };
    }

    case 'UPDATE_REPUTATION': { // New action type
      const newReputation = state.reputation + action.payload;
      console.log(`Reputation updated: ${state.reputation} -> ${newReputation}`);
      return {
        ...state,
        reputation: newReputation
      };
    }

    case 'ACCEPT_OFFER': {
      if (!state.currentNegotiation) return state;
      
      const { item, customerOffer } = state.currentNegotiation;
      const newGold = state.gold + customerOffer;
      const newDisplayedItems = state.displayedItems.filter(
        i => i.instanceId !== item.instanceId
      );
      const reputationChange = +1; // Gain reputation on successful sale
      
      return {
        ...state,
        gold: newGold,
        displayedItems: newDisplayedItems,
        currentNegotiation: null,
        reputation: state.reputation + reputationChange, // Update reputation
        dialogue: [
          ...state.dialogue,
          `Sold ${item.name} for ${customerOffer}g! (+${reputationChange} Rep)`
        ]
      };
    }

    case 'END_NEGOTIATION': {
      if (!state.currentNegotiation) return state;
      const reputationChange = -1; // Lose reputation on failed/ended negotiation
      
      return {
        ...state,
        currentNegotiation: null,
        reputation: state.reputation + reputationChange, // Update reputation
        dialogue: [
          ...state.dialogue,
          `Negotiation ended. (${reputationChange} Rep)`
        ]
      };
    }

    default:
      return state;
  }
}

export function GameStateProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, {
    ...initialState,
    lastUpdated: Date.now()
  });

  return (
    <GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  return useContext(GameStateContext);
}
