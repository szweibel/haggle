import { createContext, useContext, useEffect, useReducer } from 'react';
import {
  createInitialState,
  defaultAskingPrice,
  shelfUpgradeCost,
  GAME_CONFIG,
} from '../gameState';
import { startingPatience, saleReputation } from '../game/negotiation';

const GameStateContext = createContext();

const SAVE_KEY = 'haggle_save_v2';

function loadSavedState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved?.version !== 2) return null;
    // Merge over a fresh state so newly added fields get defaults, and drop
    // transient mid-negotiation state.
    return {
      ...createInitialState(),
      ...saved,
      currentCustomer: null,
      currentNegotiation: null,
    };
  } catch (e) {
    console.warn('Could not load save:', e);
    return null;
  }
}

function initState() {
  return loadSavedState() ?? createInitialState();
}

function sysMsg(text) {
  return { speaker: 'system', text };
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState();

    case 'ADD_DIALOGUE':
      return { ...state, dialogue: [...state.dialogue, action.payload] };

    case 'BUY_ITEM': {
      const item = action.payload;
      if (state.gold < item.wholesalePrice) {
        return {
          ...state,
          dialogue: [...state.dialogue, sysMsg(`Not enough gold for ${item.name} (${item.wholesalePrice}g).`)],
        };
      }
      const instance = { ...item, instanceId: `${item.id}-${Date.now()}-${Math.floor(Math.random() * 1e6)}` };
      return {
        ...state,
        gold: state.gold - item.wholesalePrice,
        inventory: [...state.inventory, instance],
        stats: { ...state.stats, totalSpent: state.stats.totalSpent + item.wholesalePrice },
        dialogue: [...state.dialogue, sysMsg(`Bought ${item.name} for ${item.wholesalePrice}g.`)],
      };
    }

    case 'MOVE_TO_SHELF': {
      const idx = state.inventory.findIndex((i) => i.instanceId === action.payload);
      if (idx === -1) return state;
      if (state.displayedItems.length >= state.shopShelves) {
        return { ...state, dialogue: [...state.dialogue, sysMsg('The shelf is full!')] };
      }
      const item = state.inventory[idx];
      const shelved = { ...item, askingPrice: item.askingPrice ?? defaultAskingPrice(item) };
      const inventory = [...state.inventory];
      inventory.splice(idx, 1);
      return { ...state, inventory, displayedItems: [...state.displayedItems, shelved] };
    }

    case 'RETURN_TO_INVENTORY': {
      const idx = state.displayedItems.findIndex((i) => i.instanceId === action.payload);
      if (idx === -1) return state;
      // Can't pull the item someone is haggling over.
      if (state.currentNegotiation?.item.instanceId === action.payload) return state;
      const item = state.displayedItems[idx];
      const displayedItems = [...state.displayedItems];
      displayedItems.splice(idx, 1);
      return { ...state, displayedItems, inventory: [...state.inventory, item] };
    }

    case 'SET_ASKING_PRICE': {
      const { instanceId, price } = action.payload;
      if (!Number.isFinite(price) || price < 1) return state;
      return {
        ...state,
        displayedItems: state.displayedItems.map((i) =>
          i.instanceId === instanceId ? { ...i, askingPrice: Math.round(price) } : i
        ),
      };
    }

    case 'UPGRADE_SHELF': {
      const cost = shelfUpgradeCost(state.shopShelves);
      if (state.gold < cost || state.shopShelves >= GAME_CONFIG.maxShelves) return state;
      return {
        ...state,
        gold: state.gold - cost,
        shopShelves: state.shopShelves + 1,
        dialogue: [...state.dialogue, sysMsg(`Shelf expanded to ${state.shopShelves + 1} slots. (-${cost}g)`)],
      };
    }

    case 'PAY_DEBT': {
      const amount = Math.min(action.payload, state.gold, state.totalLoanOwed);
      if (amount <= 0) return state;
      const owed = state.totalLoanOwed - amount;
      return {
        ...state,
        gold: state.gold - amount,
        totalLoanOwed: owed,
        victory: owed <= 0,
        dialogue: [
          ...state.dialogue,
          sysMsg(owed <= 0
            ? `You hand over the final ${amount}g. The deed to the shop is yours!`
            : `Paid ${amount}g toward the debt. ${owed}g to go.`),
        ],
      };
    }

    case 'START_DAY':
      return {
        ...state,
        phase: 'setting up',
        dialogue: [...state.dialogue, sysMsg(`Day ${state.day}: arrange your shelf and set your prices.`)],
      };

    case 'OPEN_SHOP':
      return {
        ...state,
        phase: 'selling',
        customersServedToday: 0,
        dayStats: { revenue: 0, itemsSold: 0, customersServed: 0, failed: 0 },
        dialogue: [...state.dialogue, sysMsg('The shop is open for business!')],
      };

    case 'CLOSE_SHOP': {
      let gold = state.gold;
      let totalLoanOwed = state.totalLoanOwed;
      let loanDueDay = state.loanDueDay;
      let gameOver = state.gameOver;
      let loanPaid = 0;
      let loanFailed = false;

      if (state.day >= state.loanDueDay && totalLoanOwed > 0) {
        const due = Math.min(state.loanPayment, totalLoanOwed);
        if (gold >= due) {
          gold -= due;
          totalLoanOwed -= due;
          loanDueDay = state.loanDueDay + GAME_CONFIG.loanIntervalDays;
          loanPaid = due;
        } else {
          loanFailed = true;
          gameOver = true;
        }
      }

      const victory = state.victory || totalLoanOwed <= 0;
      return {
        ...state,
        gold,
        totalLoanOwed,
        loanDueDay,
        gameOver,
        victory,
        phase: 'management',
        day: state.day + 1,
        currentCustomer: null,
        currentNegotiation: null,
        daySummary: {
          day: state.day,
          ...state.dayStats,
          loanPaid,
          loanFailed,
          loanShortfall: loanFailed ? Math.min(state.loanPayment, totalLoanOwed) - gold : 0,
          debtRemaining: totalLoanOwed,
        },
        dialogue: [
          ...state.dialogue,
          sysMsg(`You lock up after day ${state.day}.`),
          ...(loanPaid ? [sysMsg(`Weekly loan payment made: ${loanPaid}g.`)] : []),
          ...(loanFailed ? [sysMsg('You cannot make the loan payment. The creditors arrive at dawn...')] : []),
        ],
      };
    }

    case 'DISMISS_SUMMARY':
      return { ...state, daySummary: null };

    case 'CUSTOMER_ENTERS': {
      const customer = action.payload;
      return {
        ...state,
        currentCustomer: customer,
        lastCustomerName: customer.name,
        customersServedToday: state.customersServedToday + 1,
        dayStats: { ...state.dayStats, customersServed: state.dayStats.customersServed + 1 },
        dialogue: [...state.dialogue, sysMsg(`${customer.portrait} ${customer.name} enters the shop.`)],
      };
    }

    case 'CUSTOMER_LEAVES':
      return {
        ...state,
        currentCustomer: null,
        currentNegotiation: null,
        dialogue: action.payload
          ? [
              ...state.dialogue,
              { speaker: 'customer', name: state.currentCustomer?.name, portrait: state.currentCustomer?.portrait, text: action.payload },
              sysMsg(`${state.currentCustomer?.name ?? 'The customer'} wanders back out.`),
            ]
          : [...state.dialogue, sysMsg(`${state.currentCustomer?.name ?? 'The customer'} wanders back out.`)],
      };

    case 'NEGOTIATION_STARTED': {
      const { item, offer, text } = action.payload;
      const customer = state.currentCustomer;
      if (!customer || state.currentNegotiation) return state;
      const patience = startingPatience(customer.personalityTraits);
      return {
        ...state,
        currentNegotiation: {
          item,
          customer,
          customerOffer: offer,
          initialPatience: patience,
          patience,
          history: [{ speaker: 'customer', text, offer }],
        },
        dialogue: [
          ...state.dialogue,
          { speaker: 'customer', name: customer.name, portrait: customer.portrait, text, offer },
        ],
      };
    }

    case 'PLAYER_COUNTER': {
      if (!state.currentNegotiation) return state;
      const { text, price } = action.payload;
      return {
        ...state,
        currentNegotiation: {
          ...state.currentNegotiation,
          patience: Math.max(0, state.currentNegotiation.patience - 1),
          history: [...state.currentNegotiation.history, { speaker: 'player', text, offer: price }],
        },
        dialogue: [...state.dialogue, { speaker: 'player', text, offer: price }],
      };
    }

    case 'CUSTOMER_COUNTER': {
      if (!state.currentNegotiation) return state;
      const { text, offer } = action.payload;
      const { customer } = state.currentNegotiation;
      return {
        ...state,
        currentNegotiation: {
          ...state.currentNegotiation,
          customerOffer: offer,
          history: [...state.currentNegotiation.history, { speaker: 'customer', text, offer }],
        },
        dialogue: [...state.dialogue, { speaker: 'customer', name: customer.name, portrait: customer.portrait, text, offer }],
      };
    }

    case 'SALE': {
      if (!state.currentNegotiation) return state;
      const { price, text } = action.payload;
      const { item, customer } = state.currentNegotiation;
      const repGain = saleReputation(price, item.baseValue);
      const profit = price - item.wholesalePrice;
      const bestFlip =
        !state.stats.bestFlip || profit > state.stats.bestFlip.profit
          ? { name: item.name, emoji: item.emoji, profit }
          : state.stats.bestFlip;
      return {
        ...state,
        gold: state.gold + price,
        displayedItems: state.displayedItems.filter((i) => i.instanceId !== item.instanceId),
        currentNegotiation: null,
        currentCustomer: null,
        reputation: state.reputation + repGain,
        dayStats: {
          ...state.dayStats,
          revenue: state.dayStats.revenue + price,
          itemsSold: state.dayStats.itemsSold + 1,
        },
        stats: {
          ...state.stats,
          itemsSold: state.stats.itemsSold + 1,
          totalRevenue: state.stats.totalRevenue + price,
          bestFlip,
        },
        dialogue: [
          ...state.dialogue,
          ...(text ? [{ speaker: 'customer', name: customer.name, portrait: customer.portrait, text }] : []),
          sysMsg(`Sold ${item.emoji} ${item.name} for ${price}g${repGain ? ` (+${repGain} Rep)` : ''}. Profit: ${profit >= 0 ? '+' : ''}${profit}g.`),
        ],
      };
    }

    case 'NEGOTIATION_FAILED': {
      if (!state.currentNegotiation) return state;
      const { text, reason } = action.payload;
      const { customer } = state.currentNegotiation;
      const closers = {
        patience: `${customer.name} runs out of patience and storms off. (-1 Rep)`,
        reject: `${customer.name} walks away from the deal. (-1 Rep)`,
        walkaway: `You wave ${customer.name} off. They leave annoyed. (-1 Rep)`,
      };
      return {
        ...state,
        currentNegotiation: null,
        currentCustomer: null,
        reputation: state.reputation - 1,
        dayStats: { ...state.dayStats, failed: state.dayStats.failed + 1 },
        stats: { ...state.stats, failedNegotiations: state.stats.failedNegotiations + 1 },
        dialogue: [
          ...state.dialogue,
          ...(text ? [{ speaker: 'customer', name: customer.name, portrait: customer.portrait, text }] : []),
          sysMsg(closers[reason] ?? closers.reject),
        ],
      };
    }

    case 'DEBUG_PATCH': {
      // Dev-only escape hatch for playtesting (window.__haggle in dev builds).
      if (!import.meta.env.DEV) return state;
      return { ...state, ...action.payload };
    }

    default:
      return state;
  }
}

export function GameStateProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, initState);

  // Auto-save. Mid-negotiation state is dropped on load, not on save, so the
  // rest of the day survives a refresh.
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save game:', e);
    }
    if (import.meta.env.DEV) {
      window.__haggle = { state, dispatch };
    }
  }, [state]);

  return (
    <GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  return useContext(GameStateContext);
}
