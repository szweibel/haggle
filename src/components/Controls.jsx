import { useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { useWebLLMContext } from '../contexts/WebLLMContext';
import { COLORS, UI_PADDING, CUSTOMER_TYPES } from '../gameState';

// Helper function to get patience description
function getPatienceDescription(current, initial) {
  if (current === undefined || initial === undefined) return ''; 
  const ratio = current / initial;
  if (ratio >= 0.8) return 'Patient';
  if (ratio >= 0.5) return 'Considering';
  if (ratio >= 0.2) return 'Restless';
  if (current > 0) return 'Impatient!';
  return 'Livid!'; // Should ideally not be seen as negotiation ends at 0
}

export default function Controls() {
  const { state, dispatch } = useGameState();
  const { generateResponse, loading: webLLMLoading } = useWebLLMContext(); // Use context hook

  // Define reputation thresholds for customer tiers
  const CUSTOMER_TIER_THRESHOLDS = [0, 5, 15]; // Rep required for Tier 0, 1, 2

  // Helper function to get eligible customers based on reputation
  function getEligibleCustomers(reputation) {
    let maxTier = 0;
    for (let i = CUSTOMER_TIER_THRESHOLDS.length - 1; i >= 0; i--) {
      if (reputation >= CUSTOMER_TIER_THRESHOLDS[i]) {
        maxTier = i;
        break;
      }
    }
    return CUSTOMER_TYPES.filter(customer => customer.tier <= maxTier);
  }

  const handleNextCustomer = async () => {
    // Add check for webLLMLoading
    if (state.displayedItems.length === 0 || webLLMLoading) return; 
    
    // Get eligible customers based on reputation
    const eligibleCustomers = getEligibleCustomers(state.reputation);
    if (eligibleCustomers.length === 0) {
      console.error("No eligible customers found for current reputation:", state.reputation);
      // Maybe add dialogue? "No customers seem interested in your shop today."
      return; 
    }
    // Select a random customer from the eligible list
    const customer = eligibleCustomers[Math.floor(Math.random() * eligibleCustomers.length)];

    dispatch({ 
      type: 'SET_CUSTOMER', 
      payload: customer 
    });
    dispatch({ 
      type: 'ADD_DIALOGUE', 
      payload: `${customer.name} enters the shop!`
    });

    // --- Prepare for JSON mode ---
    const itemsForPrompt = state.displayedItems.map(item => ({
      id: item.instanceId, // Use instanceId for unique identification
      name: item.name,
      askingPrice: item.askingPrice || Math.round(item.baseValue * 1.5), // Use askingPrice or calculate fallback
      baseValue: item.baseValue 
    }));

    if (itemsForPrompt.length === 0) {
        dispatch({ type: 'ADD_DIALOGUE', payload: `${customer.name} looks around, but sees nothing on the shelves.` });
        dispatch({ type: 'SET_CUSTOMER', payload: null }); // No customer if nothing to buy
        return;
    }

    // Use personalityTraits array
    const traitsString = customer.personalityTraits.join(', ');
    // Include player reputation in the context
    const systemPrompt = `You are ${customer.name}, ${customer.description}. Your personality traits are **${traitsString}**. Your budget is ${customer.budget}g.
The shopkeeper's current reputation is ${state.reputation}. (Positive is good, negative is bad).

You see the following items for sale:
${itemsForPrompt.map(i => `- ${i.name} (ID: ${i.id}, Asking: ${i.askingPrice}g, Base Value: ${i.baseValue}g)`).join('\n')}

1. Choose ONE item from the list that interests you based on your personality traits (${traitsString}) and preferences (Interests: ${customer.interests.join(', ')}). Consider items roughly within your budget.
2. Calculate an initial offer price for that item based *strongly* on your personality traits (${traitsString}) and the item's Base Value (${itemsForPrompt.map(i => `${i.name}: ${i.baseValue}g`).join(', ')}), NOT the asking price. **Subtly adjust this initial offer based on the shopkeeper's reputation:** slightly higher if rep is good (e.g., >10), slightly lower if rep is bad (e.g., < -5).
   - Generous: ~80-105% of Base Value (rarely over 100%).
   - Stingy/Frugal: ~40-60% of Base Value.
   - Arrogant: Dismissively low, maybe ~30-50% of Base Value.
   - Impulsive: Can be slightly high or low, ~70-110% of Base Value.
   - Default: Reasonably below Base Value, ~60-80%.
   **Generally, your initial offer should be at or below the item's Base Value unless your traits strongly justify otherwise (like generous/impulsive).**
3. Ensure your offer is an integer and within your budget (${customer.budget}g). If your calculated offer is over budget, offer your max budget or slightly less. If no item's calculated offer is feasible within budget, you must use decision "leave".
4. Phrase a spoken response ("spokenResponse") reflecting your personality, mentioning the item name you chose, and making your offer clearly. **Crucially, do NOT mention the Item ID, Base Value, Asking Price, or your calculation process in your spokenResponse.** Only include natural dialogue.
5. Respond ONLY in strict JSON format: { "spokenResponse": "Your dialogue here...", "offer": number | null, "itemId": "instanceId_of_chosen_item" | null, "decision": "initial_offer" | "leave" }`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Welcome! See anything you like? What's your offer?" }
    ];

    const responseFormat = { type: "json_object" };
    const parsedResponse = await generateResponse(messages, customer.name, responseFormat);

    if (parsedResponse && parsedResponse.decision === "initial_offer" && parsedResponse.itemId && parsedResponse.offer != null) {
      const chosenItem = state.displayedItems.find(item => item.instanceId === parsedResponse.itemId);
      
      if (chosenItem) {
        // Add dialogue first, including the offer
        dispatch({ type: 'ADD_DIALOGUE', payload: `${customer.name}: ${parsedResponse.spokenResponse} (Offers ${parsedResponse.offer}g)` });
        // Start negotiation state
        dispatch({ 
          type: 'START_NEGOTIATION', 
          payload: { 
            item: chosenItem,
            customer: customer,
            customerOffer: parsedResponse.offer,
            spokenResponse: parsedResponse.spokenResponse // Add spoken response to payload
          }
        });
      } else {
         dispatch({ type: 'ADD_DIALOGUE', payload: `${customer.name} seems confused about an item.` });
         console.error("AI chose an item ID not found on shelves:", parsedResponse.itemId);
      }
    } else if (parsedResponse && parsedResponse.decision === "leave") {
       dispatch({ type: 'ADD_DIALOGUE', payload: `${customer.name}: ${parsedResponse.spokenResponse || "Changed my mind."}` });
       dispatch({ type: 'SET_CUSTOMER', payload: null }); // Customer leaves
    } else {
      // Handle cases where AI response is invalid or doesn't make an offer
      dispatch({ type: 'ADD_DIALOGUE', payload: `${customer.name} looks around indecisively.` });
      // Keep customer for now, maybe retry or let player advance time?
      console.error("Invalid or non-offer response from AI:", parsedResponse);
    }
  };

  // Removed old getRandomCustomer function as logic is now inline

  const handleAdvanceTime = () => {
    let nextPhase = '';
    let dialogueMessage = '';
    let nextDay = state.day;

    if (state.phase === 'setting up') {
      nextPhase = 'selling';
      dialogueMessage = 'Shop opened for the day!';
    } else if (state.phase === 'selling') {
      nextPhase = 'management';
      dialogueMessage = 'Shop closed for the night. Time to manage inventory and buy stock.';
    } else if (state.phase === 'management') {
      nextPhase = 'setting up';
      nextDay = state.day + 1; // Increment day when moving from management to morning
      dialogueMessage = `Day ${nextDay} begins. Time to set up the shelves.`;
    }

    // --- Loan Payment Check (at end of day, before advancing day/phase) ---
    let loanMessages = [];
    let triggerGameOver = false;
    let nextLoanDueDate = state.loanDueDate;

    if (state.phase === 'selling') { // Check happens when transitioning FROM selling
      // Use >= in case player somehow skips a day? Safer check.
      if (state.day >= state.loanDueDate) { 
        loanMessages.push(`Loan payment of ${state.loanAmount}g is due!`);
        if (state.gold >= state.loanAmount) {
          dispatch({ type: 'SET_GOLD', payload: state.gold - state.loanAmount });
          dispatch({ type: 'DECREASE_TOTAL_LOAN', payload: state.loanAmount }); // Decrease total owed
          loanMessages.push(`Paid ${state.loanAmount}g loan payment. Phew!`);
          nextLoanDueDate = state.loanDueDate + 7; // Set next due date relative to current due date
        } else {
          loanMessages.push(`Cannot pay ${state.loanAmount}g loan! You only have ${state.gold}g!`);
          loanMessages.push(`GAME OVER - The loan sharks are coming...`);
          triggerGameOver = true;
        }
      }
    }
    // --- End Loan Payment Check ---

    // Add any loan messages BEFORE phase change messages
    loanMessages.forEach(msg => dispatch({ type: 'ADD_DIALOGUE', payload: msg }));

    // Trigger Game Over if necessary
    if (triggerGameOver) {
      dispatch({ type: 'SET_GAME_OVER' });
      return; // Stop further phase advancement
    }

    // Update loan due date if it changed
    if (nextLoanDueDate !== state.loanDueDate) {
      dispatch({ type: 'SET_LOAN_DUE_DATE', payload: nextLoanDueDate });
    }

    // Advance Day/Phase
    dispatch({ type: 'SET_PHASE', payload: nextPhase });
    if (nextDay !== state.day) {
      dispatch({ type: 'SET_DAY', payload: nextDay });
    }
    dispatch({ type: 'ADD_DIALOGUE', payload: dialogueMessage });
  };

  // Shelf Upgrade Logic
  const handleUpgradeShelf = () => {
    // Calculate cost based on current number of shelves
    const upgradeCost = state.shopShelves * 200; // Example cost scaling
    if (state.gold >= upgradeCost) {
      dispatch({ type: 'UPGRADE_SHELF', payload: upgradeCost }); // Need to add this action type
    } else {
      dispatch({ 
        type: 'ADD_DIALOGUE', 
        payload: `Not enough gold to upgrade shelf! Need ${upgradeCost}g.` 
      });
    }
  };

  // State for negotiation inputs
  const [playerText, setPlayerText] = useState('');
  const [playerPrice, setPlayerPrice] = useState('');

  // Handler for submitting player's negotiation response
  const handleSendResponse = async () => {
    if (!state.currentNegotiation || playerPrice === '') return;
    
    const price = Number(playerPrice);
    if (isNaN(price)) {
      dispatch({ type: 'ADD_DIALOGUE', payload: "Please enter a valid price number!" });
      return;
    }

    const responseText = playerText || `How about ${price}g?`;
    console.log('Dispatching PLAYER_RESPONSE with:', { text: responseText, price });
    dispatch({
      type: 'PLAYER_RESPONSE',
      payload: {
        text: responseText,
        price: price
      }
    });
    console.log('PLAYER_RESPONSE dispatched');

    // Get AI response
    const { customer, item, patience } = state.currentNegotiation; // Get patience
    // Use personalityTraits array
    const traitsStringCounter = customer.personalityTraits.join(', ');
    // Include player reputation
    const systemPrompt = `You are ${customer.name}, ${customer.description}. Your personality traits are **${traitsStringCounter}**. 
The shopkeeper's current reputation is ${state.reputation}. (Positive is good, negative is bad).
You're negotiating for ${item.name} (Base Value: ${item.baseValue}g). 
Your current patience level is ${patience} (starts around 5, decreases with each counter-offer).

The shopkeeper countered with ${price}g (your previous offer was ${state.currentNegotiation.customerOffer}g).

1. Consider your personality traits (${traitsStringCounter}), your current patience level (${patience}), AND the shopkeeper's reputation (${state.reputation}) to decide how to respond:
   - Generous: More likely to accept or meet halfway, less affected by low patience.
   - Stingy: More likely to hold firm, low patience makes rejection likely.
   - Arrogant: Might insult or walk away if patience is low.
   - Impulsive: Might accept/reject suddenly, especially if patience is low.
   - Impatient: Will likely reject if patience is low (e.g., 1 or 0).
   - Reputation Influence: If rep is high (>10), be slightly more willing to accept or counter generously. If rep is low (< -5), be slightly more likely to reject or counter poorly.
2. If patience is 0, your decision MUST be 'reject'.
3. Otherwise, make a counter-offer ('counter'), accept the shopkeeper's price ('accept'), or reject the negotiation ('reject') based on your personality, patience, and reputation.
4. **If making a counter-offer:** Your new 'offer' number MUST be higher than your previous offer (${state.currentNegotiation.customerOffer}g) but less than or equal to the shopkeeper's current asking price (${price}g). Aim for a logical step towards a potential agreement, influenced by your traits and reputation (e.g., stingy moves less, generous moves more, low rep might lead to smaller increases). If you cannot make a logical counter-offer in this range (e.g., your traits make you hold firm), you should 'reject'.
5. Phrase a spoken response reflecting your personality and current mood (potentially influenced by patience and reputation).
6. Respond ONLY in strict JSON format: { "spokenResponse": "Your dialogue...", "offer": number | null, "decision": "counter" | "accept" | "reject" }`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: responseText }
    ];

    const responseFormat = { type: "json_object" };
    const parsedResponse = await generateResponse(messages, customer.name, responseFormat);

    if (parsedResponse) {
      if (parsedResponse.decision === "accept") {
        // Add dialogue for acceptance before dispatching ACCEPT_OFFER
        // (ACCEPT_OFFER adds the "Sold..." message)
        dispatch({ type: 'ADD_DIALOGUE', payload: `${customer.name}: ${parsedResponse.spokenResponse}` });
        dispatch({ type: 'ACCEPT_OFFER' });
      } else if (parsedResponse.decision === "reject") {
        // Add the rejection dialogue FIRST, then end negotiation
        dispatch({ type: 'ADD_DIALOGUE', payload: `${customer.name}: ${parsedResponse.spokenResponse}` });
        dispatch({ type: 'END_NEGOTIATION' });
      } else if (parsedResponse.decision === "counter" && parsedResponse.offer) {
        // CUSTOMER_RESPONSE action already handles adding dialogue with offer
        dispatch({
          type: 'CUSTOMER_RESPONSE',
          payload: {
            text: parsedResponse.spokenResponse,
            offer: parsedResponse.offer
          }
        });
      }
    }

    // Clear inputs
    setPlayerText('');
    setPlayerPrice('');
  };

  // Handler for accepting the customer's offer
  const handleAcceptOffer = () => {
    if (!state.currentNegotiation) return;
    dispatch({ type: 'ACCEPT_OFFER' });
  };

  // Handler for walking away from negotiation
  const handleWalkAway = () => {
    dispatch({ type: 'END_NEGOTIATION' });
  };

  return (
    <div style={{
      flex: 0.35,
      backgroundColor: COLORS.panel,
      borderRadius: 8,
      border: `1px solid ${COLORS.panelStroke}`,
      padding: UI_PADDING,
      display: 'flex',
      flexDirection: 'column',
      gap: UI_PADDING
    }}>
      {state.currentNegotiation ? (
        // Negotiation UI
        <>
          {/* Display Customer Mood/Patience */}
          <div style={{ textAlign: 'center', fontStyle: 'italic', color: COLORS.textLight }}>
            Mood: {getPatienceDescription(state.currentNegotiation.patience, state.currentNegotiation.initialPatience)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: UI_PADDING }}>
            <input
              type="text"
              value={playerText}
              onChange={(e) => setPlayerText(e.target.value)}
              placeholder="Your response..."
              style={{
                padding: UI_PADDING,
                borderRadius: 4,
                border: `1px solid ${COLORS.panelStroke}`
              }}
            />
            <input
              type="number"
              value={playerPrice}
              onChange={(e) => setPlayerPrice(e.target.value)}
              placeholder="Your offer (gold)"
              style={{
                padding: UI_PADDING,
                borderRadius: 4,
                border: `1px solid ${COLORS.panelStroke}`
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: UI_PADDING }}>
            <button 
              onClick={handleSendResponse}
              disabled={playerPrice === '' || webLLMLoading}
              style={{
                flex: 1,
                padding: UI_PADDING,
                backgroundColor: COLORS.button,
                color: COLORS.panel,
                border: `1px solid ${COLORS.buttonStroke}`,
                borderRadius: 6,
                cursor: playerPrice === '' ? 'not-allowed' : 'pointer',
                opacity: playerPrice === '' ? 0.5 : 1,
                fontWeight: 700
              }}
            >
              Send Response
            </button>
          </div>

          <div style={{ display: 'flex', gap: UI_PADDING }}>
            <button
              onClick={handleAcceptOffer}
              disabled={!state.currentNegotiation?.customerOffer}
              style={{
                flex: 1,
                padding: UI_PADDING,
                backgroundColor: COLORS.button,
                color: COLORS.panel,
                border: `1px solid ${COLORS.buttonStroke}`,
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Accept {state.currentNegotiation?.customerOffer}g
            </button>

            <button
              onClick={handleWalkAway}
              style={{
                flex: 1,
                padding: UI_PADDING,
                backgroundColor: COLORS.button,
                color: COLORS.panel,
                border: `1px solid ${COLORS.buttonStroke}`,
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Walk Away
            </button>
          </div>
        </>
      ) : (
        // Normal controls
        <>
          <button 
            onClick={handleNextCustomer}
            disabled={state.phase !== 'selling' || state.displayedItems.length === 0 || webLLMLoading} 
            style={{
              padding: UI_PADDING,
              backgroundColor: COLORS.button,
              color: COLORS.panel,
              border: `1px solid ${COLORS.buttonStroke}`,
              borderRadius: 6,
              cursor: (state.phase !== 'selling' || state.displayedItems.length === 0 || webLLMLoading) ? 'not-allowed' : 'pointer',
              opacity: (state.phase !== 'selling' || state.displayedItems.length === 0 || webLLMLoading) ? 0.5 : 1,
              fontWeight: 700
            }}
          >
            Next Customer
          </button>

          <button
            onClick={handleAdvanceTime}
            disabled={state.gameOver} // Disable if game over
            style={{
              padding: UI_PADDING,
              backgroundColor: COLORS.button,
              color: COLORS.panel,
              border: `1px solid ${COLORS.buttonStroke}`,
              borderRadius: 6,
              cursor: state.gameOver ? 'not-allowed' : 'pointer',
              opacity: state.gameOver ? 0.5 : 1,
              fontWeight: 700
            }}
          >
            {state.phase === 'selling' ? 'End Day' : 'Advance Time'} {/* Change button text */}
          </button>

          {/* Add Upgrade Shelf button only during management phase */}
          {state.phase === 'management' && (
            <button
              onClick={handleUpgradeShelf}
              disabled={state.gameOver || state.gold < state.shopShelves * 200} // Disable if game over or cannot afford
              style={{
                padding: UI_PADDING,
                backgroundColor: COLORS.button,
                color: COLORS.panel,
                border: `1px solid ${COLORS.buttonStroke}`,
                borderRadius: 6,
                cursor: (state.gameOver || state.gold < state.shopShelves * 200) ? 'not-allowed' : 'pointer',
                opacity: (state.gameOver || state.gold < state.shopShelves * 200) ? 0.5 : 1,
                fontWeight: 700
              }}
            >
              Upgrade Shelf ({state.shopShelves * 200}g) {/* Show cost */}
            </button>
          )}
        </>
      )}
    </div>
  );
}
