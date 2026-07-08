import { memo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useGameState } from '../contexts/GameStateContext';
import styles from './Inventory.module.css';

const InventoryItem = memo(function InventoryItem({ item, canStock, onStock }) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'INV_ITEM',
      item: { instanceId: item.instanceId },
      canDrag: canStock,
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    [item.instanceId, canStock]
  );

  return (
    <div
      ref={drag}
      className={`${styles.inventoryItem} ${isDragging ? styles.inventoryItemDragging : ''}`}
      title={`Cost: ${item.wholesalePrice}g · fair value ~${item.baseValue}g`}
    >
      <span className={styles.itemEmoji}>{item.emoji}</span>
      <span className={styles.itemName}>{item.name}</span>
      {canStock && (
        <button className={styles.stockButton} onClick={() => onStock(item)}>
          Shelve ↑
        </button>
      )}
    </div>
  );
});

export default function Inventory({ className }) {
  const { state, dispatch } = useGameState();
  const canStock = state.phase === 'setting up';

  // Accept items dragged back from the shelf.
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'SHELF_ITEM',
      drop: (dragged) => dispatch({ type: 'RETURN_TO_INVENTORY', payload: dragged.instanceId }),
      collect: (monitor) => ({ isOver: !!monitor.isOver() }),
    }),
    [dispatch]
  );

  return (
    <div ref={drop} className={`${className || ''} ${isOver ? styles.dropHighlight : ''}`}>
      <h3 className={styles.inventoryTitle}>📦 Storeroom ({state.inventory.length})</h3>
      <div className={styles.itemsContainer}>
        {state.inventory.length === 0 && (
          <p className={styles.emptyText}>
            {state.phase === 'management'
              ? 'Empty. Buy stock from the market above.'
              : 'Nothing in the back room.'}
          </p>
        )}
        {state.inventory.map((item) => (
          <InventoryItem
            key={item.instanceId}
            item={item}
            canStock={canStock}
            onStock={(i) => dispatch({ type: 'MOVE_TO_SHELF', payload: i.instanceId })}
          />
        ))}
      </div>
    </div>
  );
}
