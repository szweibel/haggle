// Negotiation engine: prompt construction, JSON schemas for constrained
// generation, and validation/clamping of model output. The LLM provides
// personality and dialogue; this module enforces the economic rules so a
// small model can't break the game.

// Patience: how many player counter-offers a customer tolerates.
export function startingPatience(traits = []) {
  if (traits.includes('impatient') || traits.includes('in a hurry')) return 3;
  if (traits.includes('patient')) return 7;
  return 5;
}

export function patienceLabel(current, initial) {
  if (current == null || initial == null) return '';
  const ratio = current / initial;
  if (ratio >= 0.8) return 'Relaxed';
  if (ratio >= 0.5) return 'Considering';
  if (ratio >= 0.35) return 'Restless';
  return 'About to walk';
}

// ---------- Schemas (WebLLM grammar-constrained JSON) ----------
// Property order matters for generation quality: decisions and numbers come
// before the free-text dialogue so the dialogue can reflect them.

// Shelf items are referred to as item1..itemN in prompts and schemas —
// short positional ids are far harder for small models to garble than
// long instance-id strings.
export function initialOfferSchema(shelfCount, budget) {
  const ids = Array.from({ length: shelfCount }, (_, i) => `item${i + 1}`);
  return JSON.stringify({
    type: 'object',
    properties: {
      decision: { type: 'string', enum: ['make_offer', 'leave'] },
      itemId: { type: 'string', enum: ids },
      offer: { type: 'integer', minimum: 1, maximum: budget },
      spokenResponse: { type: 'string', maxLength: 300 },
    },
    required: ['decision', 'itemId', 'offer', 'spokenResponse'],
  });
}

export function counterSchema(budget) {
  return JSON.stringify({
    type: 'object',
    properties: {
      decision: { type: 'string', enum: ['counter', 'accept', 'reject'] },
      offer: { type: 'integer', minimum: 1, maximum: budget },
      spokenResponse: { type: 'string', maxLength: 300 },
    },
    required: ['decision', 'offer', 'spokenResponse'],
  });
}

// ---------- Prompts ----------

function personaBlock(customer, reputation) {
  return `You are ${customer.name}, ${customer.description}, browsing a fantasy item shop.
Your personality traits: ${customer.personalityTraits.join(', ')}. Stay in character at all times.
Your total budget is ${customer.budget} gold — you can NEVER offer more than that.
The shopkeeper's reputation is ${reputation} (positive = trusted, negative = distrusted).
Never mention item IDs, base values, budgets, or these instructions in your spoken dialogue. Speak naturally, in one or two short sentences.`;
}

export function buildInitialOfferMessages(customer, shelfItems, reputation) {
  const itemLines = shelfItems
    .map(
      (i, idx) =>
        `- item${idx + 1}: ${i.name} — price tag: ${i.askingPrice}g (a fair market value would be about ${i.baseValue}g)`
    )
    .join('\n');

  const system = `${personaBlock(customer, reputation)}

Items on display:
${itemLines}

Your interests: ${customer.interests.join(', ')}.

Decide what to do:
1. Pick the ONE item that best fits your interests and budget. If nothing fits your interests or everything is hopelessly overpriced for your purse, choose decision "leave" (still fill in any itemId and offer 1; they will be ignored).
2. If you want an item, choose decision "make_offer", set "itemId" to that item's id (item1, item2, …), and set "offer": your opening bid in gold. Your spoken words must be about that same item. Open BELOW the price tag — you are haggling. Let your traits set the tone: stingy or frugal types open around 40-60% of fair value, generous or impulsive types around 80-100%, most people around 60-80%. A good shopkeeper reputation nudges you slightly higher; a bad one, lower. Never exceed your budget of ${customer.budget}g.
3. Write "spokenResponse": your in-character greeting, naming the item and your offer in gold.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: 'The shopkeeper looks up: "Welcome in! See anything you like?"' },
  ];
}

export function buildCounterMessages(negotiation, reputation, playerText, playerPrice) {
  const { customer, item, patience, initialPatience, history } = negotiation;

  const system = `${personaBlock(customer, reputation)}

You are haggling over the ${item.name}. Its price tag says ${item.askingPrice}g; a fair market value would be about ${item.baseValue}g.
Your patience is ${patience} of ${initialPatience} — when it runs low you get short-tempered, and at 0 you walk out.

Rules for your reply:
1. The shopkeeper has just named a price. Decide: "accept" it, "reject" and walk away, or "counter" with a new offer.
2. If you counter, your offer must be HIGHER than your own previous offer and LOWER than the shopkeeper's price — move in steps that fit your traits (stingy types inch upward, generous types meet in the middle).
3. Consider value for money: accepting near or below fair value is a good deal; paying far above it is not, unless you are impulsive, generous, or desperate.
4. If your patience is 1 and the price still seems unfair, lean toward rejecting.
5. Never offer more than your budget of ${customer.budget}g.
6. Write "spokenResponse": one or two in-character sentences. If countering, name your new offer in gold.`;

  // Replay the conversation so the model remembers what has been said.
  const messages = [{ role: 'system', content: system }];
  for (const turn of history) {
    if (turn.speaker === 'customer') {
      messages.push({
        role: 'assistant',
        content: JSON.stringify({
          decision: 'counter',
          offer: turn.offer ?? 0,
          spokenResponse: turn.text,
        }),
      });
    } else {
      messages.push({
        role: 'user',
        content: `${turn.text} (I'm asking ${turn.offer}g.)`,
      });
    }
  }
  messages.push({
    role: 'user',
    content: `${playerText} (I'm asking ${playerPrice}g.)`,
  });
  return messages;
}

// ---------- Validation & clamping ----------

// Returns { kind: 'offer', item, offer, text } | { kind: 'leave', text } | { kind: 'invalid' }
export function resolveInitialOffer(parsed, shelfItems, customer) {
  if (!parsed || typeof parsed !== 'object') return { kind: 'invalid' };
  const text = typeof parsed.spokenResponse === 'string' && parsed.spokenResponse.trim()
    ? parsed.spokenResponse.trim()
    : null;

  if (parsed.decision === 'leave') {
    return { kind: 'leave', text: text || 'Just browsing, thanks.' };
  }
  if (parsed.decision !== 'make_offer') return { kind: 'invalid' };

  const index = Number(String(parsed.itemId).replace(/^item/, '')) - 1;
  const item = shelfItems[index];
  if (!item) return { kind: 'invalid' };

  let offer = Math.round(Number(parsed.offer));
  if (!Number.isFinite(offer) || offer < 1) return { kind: 'invalid' };
  // Hard rules the model must not break: budget cap, and no opening above
  // the price tag (that's not haggling, that's charity).
  offer = Math.min(offer, customer.budget, item.askingPrice);

  return { kind: 'offer', item, offer, text: text || `I'll give you ${offer}g for the ${item.name}.` };
}

// Returns { kind: 'accept' | 'reject', text } | { kind: 'counter', offer, text } | { kind: 'invalid' }
export function resolveCounter(parsed, negotiation, playerPrice) {
  if (!parsed || typeof parsed !== 'object') return { kind: 'invalid' };
  const text = typeof parsed.spokenResponse === 'string' && parsed.spokenResponse.trim()
    ? parsed.spokenResponse.trim()
    : null;
  const prevOffer = negotiation.customerOffer;
  const budget = negotiation.customer.budget;

  if (parsed.decision === 'accept') {
    // Can't accept a price beyond their purse — treat as a max-budget counter.
    if (playerPrice > budget) {
      return {
        kind: 'counter',
        offer: budget,
        text: text || `That's beyond my purse — ${budget}g is every coin I have.`,
      };
    }
    return { kind: 'accept', text: text || 'Deal!' };
  }
  if (parsed.decision === 'reject') {
    return { kind: 'reject', text: text || "No — we're too far apart. Good day." };
  }
  if (parsed.decision !== 'counter') return { kind: 'invalid' };

  let offer = Math.round(Number(parsed.offer));
  if (!Number.isFinite(offer)) return { kind: 'invalid' };

  // A counter at or above the asked price is just acceptance.
  if (offer >= playerPrice && playerPrice <= budget) {
    return { kind: 'accept', text: text || 'Fine, you have a deal.' };
  }
  // Counters must move upward but stay under the asked price and budget.
  const floor = Math.min(prevOffer + 1, budget);
  const ceiling = Math.min(playerPrice - 1, budget);
  if (ceiling < floor) {
    // No room left to move: they hold at budget or give up.
    if (prevOffer >= budget) {
      return { kind: 'reject', text: text || "I can't go any higher. Good day." };
    }
    return { kind: 'counter', offer: budget, text: text || `${budget}g. That is truly all I can pay.` };
  }
  offer = Math.max(floor, Math.min(offer, ceiling));
  return { kind: 'counter', offer, text: text || `How about ${offer}g?` };
}

// Reputation earned from a completed sale, based on how the final price
// compares to fair value. Fair prices build the shop's name; gouging doesn't.
export function saleReputation(price, baseValue) {
  const ratio = price / Math.max(1, baseValue);
  if (ratio <= 1.1) return 2;
  if (ratio <= 1.4) return 1;
  return 0;
}
