import { useGameState } from '../contexts/GameStateContext';
import { COLORS, UI_PADDING, WHOLESALE_ITEMS, ITEM_TIERS } from '../gameState'; // Import ITEM_TIERS

function MarketItem({ item }) {
  const { state, dispatch } = useGameState();
  const canAfford = state.gold >= item.wholesalePrice;

  const handleBuy = () => {
    dispatch({ type: 'BUY_ITEM', payload: item });
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: UI_PADDING / 2,
      marginBottom: UI_PADDING / 2,
      backgroundColor: '#EAE0C8', // Slightly darker parchment
      color: COLORS.text,
      borderRadius: 4,
      border: `1px solid ${COLORS.panelStroke}`
    }}>
      <span>{item.name} ({item.wholesalePrice}g)</span>
      <button 
        onClick={handleBuy}
        disabled={!canAfford}
        style={{
          padding: `${UI_PADDING / 4}px ${UI_PADDING / 2}px`, // Smaller button padding
          fontSize: '0.9em',
          backgroundColor: canAfford ? COLORS.button : COLORS.textLight,
          color: COLORS.panel,
          border: `1px solid ${canAfford ? COLORS.buttonStroke : COLORS.textLight}`,
          borderRadius: 4,
          cursor: canAfford ? 'pointer' : 'not-allowed',
          opacity: canAfford ? 1 : 0.6,
          fontWeight: 700
        }}
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

export default function MarketPanel() {
  const { state } = useGameState(); // Get game state for reputation

  // Filter items based on player reputation
  const availableItems = WHOLESALE_ITEMS.filter(item => {
    const requiredRep = TIER_THRESHOLDS[item.tier] ?? 0; // Default to 0 if tier not found
    return state.reputation >= requiredRep;
  });

  return (
    <div style={{
      flex: 0.65, // Match Shelf flex value
      backgroundColor: COLORS.panel,
      borderRadius: 8,
      border: `1px solid ${COLORS.panelStroke}`,
      padding: UI_PADDING,
      color: COLORS.text,
      overflowY: 'auto', // Add scroll if list is long
      maxHeight: '100%' // Ensure it fits within layout
    }}>
      <h3 style={{ 
        marginTop: 0, 
        fontFamily: "'Cinzel Decorative', serif", 
        color: COLORS.textGold
      }}>Wholesale Market (Rep: {state.reputation})</h3> {/* Optionally display rep */}
      <div>
        {availableItems.length > 0 ? (
          availableItems.map((item) => (
            <MarketItem key={item.id} item={item} />
          ))
        ) : (
          <p style={{ color: COLORS.textLight, fontStyle: 'italic' }}>No items available at your current reputation level.</p>
        )}
      </div>
    </div>
  );
}
