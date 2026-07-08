# 🪙 Haggle

A fantasy shop simulator where every customer is played by an open-weight language model running **entirely in your browser**. No server, no API key — the model downloads once, is cached, and all inference happens locally via WebGPU.

You've just bought an item shop, along with the 2,500-gold debt that came with it. Buy stock wholesale, set your price tags, and haggle with AI customers until the deed is truly yours — or until the creditors take it back.

## How it plays

Each day has three phases:

1. **Night (management)** — buy stock from the wholesale market, expand your shelf, and pay down the debt early if you can.
2. **Morning (setup)** — arrange items on the shelf and set a price tag on each one. Fair tags sell fast and build reputation; steep tags mean harder haggles.
3. **Day (selling)** — a limited number of customers come through the door. Each one has a personality, a hidden budget, and a patience meter. They pick an item, open with a lowball offer, and the haggling begins.

A 500g loan payment comes due every seven days. Miss it and the shop is repossessed. Pay off the full debt and you win.

Reputation is the long game: fair deals earn it, failed negotiations lose it, and it gates access to uncommon and rare goods, wealthier customers, and more foot traffic. Gouge people and you'll be rich, briefly, and alone.

Your progress auto-saves in the browser, so you can close the tab mid-week and pick the game back up later.

## The interesting part: structured generation in the browser

Haggle is a demonstration of [WebLLM](https://github.com/mlc-ai/web-llm) and grammar-constrained JSON generation. The negotiation loop works like this:

- Each customer turn is a chat completion with the full haggling history replayed, so the model remembers what's been said.
- Responses are **schema-constrained** (`response_format: { type: "json_object", schema }`): the model must produce `{ decision, offer, spokenResponse }`, with `decision` restricted to an enum and `offer` bounded by the customer's budget. The chosen item is constrained to an enum of what's actually on the shelf.
- The game logic then **validates and clamps** everything anyway: counters must move upward, offers can't exceed budgets or the asked price, and impossible "accepts" become max-budget counters. The LLM provides personality and dialogue; the rules engine keeps the economy honest.

This split — model for flavor, code for invariants — is what lets even a 1B-parameter model run a coherent negotiation.

Three model sizes are offered on the start screen (Qwen 3.5, with thinking mode disabled — customers banter instead of deliberating):

| Option | Model | Download | Character |
| --- | --- | --- | --- |
| Quick | Qwen 3.5 2B | ~1.2 GB | Fast, respectable personality |
| Balanced | Qwen 3.5 4B | ~2.3 GB | Recommended |
| Rich | Qwen 3.5 9B | ~5 GB | Most cunning; needs ~6.5 GB VRAM |

## Running it

Requires a browser with WebGPU (recent Chrome or Edge).

```bash
bun install    # or npm install
bun run dev    # or npm run dev
```

Then open the printed URL (the app is served under `/haggle/`).

`bun run build` produces a static bundle in `dist/`; a GitHub Actions workflow deploys it to GitHub Pages on push.

## Architecture

- **React + Vite**, no backend. State lives in a single reducer ([src/contexts/GameStateContext.jsx](src/contexts/GameStateContext.jsx)) and persists to `localStorage`.
- **[src/game/negotiation.js](src/game/negotiation.js)** — the negotiation engine: prompt builders, JSON schemas, and the validation/clamping layer.
- **[src/contexts/WebLLMContext.jsx](src/contexts/WebLLMContext.jsx)** — model lifecycle in a web worker, download progress, and schema-constrained generation with retry.
- **[src/gameState.js](src/gameState.js)** — items, customer types, and balance constants.
- Components in [src/components/](src/components) — market, shelf, storeroom, dialogue log, negotiation controls, and overlays.
