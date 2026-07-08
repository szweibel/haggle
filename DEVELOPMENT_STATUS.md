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
- Customers appraise items instead of knowing true value: knowledgeable/calculating types judge within ±5%, most within ±15%, and easily-impressed/distracted types within ±40% (fixed per visit, carried through the whole negotiation). Naive customers can be gouged — but reputation from sales is still scored against TRUE value, so gouging trades reputation for profit.
- Prompts follow the small-model literature: one-shot examples (a single demonstration beats zero-shot and many-shot for 1-4B models) and a short leading "reasoning" scratchpad key in each schema (constrained JSON degrades decisions when answer keys come first — arXiv:2408.02442; the field restores a sliver of the thinking mode we disable). The overall design matches published trading-NPC reliability patterns (arXiv:2507.07203): state-specific prompts, enum-constrained item references, arithmetic kept out of the model.
- Prompts are deliberately minimal — 2B-4B models hold only a few instructions, and piling on rules caused the very garbling it tried to prevent. The persona block plus a handful of lines: no percentage tables, no numbered rule lists, no reputation nudge (reputation works mechanically instead). Patience reaches the model as a mood word; the customer's description is framed as how others see them (so wizards stop remarking on their own sulfur smell); appraisals are private.
- Numbers and dialogue can't contradict: dialogue is asked to carry no numbers (the offer chip in the UI is authoritative), and when the model names some anyway, resolution is tiered by certainty — context echoes (tag, appraisal) are discarded; one remaining spoken number wins over the structured field and runs through the full decision pipeline (an above-ask "counter" becomes an acceptance); several numbers that corroborate the field keep the field; a genuine conflict triggers a one-question clarify generation asking the model what it meant. Spelled-out numbers are parsed by a vendored copy of @codecompose/words-to-numbers (MIT, in src/vendor/) with its fuzzy option removed — the clj-fuzzy dependency is a legacy UMD bundle that breaks under browser ESM. Decision/dialogue coherence: counters may hold firm at the previous offer, rejections read as final goodbyes, and when validation overrides a decision it also replaces the spoken line. (Schema fields stay fully required — small models omit optional fields even when instructed; a "leave" fills throwaway values.)
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
