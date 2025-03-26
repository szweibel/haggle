# Haggle Game - Development Status (As of March 26, 2025)

This document outlines the current state of the Haggle React game project.

**Core Gameplay Loop:**

The basic structure of the day/phase cycle and the core negotiation loop is implemented:

1.  **Management Phase (`'management'`):**
    *   Game starts in this phase.
    *   `MarketPanel` is displayed, showing `WHOLESALE_ITEMS` (filtered by reputation).
    *   Player can click "Buy" to purchase items using the `BUY_ITEM` action.
    *   Bought items are added to the `inventory` state array.
    *   Player can click "Upgrade Shelf" button (if affordable).
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
        *   Uses `WebLLMContext` (`generateResponse`) with a system prompt detailing items, customer persona/traits, and budget to get an initial offer in JSON format (`{ spokenResponse, offer, itemId, decision }`).
        *   Dispatches `START_NEGOTIATION` with the chosen item, customer details, initial offer, and calculated initial `patience`.
        *   Displays the customer's opening dialogue.
    *   **Negotiation:**
        *   When `currentNegotiation` is active, `Controls` displays negotiation inputs (text, price), descriptive Mood/Patience, and buttons (Send, Accept, Walk Away).
        *   Sending a player response dispatches `PLAYER_RESPONSE`, decreases `patience`, and triggers the AI via `generateResponse` (prompt includes current patience) for a counter-offer/decision.
        *   AI response (`CUSTOMER_RESPONSE`, `ACCEPT_OFFER`, `END_NEGOTIATION`) updates the state. `CUSTOMER_RESPONSE` also decreases `patience`.
        *   Accepting (`ACCEPT_OFFER`) increases `reputation`.
        *   Rejecting/Walking Away (`END_NEGOTIATION`) decreases `reputation`.
        *   Negotiation ends automatically if `patience` reaches 0.
    *   Clicking "Advance Time" checks for loan payment, updates due date or triggers game over, then transitions back to the `management` phase and increments the day (`SET_DAY`).

**Implemented Systems:**

*   **Phase Management:** Day cycles through `management` -> `setting up` -> `selling` phases via "Advance Time" button.
*   **Buying:** Player can buy `WHOLESALE_ITEMS` during `management` phase (`MarketPanel`). Items added to `inventory`.
*   **Stocking:** Player can drag items from `Inventory` to `Shelf` during `setting up` phase (`react-dnd`). Items moved to `displayedItems`.
*   **Selling/Negotiation:** Core loop with AI integration for offers and counter-offers using JSON mode.
*   **Reputation System:** Tracked (+1 on sale, -1 on fail/walk away). Displayed in UI. AI prompts (`Controls.jsx`) updated to consider reputation, subtly influencing initial offers and negotiation stance (higher rep = slightly better offers/easier negotiation, lower rep = vice versa).
*   **Mood/Patience System:** Tracked per negotiation, initialized by traits, decreases on counters, influences AI prompt, ends negotiation at 0. Displayed descriptively in UI.
*   **Loan System:** Weekly payment automatically attempted, triggers game over on failure, updates due date on success. Amount and due date displayed in UI.
*   **Shelf Upgrade System:** Button available in `management` phase, increases `shopShelves` state, deducts scaling gold cost. Capacity displayed in UI.
*   **Item Tiers & Market Gating:** Items have Common/Uncommon/Rare tiers. `MarketPanel` filters available items based on player `reputation`.
*   **Consent & Loading:** First-load consent modal for LLM download (uses `localStorage`). Loading overlay with progress text shown during initialization.

**Key Components & State:**

*   **`gameState.js`:** Defines `initialState` (including `reputation`, `loanAmount`, `loanDueDate`, `gameOver`), `CUSTOMER_TYPES` (with `personalityTraits`, `interests`, adjusted `budget`), tiered `WHOLESALE_ITEMS`, `COLORS`.
*   **`GameStateContext.jsx`:** Manages game state via `useReducer` (`gameReducer`) with actions for all major systems.
*   **`WebLLMContext.jsx`:** Handles interaction with the AI model worker (`generateResponse`), waits for consent, provides `initProgressCallback`.
*   **`ShopLayout.jsx`:** Main UI structure, conditionally renders `MarketPanel` or `Shelf`, displays top bar info (Day, Rep, Loan, Gold).
*   **`MarketPanel.jsx`:** Displays reputation-filtered wholesale items and handles buying.
*   **`Inventory.jsx`:** Displays player inventory, implements drag source (`useDrag`).
*   **`Shelf.jsx`:** Displays items for sale, implements drop target (`useDrop`), checks phase before allowing drops. Capacity based on `state.shopShelves`.
*   **`Controls.jsx`:** Handles "Advance Time", "Next Customer", Shelf Upgrade trigger, and negotiation UI/logic (including Patience display).
*   **`DialoguePanel.jsx`:** Displays dialogue messages from the state.
*   **`AnimatedBackground.jsx`:** Provides the floating coin background effect.
*   **`ConsentModal.jsx`:** Displays first-load consent message.
*   **`Layout.jsx`:** Contains main layout structure and loading overlay logic.

**Known Issues / Areas for Improvement:**

*   **Item Visuals:** Items are currently represented only by name text. Adding icons or basic visual representations is needed.
*   **Shelf Drag-and-Drop:** Only supports moving *to* the shelf. Rearranging or moving back to inventory is not implemented.
*   **Negotiation UI/Feedback:** Could still be clearer (e.g., history, explicit offers).
*   **Reputation Effects (Further):** Reputation now subtly affects AI offers/stance, but could have broader effects (e.g., customer generation, market access tuning).
*   **AI Robustness:** Basic error handling exists, but more edge cases could be handled (e.g., malformed AI JSON).
*   **Balancing:** Prices, budgets, AI offer generation, loan amount, upgrade costs, reputation thresholds need tuning through playtesting.
*   **Game Over State:** Currently just stops phase advancement and disables buttons; needs clearer UI indication/screen.
*   **No Save/Load:** Game state is lost on refresh.
