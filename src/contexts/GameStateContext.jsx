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
    
    case 'SET_DAY':
      return { ...state, day: action.payload };
    
    case 'SET_LOAN_DUE_DATE': // Action to update due date after payment
      return { ...state, loanDueDate: action.payload };

    case 'SET_GAME_OVER': // Action to set game over state
      return { ...state, gameOver: true, phase: 'game over' }; // Also set phase

    case 'DECREASE_TOTAL_LOAN': // Action to reduce total loan owed
      return { ...state, totalLoanOwed: Math.max(0, state.totalLoanOwed - action.payload) };

    case 'SET_WEBLLM_STATUS': // Action to update loading status text
      return { ...state, webllmStatus: action.payload };

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

      // --- Add shelf capacity check ---
      if (state.displayedItems.length >= state.shopShelves) {
        console.log("Reducer: Shelf is full, move rejected.");
        // Optionally add dialogue feedback here if desired
        // return { ...state, dialogue: [...state.dialogue, "Shelf is full!"] };
        return state; // Return current state without changes
      }
      // --- End shelf capacity check ---

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
          initialPatience: calculateStartingPatience(customer.personalityTraits), // Store initial
          patience: calculateStartingPatience(customer.personalityTraits), // Initialize current patience
          status: 'active' // Negotiation is now active
        }
      };
    }

    // Combined and corrected PLAYER_RESPONSE case
    case 'PLAYER_RESPONSE': { 
      console.log('Handling PLAYER_RESPONSE with payload:', action.payload);
      if (!state.currentNegotiation) {
        console.warn('No current negotiation to respond to');
        return state;
      }
      
      const { text, price } = action.payload;
      const currentPatience = state.currentNegotiation.patience ?? 5; // Default if undefined
      const nextPatience = Math.max(0, currentPatience - 1); // Decrease patience, min 0
      const dialogueText = `You: ${text} (Offer ${price}g)`; // Add offer to dialogue
      console.log('Updating negotiation state with player response, patience:', nextPatience);

      // If patience hits 0 after player response, end negotiation immediately
      if (nextPatience === 0) {
        console.log('Patience hit 0, ending negotiation.');
        const reputationChange = -1; // Lose reputation
        // Ensure customer name is available for the message
        const customerName = state.currentNegotiation.customer?.name || 'The customer'; 
        return {
          ...state,
          currentNegotiation: null,
          reputation: state.reputation + reputationChange,
          dialogue: [
            ...state.dialogue,
            dialogueText, // Show player's last attempt with offer
            `${customerName} has run out of patience! Negotiation ended. (${reputationChange} Rep)` // Improved message
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
          dialogueText // Use text with offer included
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
          // Add offer to dialogue message
          `${state.currentNegotiation.customer.name}: ${text} ${offer !== null ? `(Offers ${offer}g)` : ''}` 
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

      // Calculate reputation change based on deal quality
      let reputationChange = 0;
      const ratio = customerOffer / (item.baseValue || 1); // Avoid division by zero if baseValue is missing/0
      if (ratio < 0.8) { // Bad Deal for player
        reputationChange = 1; 
      } else if (ratio >= 0.8 && ratio < 1.2) { // Fair Deal
        reputationChange = 0; 
      } else { // Good Deal for player
        reputationChange = 0;
      }
      
      return {
        ...state,
        gold: newGold,
        displayedItems: newDisplayedItems,
        currentNegotiation: null,
        reputation: state.reputation + reputationChange, // Update reputation
        dialogue: [
          ...state.dialogue,
          // Update dialogue to show correct rep change (or lack thereof)
          `Sold ${item.name} for ${customerOffer}g! ${reputationChange > 0 ? `(+${reputationChange} Rep)` : reputationChange < 0 ? `(${reputationChange} Rep)`: '(0 Rep)'}`
        ]
      };
    }

    case 'UPGRADE_SHELF': { // New action type
      const upgradeCost = action.payload; // Pass cost in payload
      if (state.gold >= upgradeCost) {
        return {
          ...state,
          gold: state.gold - upgradeCost,
          shopShelves: state.shopShelves + 1,
          dialogue: [
            ...state.dialogue,
            `Upgraded shelf capacity to ${state.shopShelves + 1}! (-${upgradeCost}g)`
          ]
        };
      }
      // Should ideally be prevented by button disable, but good to have safeguard
      return state; 
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
          // Add customer name and rep change to the message
          `${state.currentNegotiation.customer?.name || 'The customer'} leaves in frustration. (${reputationChange} Rep)` 
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
