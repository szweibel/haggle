# Haggle Game - Development Status (As of March 26, 2025)

This document outlines the current state of the Haggle React game project.

**Core Gameplay Loop:**

The basic structure of the day/phase cycle and the core negotiation loop is implemented:

1.  **Management Phase (`'management'`):**
    *   Game starts in this phase.
    *   `MarketPanel` is displayed, showing `WHOLESALE_ITEMS`.
    *   Player can click "Buy" to purchase items using the `BUY_ITEM` action.
    *   Bought items are added to the `inventory` state array.
    *   Clicking "Advance Time" transitions to the `setting up` phase.

2.  **Setup Phase (`'setting up'`):**
    *   `ShopLayout` displays the `Shelf` component.
    *   Player can drag items from the `Inventory` component (using `react-dnd`) and drop them onto the `Shelf` component.
    *   Dropping dispatches the `MOVE_ITEM_TO_SHELF` action, moving the item instance from `inventory` to `displayedItems`.
    *   Shelf capacity is checked. Dropping is prevented if the shelf is full or if the item is already displayed. (Note: Drop is only allowed in this phase).
    *   Clicking "Advance Time" transitions to the `selling` phase.

3.  **Selling Phase (`'selling'`):**
    *   `ShopLayout` continues to display the `Shelf` with `displayedItems`.
    *   The "Next Customer" button in `Controls` is enabled (if items are displayed).
    *   Clicking "Next Customer":
        *   Selects a random `CUSTOMER_TYPE`.
        *   Uses `WebLLMContext` (`generateResponse`) with a system prompt detailing items, customer persona, and budget to get an initial offer in JSON format (`{ spokenResponse, offer, itemId, decision }`).
        *   Dispatches `START_NEGOTIATION` with the chosen item, customer details, and initial offer.
        *   Displays the customer's opening dialogue.
    *   **Negotiation:**
        *   When `currentNegotiation` is active, `Controls` displays negotiation inputs (text, price) and buttons (Send, Accept, Walk Away).
        *   Sending a player response dispatches `PLAYER_RESPONSE` and triggers the AI via `generateResponse` for a counter-offer/decision.
        *   AI response (`CUSTOMER_RESPONSE`, `ACCEPT_OFFER`, `END_NEGOTIATION`) updates the state.
        *   Accepting/Rejecting ends the negotiation (`currentNegotiation` becomes null).
    *   Clicking "Advance Time" transitions back to the `management` phase and increments the day (`SET_DAY`).

**Key Components & State:**

*   **`gameState.js`:** Defines `initialState`, `CUSTOMER_TYPES`, `WHOLESALE_ITEMS`, `COLORS`.
*   **`GameStateContext.jsx`:** Manages game state via `useReducer` (`gameReducer`) with actions like `BUY_ITEM`, `MOVE_ITEM_TO_SHELF`, `SET_PHASE`, `SET_DAY`, `START_NEGOTIATION`, etc.
*   **`WebLLMContext.jsx`:** Handles interaction with the AI model worker (`generateResponse`).
*   **`ShopLayout.jsx`:** Main UI structure, conditionally renders `MarketPanel` or `Shelf` based on `state.phase`.
*   **`MarketPanel.jsx`:** Displays wholesale items and handles buying.
*   **`Inventory.jsx`:** Displays player inventory, implements drag source (`useDrag`).
*   **`Shelf.jsx`:** Displays items for sale, implements drop target (`useDrop`), checks phase before allowing drops.
*   **`Controls.jsx`:** Handles "Advance Time", "Next Customer", and negotiation UI/logic.
*   **`DialoguePanel.jsx`:** Displays dialogue messages from the state.
*   **`AnimatedBackground.jsx`:** Provides the floating coin background effect (currently working but rotation isn't visually apparent).

**Known Issues / Areas for Improvement:**

*   **Item Visuals:** Items are currently represented only by name text. Adding icons or basic visual representations is needed.
*   **Shelf Drag-and-Drop:** Only supports moving *to* the shelf. Rearranging or moving back to inventory is not implemented.
*   **Negotiation UI/Feedback:** Could be clearer which offer is whose, negotiation history display, etc.
*   **AI Robustness:** Basic error handling exists, but more edge cases could be handled (e.g., malformed AI JSON).
*   **Balancing:** Prices, budgets, AI offer generation need tuning.
*   **No Save/Load:** Game state is lost on refresh.
