import { useGameState } from '../contexts/GameStateContext';
import { COLORS, UI_PADDING, WHOLESALE_ITEMS } from '../gameState';

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

export default function MarketPanel() {
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
      }}>Wholesale Market</h3>
      <div>
        {WHOLESALE_ITEMS.map((item) => (
          <MarketItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
