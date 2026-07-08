import { useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { useWebLLM } from '../contexts/WebLLMContext';
import {
  customersPerDay,
  getEligibleCustomers,
  shelfUpgradeCost,
  MINOR_TRAITS,
  GAME_CONFIG,
} from '../gameState';
import {
  buildInitialOfferMessages,
  initialOfferSchema,
  resolveInitialOffer,
  buildCounterMessages,
  counterSchema,
  resolveCounter,
  buildClarifyMessages,
  clarifySchema,
  patienceLabel,
  perceivedValue,
} from '../game/negotiation';
import styles from './Controls.module.css';

export default function Controls({ className }) {
  const { state, dispatch } = useGameState();
  const { initialized, generating, generateJSON } = useWebLLM();
  const [playerText, setPlayerText] = useState('');
  const [playerPrice, setPlayerPrice] = useState('');

  const neg = state.currentNegotiation;
  const customersLeft = Math.max(0, customersPerDay(state.reputation) - state.customersServedToday);

  // ---- Customer arrival ----

  const handleNextCustomer = async () => {
    if (state.displayedItems.length === 0 || generating || !initialized || neg || customersLeft <= 0) return;

    // Avoid the same face twice in a row.
    let pool = getEligibleCustomers(state.reputation);
    if (pool.length > 1 && state.lastCustomerName) {
      pool = pool.filter((c) => c.name !== state.lastCustomerName);
    }
    // Prefer customers who can plausibly afford something on display, so
    // limited daily visits aren't wasted on hopeless window-shoppers.
    const cheapest = Math.min(...state.displayedItems.map((i) => i.askingPrice));
    const canShop = pool.filter((c) => c.budget >= cheapest * 0.5);
    if (canShop.length > 0) pool = canShop;
    const base = pool[Math.floor(Math.random() * pool.length)];

    // Per-visit variation: budget wobble and one extra quirk.
    const budget = Math.max(10, Math.round(base.budget * (0.85 + Math.random() * 0.3)));
    const extras = MINOR_TRAITS.filter((t) => !base.personalityTraits.includes(t));
    const quirk = extras[Math.floor(Math.random() * extras.length)];
    const customer = {
      ...base,
      budget,
      personalityTraits: quirk ? [...base.personalityTraits, quirk] : base.personalityTraits,
    };

    dispatch({ type: 'CUSTOMER_ENTERS', payload: customer });

    const shelf = state.displayedItems;
    // What this customer believes each item is worth — experts appraise
    // accurately, naive types can be way off. Fixed for the whole visit.
    const perceived = shelf.map((i) => perceivedValue(i, customer));
    const parsed = await generateJSON(
      buildInitialOfferMessages(customer, shelf, perceived),
      initialOfferSchema(shelf.length, customer.budget)
    );
    let resolved = resolveInitialOffer(parsed, shelf, customer, perceived);
    if (resolved.kind === 'unclear') {
      // Dialogue and offer field disagree ambiguously — ask the model
      // what it meant, then resolve with that number (or fall back to
      // the original field).
      const clarified = await generateJSON(
        buildClarifyMessages(customer, resolved.text),
        clarifySchema(customer.budget)
      );
      resolved = resolveInitialOffer(
        parsed, shelf, customer, perceived,
        clarified?.offer ?? Math.round(Number(parsed.offer))
      );
    }

    if (resolved.kind === 'offer') {
      dispatch({
        type: 'NEGOTIATION_STARTED',
        payload: {
          item: resolved.item,
          offer: resolved.offer,
          text: resolved.text,
          perceivedValue: perceived[shelf.indexOf(resolved.item)],
        },
      });
    } else if (resolved.kind === 'leave') {
      dispatch({ type: 'CUSTOMER_LEAVES', payload: resolved.text });
    } else {
      dispatch({ type: 'CUSTOMER_LEAVES', payload: 'Hmm... no, never mind.' });
    }
  };

  // ---- Player's counter-offer ----

  const sendOffer = async (price, textInput) => {
    if (!neg || generating) return;
    if (!Number.isFinite(price) || price < 1) return;
    price = Math.round(price);
    const text = textInput?.trim() || `How about ${price}g?`;
    setPlayerText('');
    setPlayerPrice('');

    // Asking no more than they already offered? Instant deal.
    if (price <= neg.customerOffer) {
      dispatch({ type: 'PLAYER_COUNTER', payload: { text, price } });
      dispatch({ type: 'SALE', payload: { price, text: 'Done — a pleasure doing business!' } });
      return;
    }

    const patienceAfter = neg.patience - 1;
    dispatch({ type: 'PLAYER_COUNTER', payload: { text, price } });

    if (patienceAfter <= 0) {
      dispatch({ type: 'NEGOTIATION_FAILED', payload: { reason: 'patience' } });
      return;
    }

    const parsed = await generateJSON(
      buildCounterMessages({ ...neg, patience: patienceAfter }, text, price),
      counterSchema(neg.customer.budget)
    );
    let resolved = resolveCounter(parsed, neg, price);
    if (resolved.kind === 'unclear') {
      const clarified = await generateJSON(
        buildClarifyMessages(neg.customer, resolved.text),
        clarifySchema(neg.customer.budget)
      );
      resolved = resolveCounter(parsed, neg, price, clarified?.offer ?? Math.round(Number(parsed.offer)));
    }

    if (resolved.kind === 'accept') {
      dispatch({ type: 'SALE', payload: { price, text: resolved.text } });
    } else if (resolved.kind === 'reject') {
      dispatch({ type: 'NEGOTIATION_FAILED', payload: { text: resolved.text, reason: 'reject' } });
    } else if (resolved.kind === 'counter') {
      dispatch({ type: 'CUSTOMER_COUNTER', payload: { text: resolved.text, offer: resolved.offer } });
    } else {
      // Model produced nothing usable — the customer holds their offer.
      dispatch({
        type: 'CUSTOMER_COUNTER',
        payload: { text: 'Hmm? Sorry, I lost my train of thought. My offer stands.', offer: neg.customerOffer },
      });
    }
  };

  // ---- Render helpers ----

  const btn = (disabled = false) => `${styles.button} ${disabled ? styles.buttonDisabled : ''}`;

  if (neg) {
    const lastPlayerOffer = [...neg.history].reverse().find((h) => h.speaker === 'player')?.offer;
    const anchor = lastPlayerOffer ?? neg.item.askingPrice;
    const split = Math.round((neg.customerOffer + anchor) / 2);
    const priceNum = Number(playerPrice);

    return (
      <div className={`${className || ''} ${styles.controlsContainer}`}>
        <div className={styles.customerCard}>
          <span className={styles.customerPortrait}>{neg.customer.portrait}</span>
          <div className={styles.customerInfo}>
            <span className={styles.customerName}>{neg.customer.name}</span>
            <span className={styles.customerDesc}>{neg.customer.description}</span>
            <div className={styles.traitChips}>
              {neg.customer.personalityTraits.slice(0, 4).map((t) => (
                <span key={t} className={styles.traitChip}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.patienceRow}>
          <span className={styles.patienceLabel}>{patienceLabel(neg.patience, neg.initialPatience)}</span>
          <div className={styles.patienceMeter}>
            {Array.from({ length: neg.initialPatience }).map((_, i) => (
              <span key={i} className={i < neg.patience ? styles.patienceDotFull : styles.patienceDot} />
            ))}
          </div>
        </div>

        <div className={styles.dealSummary}>
          <span className={styles.dealItem}>{neg.item.emoji} {neg.item.name}</span>
          <span className={styles.dealNumbers}>
            your cost {neg.item.wholesalePrice}g · tag {neg.item.askingPrice}g ·{' '}
            <strong>their offer {neg.customerOffer}g</strong>
          </span>
        </div>

        <input
          type="text"
          value={playerText}
          onChange={(e) => setPlayerText(e.target.value)}
          placeholder="Say something (optional)…"
          className={styles.inputField}
          disabled={generating}
        />
        <div className={styles.offerRow}>
          <input
            type="number"
            min="1"
            value={playerPrice}
            onChange={(e) => setPlayerPrice(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && priceNum > 0 && !generating) sendOffer(priceNum, playerText);
            }}
            placeholder="Your price (g)"
            className={styles.priceField}
            disabled={generating}
          />
          <button
            onClick={() => sendOffer(priceNum, playerText)}
            disabled={!(priceNum > 0) || generating}
            className={btn(!(priceNum > 0) || generating)}
          >
            Counter
          </button>
        </div>

        <div className={styles.quickRow}>
          <button
            onClick={() => sendOffer(split, playerText)}
            disabled={generating || split <= neg.customerOffer}
            className={`${styles.quickButton} ${generating || split <= neg.customerOffer ? styles.buttonDisabled : ''}`}
          >
            Split the difference ({split}g)
          </button>
          <button
            onClick={() => sendOffer(anchor, playerText)}
            disabled={generating}
            className={`${styles.quickButton} ${generating ? styles.buttonDisabled : ''}`}
          >
            Hold at {anchor}g
          </button>
        </div>

        <div className={styles.buttonRow}>
          <button
            onClick={() => dispatch({ type: 'SALE', payload: { price: neg.customerOffer } })}
            disabled={generating}
            className={`${btn(generating)} ${styles.acceptButton}`}
          >
            ✅ Accept {neg.customerOffer}g
          </button>
          <button
            onClick={() => dispatch({ type: 'NEGOTIATION_FAILED', payload: { reason: 'walkaway' } })}
            disabled={generating}
            className={btn(generating)}
          >
            Walk away
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className || ''} ${styles.controlsContainer}`}>
      {state.phase === 'management' && (
        <>
          <p className={styles.tip}>Restock from the market, then start the day.</p>
          <button
            onClick={() => dispatch({ type: 'START_DAY' })}
            disabled={state.gameOver || (state.inventory.length === 0 && state.displayedItems.length === 0)}
            className={btn(state.gameOver || (state.inventory.length === 0 && state.displayedItems.length === 0))}
          >
            {state.inventory.length === 0 && state.displayedItems.length === 0
              ? 'Buy some stock first'
              : `🌅 Start Day ${state.day}`}
          </button>
          <button
            onClick={() => dispatch({ type: 'UPGRADE_SHELF' })}
            disabled={
              state.gameOver ||
              state.gold < shelfUpgradeCost(state.shopShelves) ||
              state.shopShelves >= GAME_CONFIG.maxShelves
            }
            className={btn(
              state.gameOver ||
                state.gold < shelfUpgradeCost(state.shopShelves) ||
                state.shopShelves >= GAME_CONFIG.maxShelves
            )}
          >
            {state.shopShelves >= GAME_CONFIG.maxShelves
              ? 'Shelf fully upgraded'
              : `🗄️ Add shelf slot (${shelfUpgradeCost(state.shopShelves)}g)`}
          </button>
          <button
            onClick={() => dispatch({ type: 'PAY_DEBT', payload: GAME_CONFIG.loanPayment })}
            disabled={state.gameOver || state.gold < GAME_CONFIG.loanPayment || state.totalLoanOwed <= 0}
            className={btn(state.gameOver || state.gold < GAME_CONFIG.loanPayment || state.totalLoanOwed <= 0)}
          >
            💸 Pay {Math.min(GAME_CONFIG.loanPayment, state.totalLoanOwed)}g toward debt
          </button>
        </>
      )}

      {state.phase === 'setting up' && (
        <>
          <p className={styles.tip}>
            Stock the shelf and set each price tag. Fair prices sell fast and build reputation;
            steep tags mean harder haggles.
          </p>
          <button
            onClick={() => dispatch({ type: 'OPEN_SHOP' })}
            disabled={state.gameOver || state.displayedItems.length === 0}
            className={btn(state.gameOver || state.displayedItems.length === 0)}
          >
            {state.displayedItems.length === 0 ? 'Shelve at least one item' : '🔔 Open the Shop'}
          </button>
        </>
      )}

      {state.phase === 'selling' && (
        <>
          <p className={styles.tip}>
            {customersLeft > 0
              ? `${customersLeft} more customer${customersLeft === 1 ? '' : 's'} might come in today.`
              : 'The street is quiet. Time to close up.'}
          </p>
          <button
            onClick={handleNextCustomer}
            disabled={
              state.displayedItems.length === 0 ||
              generating ||
              !initialized ||
              state.gameOver ||
              customersLeft <= 0
            }
            className={btn(
              state.displayedItems.length === 0 ||
                generating ||
                !initialized ||
                state.gameOver ||
                customersLeft <= 0
            )}
          >
            {generating ? 'Someone is browsing…' : '🚪 Next Customer'}
          </button>
          <button
            onClick={() => dispatch({ type: 'CLOSE_SHOP' })}
            disabled={state.gameOver || generating}
            className={btn(state.gameOver || generating)}
          >
            🌙 Close Up for the Day
          </button>
        </>
      )}
    </div>
  );
}
