import { useGameState } from '../contexts/GameStateContext';
import { useDrop } from 'react-dnd';
import { COLORS, UI_PADDING } from '../gameState';

export default function Shelf() {
  const { state, dispatch } = useGameState();

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'ITEM',
    drop: (item) => {
      // Only allow dropping items during the 'setting up' phase
      if (state.phase !== 'setting up') {
        // Optional: Add dialogue message? "Can only place items during morning setup."
        return; 
      }
      
      // Get fresh inventory reference to avoid stale state
      const currentInventory = [...state.inventory];
      const itemInInventory = currentInventory.some(invItem => invItem.instanceId === item.instanceId);
      
      if (!itemInInventory) {
        console.warn('Item not found in inventory during drop:', item);
        return;
      }

      // Check if the item is already displayed to prevent duplicates
      const alreadyDisplayed = state.displayedItems.some(di => di.instanceId === item.instanceId);
      
      // Check shelf capacity
      if (!alreadyDisplayed && state.displayedItems.length < state.shopShelves) {
        dispatch({ type: 'MOVE_ITEM_TO_SHELF', payload: item });
      } else if (alreadyDisplayed) {
        // Optional: Feedback if item already there
        console.log("Item already on shelf.");
      } else {
        // Optional: Feedback if shelf is full
        console.log("Shelf is full.");
        // dispatch({ type: 'ADD_DIALOGUE', payload: "The shelf is full!" });
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }));

  return (
    <div ref={drop} style={{
      flex: 0.65,
      backgroundColor: COLORS.panel,
      borderRadius: 8,
      border: `1px solid ${COLORS.panelStroke}`,
      padding: UI_PADDING,
      backgroundColor: isOver ? COLORS.dropHighlight : COLORS.panel,
      color: COLORS.text // Set default text color for the panel
    }}>
      <h3 style={{ 
        marginTop: 0, 
        fontFamily: "'Cinzel Decorative', serif", // Match global heading font
        color: COLORS.textGold // Match global heading color
      }}>Shelf ({state.displayedItems.length}/{state.shopShelves})</h3>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: UI_PADDING
      }}>
        {state.displayedItems.map((item, index) => (
          <div key={index} style={{
            padding: UI_PADDING / 2, // Smaller padding for items
            backgroundColor: '#EAE0C8', // Slightly darker parchment for items
            color: COLORS.text, // Ensure text is readable
            borderRadius: 4,
            border: `1px solid ${COLORS.panelStroke}` // Add subtle border to items
          }}>
            {item.name} {/* TODO: Add item price? */}
          </div>
        ))}
      </div>
    </div>
  );
}
