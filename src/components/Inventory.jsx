import { useDrag } from 'react-dnd';
import { useGameState } from '../contexts/GameStateContext';
// Removed COLORS, UI_PADDING import
// Removed import of ShopLayout styles
import styles from './Inventory.module.css'; // Import component-specific styles
import { memo } from 'react';

const InventoryItem = memo(function InventoryItem({ item }) {
  const { state } = useGameState();
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ITEM',
    item: () => {
      // Use the exact item reference from inventory
      const currentItem = state.inventory.find(i => i.instanceId === item.instanceId);
      if (!currentItem) {
        console.error('Item not found in inventory during drag:', item);
        return null;
      }
      console.log('Dragging item:', currentItem);
      return currentItem;
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  // Combine base item class with dragging class if needed
  const itemClassName = `
    ${styles.inventoryItem} 
    ${isDragging ? styles.inventoryItemDragging : ''}
  `;

  return (
    // Apply combined class name, remove inline styles
    <div ref={drag} className={itemClassName.trim()}>
      {item.name}
    </div>
  );
});

// Accept className as a prop
export default function Inventory({ className }) {
  const { state } = useGameState();
  console.log('Current inventory count (Inventory component):', state.inventory.length);

  // Combine passed className
  const combinedClassName = `${className || ''}`;

  return (
    // Apply combined className from props
    <div className={combinedClassName} style={{ /* Keep only non-conflicting styles if any */ }}>
      {/* Apply title style */}
      <h3 className={styles.inventoryTitle}>Inventory ({state.inventory.length})</h3>
      {/* Apply items container style */}
      <div className={styles.itemsContainer}>
        {/* Use stable instanceId as key */}
        {state.inventory.map((item) => (
          <InventoryItem key={item.instanceId} item={item} />
        ))}
      </div>
    </div>
  );
}
