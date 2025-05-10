# Haggle

![Haggle Game](https://via.placeholder.com/800x400?text=Haggle+Game)

## Overview

Haggle is an experimental fantasy shop simulation game that demonstrates the power of WebLLM and structured generation. In this game, you take on the role of a shop owner who has just purchased a fantasy item shop, taking on a 5000 gold debt with weekly payments of 500 gold. Your goal is to buy items wholesale, display them in your shop, and negotiate with AI-powered customers to make a profit and pay off your debt.

The game showcases how large language models can be integrated directly into web applications to create dynamic, personalized interactions. Each customer in the game has a unique personality, budget, and interests, all powered by an LLM running directly in your browser.

## Technical Highlights

- **In-Browser AI**: Uses [WebLLM](https://github.com/mlc-ai/web-llm) to run the Llama-3.1-8B-Instruct model directly in the browser
- **Structured Generation**: Implements JSON-mode prompting to guide the LLM to generate structured responses for game mechanics
- **React Framework**: Built with React and modern hooks for state management
- **Drag-and-Drop Interface**: Uses react-dnd for intuitive item management
- **Animated UI**: Features Pixi.js for visual effects

## Gameplay Features

### Core Loop

1. **Management Phase**: Buy items wholesale based on your reputation level
2. **Setup Phase**: Arrange items on your shop shelves using drag-and-drop
3. **Selling Phase**: Negotiate with AI-powered customers who have unique personalities, budgets, and interests

### Key Systems

- **AI Negotiation**: Each customer has distinct personality traits that affect their negotiation style, patience, and offers
- **Reputation System**: Successfully complete sales to increase your reputation and unlock higher-tier items
- **Loan System**: Manage weekly payments to avoid game over
- **Shelf Upgrade System**: Expand your display capacity to show more items
- **Item Tiers**: Progress from common to rare items as your reputation grows

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/haggle.git
cd haggle

# Install dependencies
npm install
# or
yarn install
```

### Running the Game

```bash
# Start the development server
npm run dev
# or
yarn dev
```

Then open your browser to `http://localhost:5173` (or the port shown in your terminal).

## How to Play

### Objective

Successfully manage your shop, pay off your loan, and build your reputation to access higher-tier items and customers.

### Game Phases

1. **Management Phase**:
   - Buy items from the wholesale market
   - Upgrade your shelf capacity if you have enough gold
   - Click "Start Next Day" when ready

2. **Setup Phase**:
   - Drag items from your inventory to the shelf
   - Arrange your display strategically based on expected customers
   - Click "Open Shop" when ready

3. **Selling Phase**:
   - Click "Next Customer" to bring in a potential buyer
   - Negotiate with customers by countering their offers
   - Balance between maximizing profit and maintaining customer patience
   - Click "End Day" when finished selling

### Negotiation Tips

- Each customer has unique personality traits that affect their patience and offers
- Watch the customer's mood indicator during negotiations
- Higher reputation slightly improves initial offers
- Successful sales increase reputation, while failed negotiations decrease it
- Some customers are more interested in specific item categories

## Development Status

As of the latest update, Haggle is a functional prototype with the following features implemented:

### Implemented Systems

- Core gameplay loop with day/phase cycle
- AI-powered customer negotiations using WebLLM
- Inventory and shelf management with drag-and-drop
- Reputation and loan systems
- Item tiers and market progression
- Shelf upgrade system

### Known Issues / Areas for Improvement

- Items are currently represented only by text (no visual icons)
- Shelf drag-and-drop only supports moving items to the shelf, not rearranging or returning to inventory
- Game balance (prices, budgets, reputation thresholds) needs further tuning
- No save/load functionality (game state is lost on refresh)
- Game over state needs clearer UI indication

## Technical Architecture

### Component Structure

- **GameStateContext**: Central state management using React's useReducer
- **WebLLMContext**: Manages the WebLLM integration and AI response generation
- **ShopLayout**: Main UI container that changes based on game phase
- **MarketPanel**: Displays items available for purchase
- **Inventory**: Shows player's owned items with drag functionality
- **Shelf**: Displays items for sale with drop functionality
- **Controls**: Phase-specific buttons and negotiation interface
- **DialoguePanel**: Shows conversation history with customers

### WebLLM Integration

The game uses the @mlc-ai/web-llm library to run the Llama-3.1-8B-Instruct model directly in the browser. The model is loaded in a web worker to prevent blocking the main UI thread. The integration includes:

1. A consent flow for downloading the model
2. Progress indicators during model initialization
3. Structured prompts that guide the LLM to generate JSON responses
4. Error handling for malformed AI responses

### State Management

The game state is managed through a central reducer with actions for:
- Buying and moving items
- Starting and progressing negotiations
- Updating reputation and loan status
- Advancing game phases and days

## Credits & Acknowledgments

- Built with [React](https://reactjs.org/) and [Vite](https://vitejs.dev/)
- AI powered by [WebLLM](https://github.com/mlc-ai/web-llm) and [Llama-3.1-8B-Instruct](https://llama.meta.com/)
- Drag and drop functionality via [react-dnd](https://react-dnd.github.io/react-dnd/)
- Animations with [Pixi.js](https://pixijs.com/)

---

This project is an experimental demonstration of how WebLLM can be used for structured generation in interactive applications. The AI-powered negotiations showcase how language models can create dynamic, personalized experiences directly in the browser without requiring server-side processing.
