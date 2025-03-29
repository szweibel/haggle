import { useGameState } from '../contexts/GameStateContext';
// Removed COLORS, UI_PADDING import
import { WHOLESALE_ITEMS, ITEM_TIERS } from '../gameState'; // Import ITEM_TIERS
// Removed import of ShopLayout styles
import styles from './MarketPanel.module.css'; // Import component-specific styles

function MarketItem({ item }) {
  const { state, dispatch } = useGameState();
  const canAfford = state.gold >= item.wholesalePrice;

  const handleBuy = () => {
    dispatch({ type: 'BUY_ITEM', payload: item });
  };

  // Combine button classes based on affordability
  const buttonClassName = `
    ${styles.buyButton} 
    ${!canAfford ? styles.buyButtonDisabled : ''}
  `;

  return (
    // Apply market item style
    <div className={styles.marketItem}>
      <span>{item.name} ({item.wholesalePrice}g)</span>
      {/* Apply combined button class name, remove inline styles */}
      <button 
        onClick={handleBuy}
        disabled={!canAfford}
        className={buttonClassName.trim()}
      >
        Buy
      </button>
    </div>
  );
}

// Define reputation thresholds for tiers
const TIER_THRESHOLDS = {
  'Common': 0,
  'Uncommon': 10,
  'Rare': 25
};

// Accept className as a prop
export default function MarketPanel({ className }) {
  const { state } = useGameState(); // Get game state for reputation

  // Filter items based on player reputation
  const availableItems = WHOLESALE_ITEMS.filter(item => {
    const requiredRep = TIER_THRESHOLDS[item.tier] ?? 0; // Default to 0 if tier not found
    return state.reputation >= requiredRep;
  });

  // Combine passed className, add scrollable class
  const combinedClassName = `${className || ''} ${styles.panelScrollable}`;

  return (
    // Apply combined className from props
    <div className={combinedClassName} style={{ maxHeight: '100%' /* Keep maxHeight for now */ }}>
      {/* Apply title style */}
      <h3 className={styles.marketTitle}>Wholesale Market (Rep: {state.reputation})</h3> {/* Optionally display rep */}
      {/* Apply items container style */}
      <div className={styles.itemsContainer}>
        {availableItems.length > 0 ? (
          availableItems.map((item) => (
            <MarketItem key={item.id} item={item} />
          ))
        ) : (
          // Apply no items text style
          <p className={styles.noItemsText}>No items available at your current reputation level.</p>
        )}
      </div>
    </div>
  );
}
