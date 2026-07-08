# Haggle — Development Status (July 2026 revision)

The March 2025 prototype was fully revised into a complete, winnable game. This note records what changed and what could come next.

## What the revision added

**Game completeness**
- Win condition: pay off the full 2,500g debt (weekly 500g payments, plus optional early paydown). Victory and game-over screens with run stats.
- Limited customers per day (4 + reputation bonus, max 8), so each day's stock and pricing decisions matter.
- Player-set asking prices on shelf items during the morning phase.
- End-of-day summary overlay (customers, sales, revenue, loan status).
- Auto-save to localStorage with continue/new-game on the start screen.
- Stats tracking: items sold, revenue, failed negotiations, best flip.
- Reputation reworked: fair sale +2, decent sale +1, gouging +0, failed negotiation −1. Gates market tiers (10/25 rep), customer tiers (5/15 rep), and daily foot traffic.

**AI reliability**
- Grammar-constrained JSON output (WebLLM `response_format.schema`): decisions are enums, offers are integer-bounded by budget, chosen items are an enum of actual shelf instance IDs.
- WebLLM upgraded to 0.2.84 and models moved from Llama 3.x to Qwen 3.5 (2B/4B/9B) with `enable_thinking: false` so the hybrid-reasoning models reply immediately instead of deliberating; leading `<think>` blocks are stripped before JSON parsing.
- Weight storage falls through backends (Cache API → OPFS → IndexedDB) because some browsers' Cache/IDB implementations choke on multi-GB writes; `localStorage.haggle_cache_backend` pins one for debugging.
- Shelf items are referenced as item1..itemN in prompts and schema enums (mapped back in code) — small models garbled long instance-id strings and picked the wrong item.
- Customer draw avoids the same face twice in a row and prefers customers who can plausibly afford something on display, so limited daily visits aren't wasted on window-shoppers.
- Full negotiation history replayed to the model each turn (the prototype only sent the last message).
- Code-side validation and clamping in `src/game/negotiation.js`: counters must move upward and stay below the asked price, over-budget accepts become max-budget counters, and unusable output degrades to "my offer stands" instead of breaking the negotiation.
- Model picker on the start screen (Llama 3.2 1B / 3.2 3B / 3.1 8B), stored per browser.
- Model loads in the background while the player stocks the shop (non-blocking banner with progress).

**UI/UX**
- Proper start screen (replaces the consent modal), chat-bubble dialogue log, customer cards with portrait/traits/patience meter, item emoji, quick-offer buttons (split the difference / hold firm), two-way drag-and-drop plus click-to-move between storeroom and shelf, empty shelf slots, tier-locked market sections.
- Dropped pixi.js and react-router; the animated background is CSS-only.

## Known limitations / future ideas

- Small models occasionally produce off-key dialogue even though the structured offer stays correct (Qwen 3.5 2B is noticeably better than the old Llama 1B; 4B is solid). The offer chip in the dialogue log is always the authoritative number.
- The Rich (9B) option was not playtested end-to-end — same family and chat template as the verified 2B/4B, but worth one manual run on a machine with ~6.5 GB of VRAM.
- Customer memory is per-visit; regulars who remember past deals would be a fun reputation extension.
- No sound. No mobile-optimized layout (playable but cramped below ~900px).
- Balance has had one tuning pass; a full playthrough sheet (expected profit per day vs. debt schedule) would sharpen it.
- Possible showcase additions: streaming dialogue text as it generates; a "shopkeeper's ledger" screen graphing profit per day.
