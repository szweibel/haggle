import { useGameState } from '../contexts/GameStateContext';
import { useDrop } from 'react-dnd';
// Removed COLORS, UI_PADDING import
import shopLayoutStyles from './ShopLayout.module.css'; // Import shared layout styles for highlight
import styles from './Shelf.module.css'; // Import component-specific styles

// Accept className as a prop
export default function Shelf({ className }) {
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

  // Combine passed className with highlight class if isOver
  const combinedClassName = `
    ${className || ''} 
    ${isOver ? shopLayoutStyles.panelDroppableHighlight : ''}
  `;

  return (
    // Apply combined class from props + highlight
    <div ref={drop} className={combinedClassName.trim()} style={{ height: '100%' /* Keep height for now */ }}>
      {/* Apply title style */}
      <h3 className={styles.shelfTitle}>Shelf ({state.displayedItems.length}/{state.shopShelves})</h3>
      {/* Apply items container style */}
      <div className={styles.itemsContainer}>
        {state.displayedItems.map((item, index) => (
          // Apply shelf item style
          <div key={index} className={styles.shelfItem}>
            {item.name} {/* TODO: Add item price? */}
          </div>
        ))}
      </div>
    </div>
  );
}
