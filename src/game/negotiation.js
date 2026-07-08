// Negotiation engine: prompt construction, JSON schemas for constrained
// generation, and validation/clamping of model output. The LLM provides
// personality and dialogue; this module enforces the economic rules so a
// small model can't break the game.

// Vendored (MIT) with the fuzzy option removed — see src/vendor/words-to-numbers.
import wordsToNumbers from '../vendor/words-to-numbers/index.js';

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

// How sharp an eye this customer has for what goods are really worth.
export function appraisalStyle(traits = []) {
  const joined = traits.join(' ');
  if (/knowledg|calculating|shrewd|detail-oriented|values quality/i.test(joined)) return 'expert';
  if (/easily impressed|easily confused|distracted|forgetful|impulsive|reckless/i.test(joined)) return 'naive';
  return 'normal';
}

const APPRAISAL_SPREAD = { expert: 0.05, normal: 0.15, naive: 0.4 };

// What this customer believes an item is worth. Experts appraise accurately;
// naive customers can be far off in either direction — which is what makes
// them gougeable (at a reputation cost, since saleReputation() judges by the
// item's TRUE value).
export function perceivedValue(item, customer) {
  const spread = APPRAISAL_SPREAD[appraisalStyle(customer.personalityTraits)];
  const skew = 1 + (Math.random() * 2 - 1) * spread;
  return Math.max(1, Math.round(item.baseValue * skew));
}

// ---------- Schemas (WebLLM grammar-constrained JSON) ----------
// Property order matters for generation quality: decisions and numbers come
// before the free-text dialogue so the dialogue can reflect them.

// Shelf items are referred to as item1..itemN in prompts and schemas —
// short positional ids are far harder for small models to garble than
// long instance-id strings.
// A short leading "reasoning" field gives the model a scratchpad before the
// decision keys — constrained JSON measurably degrades decision quality when
// the answer keys come first (arXiv:2408.02442), and this restores a
// sanctioned sliver of the thinking we disabled at the engine level.
export function initialOfferSchema(shelfCount, budget) {
  const ids = Array.from({ length: shelfCount }, (_, i) => `item${i + 1}`);
  return JSON.stringify({
    type: 'object',
    properties: {
      reasoning: { type: 'string', maxLength: 150 },
      decision: { type: 'string', enum: ['make_offer', 'leave'] },
      itemId: { type: 'string', enum: ids },
      offer: { type: 'integer', minimum: 1, maximum: budget },
      spokenResponse: { type: 'string', maxLength: 200 },
    },
    // All fields required: small models sometimes omit optional fields even
    // on make_offer (observed live), which torpedoes the negotiation. A
    // "leave" fills them with throwaway values instead.
    required: ['reasoning', 'decision', 'itemId', 'offer', 'spokenResponse'],
  });
}

export function counterSchema(budget) {
  return JSON.stringify({
    type: 'object',
    properties: {
      reasoning: { type: 'string', maxLength: 150 },
      decision: { type: 'string', enum: ['counter', 'accept', 'reject'] },
      offer: { type: 'integer', minimum: 1, maximum: budget },
      spokenResponse: { type: 'string', maxLength: 200 },
    },
    required: ['reasoning', 'decision', 'offer', 'spokenResponse'],
  });
}

// ---------- Prompts ----------
// Kept deliberately short: these run on 2B-4B models, which hold only a few
// instructions at once. The engine's clamps do the arithmetic enforcement;
// dialogue carries NO numbers (the UI's offer chip shows the authoritative
// figure), so spoken words can never contradict the structured offer.

function personaBlock(customer) {
  return `You are ${customer.name}, a customer in a fantasy item shop. Others see you as ${customer.description}.
Your manner: ${customer.personalityTraits.join(', ')}.
You carry ${customer.budget} gold, and not a coin more.
Speak as this character: one or two short sentences of plain shop talk. Never say numbers, prices, or gold amounts out loud — your "offer" field does that for you.`;
}

export function buildInitialOfferMessages(customer, shelfItems, perceivedValues) {
  const itemLines = shelfItems
    .map(
      (i, idx) =>
        `- item${idx + 1}: ${i.name} — tagged ${i.askingPrice}g; you'd privately judge it worth about ${perceivedValues[idx]}g`
    )
    .join('\n');

  const system = `${personaBlock(customer)}

You came in shopping for: ${customer.interests.join(', ')}.

On the shelves:
${itemLines}

Start with "reasoning": one short private thought about what to do (the shopkeeper never hears it).
If an item suits your interests and your purse, set decision "make_offer" with its "itemId" and your opening "offer" in gold — open well below the tag; you mean to haggle.
If nothing suits you, set decision "leave" (itemId "item1", offer 1).
Then write "spokenResponse": greet the shopkeeper and show interest in your chosen item — or make a brief excuse and go. No numbers out loud.

Example (a different customer in a different shop):
{"reasoning": "The kettle fits what I need and my purse; open low.", "decision": "make_offer", "itemId": "item2", "offer": 9, "spokenResponse": "That iron kettle there — sturdy enough, I suppose, though the tag is ambitious. What would you really take for it?"}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: 'The shopkeeper looks up: "Welcome in! See anything you like?"' },
  ];
}

export function buildCounterMessages(negotiation, playerText, playerPrice) {
  const { customer, item, patience, initialPatience, history } = negotiation;
  const worth = negotiation.perceivedValue ?? item.baseValue;
  const mood = patienceLabel(patience, initialPatience);

  const system = `${personaBlock(customer)}

You are haggling for the ${item.name} — tagged ${item.askingPrice}g; you'd privately judge it worth about ${worth}g.
Your mood right now: ${mood}. Let it color your words.

The shopkeeper has just named a price. Start with "reasoning": one short private thought about the price (the shopkeeper never hears it). Then set "decision":
- "accept" if the price suits you;
- "counter" with a new "offer" — repeat your last offer to hold firm, or raise it a little; never match the shopkeeper's price;
- "reject" to walk out for good.
Then write "spokenResponse": haggle, agree, or say a final goodbye. No numbers out loud.

Example (a different haggle):
{"reasoning": "Still above what it's worth to me; inch up a little.", "decision": "counter", "offer": 12, "spokenResponse": "You drive a hard bargain. I can stretch a little further, but not to that."}`;

  // Replay the conversation so the model remembers what has been said.
  const messages = [{ role: 'system', content: system }];
  let firstCustomerTurn = true;
  for (const turn of history) {
    if (turn.speaker === 'customer') {
      messages.push({
        role: 'assistant',
        content: JSON.stringify({
          decision: firstCustomerTurn ? 'make_offer' : 'counter',
          offer: turn.offer ?? 0,
          spokenResponse: turn.text,
        }),
      });
      firstCustomerTurn = false;
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

// Models sometimes name a different figure in dialogue than in the offer
// field ("How about forty-five?" with offer: 46). The prose is generated
// last and carries the model's real intent, so spoken numbers matter.
// Resolution is tiered by certainty: context echoes (price tag, item worth)
// are discarded; a single remaining number wins outright; several numbers
// that corroborate the field keep the field; and a genuine conflict is
// settled by asking the model itself what it meant (see buildClarifyMessages).
// All numbers in the text — digits or spelled out — in reading order.
// wordsToNumbers normalizes "forty-five" / "two hundred" etc. into digits.
export function spokenNumbers(text) {
  const normalized = String(wordsToNumbers(text) ?? text);
  return [...normalized.matchAll(/\d+/g)].map((m) => Number(m[0]));
}

// Decide what number (if any) the spoken words propose.
// Returns { kind: 'none' } | { kind: 'value', value } | { kind: 'conflict' }.
function spokenProposal(text, fieldOffer, echoes) {
  if (!text) return { kind: 'none' };
  const candidates = [...new Set(spokenNumbers(text))].filter(
    // Articles normalize to 1 ("not a coin more" -> "not 1 coin more"), so
    // degenerate 1s don't count as proposals; nor do context echoes.
    (n) => n > 1 && !echoes.includes(n)
  );
  if (candidates.length === 0) return { kind: 'none' };
  if (candidates.length === 1) return { kind: 'value', value: candidates[0] };
  if (candidates.includes(fieldOffer)) return { kind: 'none' }; // field corroborated
  return { kind: 'conflict' };
}

// One-question follow-up used when dialogue and offer field disagree and the
// words are ambiguous: let the model say what it meant.
export function buildClarifyMessages(customer, text) {
  return [
    {
      role: 'system',
      content: `You are ${customer.name}, haggling in a fantasy item shop. You just told the shopkeeper: "${text}"`,
    },
    { role: 'user', content: 'So how much are you offering, in gold? Give the one number you meant.' },
  ];
}

export function clarifySchema(budget) {
  return JSON.stringify({
    type: 'object',
    properties: { offer: { type: 'integer', minimum: 1, maximum: budget } },
    required: ['offer'],
  });
}

// Returns { kind: 'offer', item, offer, text } | { kind: 'leave', text }
//       | { kind: 'unclear', text } | { kind: 'invalid' }
// 'unclear' means dialogue and offer field name different numbers and the
// words are ambiguous — the caller should ask the model to clarify, then
// call again with clarifiedOffer.
export function resolveInitialOffer(parsed, shelfItems, customer, perceivedValues = [], clarifiedOffer = null) {
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

  if (clarifiedOffer != null) {
    offer = Math.round(clarifiedOffer);
  } else {
    // Numbers that merely repeat known context aren't proposals.
    const echoes = [item.askingPrice, item.baseValue, perceivedValues[index]].filter((n) => n != null);
    const proposal = spokenProposal(text, offer, echoes);
    if (proposal.kind === 'value') offer = proposal.value;
    else if (proposal.kind === 'conflict') return { kind: 'unclear', text };
  }

  // Hard rules the model must not break: budget cap, and no opening above
  // the price tag (that's not haggling, that's charity).
  offer = Math.max(1, Math.min(offer, customer.budget, item.askingPrice));

  return { kind: 'offer', item, offer, text: text || `I'll give you ${offer}g for the ${item.name}.` };
}

// Returns { kind: 'accept' | 'reject', text } | { kind: 'counter', offer, text }
//       | { kind: 'unclear', text } | { kind: 'invalid' }
export function resolveCounter(parsed, negotiation, playerPrice, clarifiedOffer = null) {
  if (!parsed || typeof parsed !== 'object') return { kind: 'invalid' };
  const text = typeof parsed.spokenResponse === 'string' && parsed.spokenResponse.trim()
    ? parsed.spokenResponse.trim()
    : null;
  const prevOffer = negotiation.customerOffer;
  const budget = negotiation.customer.budget;

  if (parsed.decision === 'accept') {
    // Can't accept a price beyond their purse — treat as a max-budget
    // counter. The model's line agreed to a deal we're not making, so
    // don't use it.
    if (playerPrice > budget) {
      return {
        kind: 'counter',
        offer: budget,
        text: `That's beyond my purse — ${budget}g is every coin I have.`,
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

  if (clarifiedOffer != null) {
    offer = Math.round(clarifiedOffer);
  } else {
    const { item } = negotiation;
    const echoes = [item.askingPrice, item.baseValue, negotiation.perceivedValue].filter((n) => n != null);
    const proposal = spokenProposal(text, offer, echoes);
    if (proposal.kind === 'value') offer = proposal.value;
    else if (proposal.kind === 'conflict') return { kind: 'unclear', text };
  }

  // A counter at or above the asked price is just acceptance. The model's
  // line names a different number than the sale price, so replace it.
  if (offer >= playerPrice && playerPrice <= budget) {
    return { kind: 'accept', text: `${playerPrice}g it is — deal.` };
  }
  // Counters may hold firm at the previous offer or move upward, but must
  // stay under the asked price and within budget. Patience still drains
  // every round, so a stonewalling customer can't loop forever.
  const floor = Math.min(prevOffer, budget);
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
