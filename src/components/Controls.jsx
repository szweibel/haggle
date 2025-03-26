import { useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { useWebLLMContext } from '../contexts/WebLLMContext';
import { COLORS, UI_PADDING, CUSTOMER_TYPES } from '../gameState';

export default function Controls() {
  const { state, dispatch } = useGameState();
  const { generateResponse, loading: webLLMLoading } = useWebLLMContext(); // Use context hook

  const handleNextCustomer = async () => {
    // Add check for webLLMLoading
    if (state.displayedItems.length === 0 || webLLMLoading) return; 
    
    const customer = getRandomCustomer();
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
    const systemPrompt = `You are ${customer.name}, ${customer.description}. Your personality traits are **${traitsString}**. Your budget is ${customer.budget}g.
You see the following items for sale:
${itemsForPrompt.map(i => `- ${i.name} (ID: ${i.id}, Asking: ${i.askingPrice}g, Base Value: ${i.baseValue}g)`).join('\n')}

1. Choose ONE item from the list that interests you based on your personality traits (${traitsString}) and preferences (Interests: ${customer.interests.join(', ')}).
2. Calculate an initial offer price for that item based *strongly* on your personality traits (${traitsString}) and the item's Base Value (${itemsForPrompt.map(i => `${i.name}: ${i.baseValue}g`).join(', ')}), NOT the asking price.
   - Generous: ~80-110% of Base Value.
   - Stingy/Frugal: ~40-60% of Base Value.
   - Arrogant: Dismissively low, maybe ~30-50% of Base Value.
   - Impulsive: Can be slightly high or low, ~70-120% of Base Value.
   - Default: Reasonably below Base Value, ~60-80%.
3. Ensure your offer is an integer and within your budget (${customer.budget}g). If your calculated offer is over budget, offer your max budget or slightly less. If no item's calculated offer is feasible within budget, you might state you can't afford anything right now (use decision "leave").
4. Phrase a spoken response ("spokenResponse") reflecting your personality, mentioning the item you chose, and making your offer clearly. Do NOT mention the 'Base Value' or your calculation process in the spoken response.
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
        // Add dialogue first
        dispatch({ type: 'ADD_DIALOGUE', payload: `${customer.name}: ${parsedResponse.spokenResponse}` });
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

  function getRandomCustomer() {
    return CUSTOMER_TYPES[Math.floor(Math.random() * CUSTOMER_TYPES.length)];
  }

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
      // TODO: Potentially reset market items or other daily tasks here
    }

    dispatch({ type: 'SET_PHASE', payload: nextPhase });
    if (nextDay !== state.day) {
      dispatch({ type: 'SET_DAY', payload: nextDay }); // Need to add SET_DAY action
    }
    dispatch({ type: 'ADD_DIALOGUE', payload: dialogueMessage });
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
    const systemPrompt = `You are ${customer.name}, ${customer.description}. Your personality traits are **${traitsStringCounter}**. 
You're negotiating for ${item.name} (Base Value: ${item.baseValue}g). 
Your current patience level is ${patience} (starts around 5, decreases with each counter-offer).

The shopkeeper countered with ${price}g (your previous offer was ${state.currentNegotiation.customerOffer}g).

1. Consider your personality traits (${traitsStringCounter}) AND your current patience level (${patience}) to decide how to respond:
   - Generous: More likely to accept or meet halfway, less affected by low patience.
   - Stingy: More likely to hold firm, low patience makes rejection likely.
   - Arrogant: Might insult or walk away if patience is low.
   - Impulsive: Might accept/reject suddenly, especially if patience is low.
   - Impatient: Will likely reject if patience is low (e.g., 1 or 0).
2. If patience is 0, your decision MUST be 'reject'.
3. Otherwise, make a counter-offer or accept/reject based on your personality and patience.
4. Phrase a spoken response reflecting your personality and current mood (potentially influenced by patience).
5. Respond ONLY in strict JSON format: { "spokenResponse": "Your dialogue...", "offer": number | null, "decision": "counter" | "accept" | "reject" }`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: responseText }
    ];

    const responseFormat = { type: "json_object" };
    const parsedResponse = await generateResponse(messages, customer.name, responseFormat);

    if (parsedResponse) {
      if (parsedResponse.decision === "accept") {
        dispatch({ type: 'ACCEPT_OFFER' });
      } else if (parsedResponse.decision === "reject") {
        dispatch({ type: 'END_NEGOTIATION' });
      } else if (parsedResponse.decision === "counter" && parsedResponse.offer) {
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
            style={{
              padding: UI_PADDING,
              backgroundColor: COLORS.button,
              color: COLORS.panel,
              border: `1px solid ${COLORS.buttonStroke}`,
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Advance Time
          </button>
        </>
      )}
    </div>
  );
}
