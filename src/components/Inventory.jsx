import { useDrag } from 'react-dnd';
import { useGameState } from '../contexts/GameStateContext';
import { COLORS, UI_PADDING } from '../gameState';
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

  return (
    <div ref={drag} style={{
      padding: UI_PADDING / 2,
      marginBottom: UI_PADDING/2,
      backgroundColor: '#EAE0C8',
      color: COLORS.text,
      borderRadius: 4,
      cursor: 'grab',
      opacity: isDragging ? 0.5 : 1,
      border: `1px solid ${COLORS.panelStroke}`
    }}>
      {item.name}
    </div>
  );
});

export default function Inventory() {
  const { state } = useGameState();
  console.log('Current inventory count (Inventory component):', state.inventory.length);

  return (
    <div style={{
      flex: 0.65,
      backgroundColor: COLORS.panel,
      borderRadius: 8,
      border: `1px solid ${COLORS.panelStroke}`,
      padding: UI_PADDING,
      color: COLORS.text
    }}>
      <h3 style={{ 
        marginTop: 0, 
        fontFamily: "'Cinzel Decorative', serif",
        color: COLORS.textGold
      }}>Inventory ({state.inventory.length})</h3>
      <div>
        {/* Use stable instanceId as key */}
        {state.inventory.map((item) => (
          <InventoryItem key={item.instanceId} item={item} />
        ))}
      </div>
    </div>
  );
}
