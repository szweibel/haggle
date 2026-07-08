import { useDrag, useDrop } from 'react-dnd';
import { useGameState } from '../contexts/GameStateContext';
import styles from './Shelf.module.css';

function ShelfItem({ item, editable, negotiated }) {
  const { dispatch } = useGameState();
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'SHELF_ITEM',
      item: { instanceId: item.instanceId },
      canDrag: editable,
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    [item.instanceId, editable]
  );

  return (
    <div
      ref={drag}
      className={`${styles.shelfItem} ${negotiated ? styles.shelfItemActive : ''} ${isDragging ? styles.shelfItemDragging : ''}`}
      title={`Cost: ${item.wholesalePrice}g · fair value ~${item.baseValue}g`}
    >
      <span className={styles.itemEmoji}>{item.emoji}</span>
      <span className={styles.itemName}>{item.name}</span>
      {editable ? (
        <label className={styles.priceRow}>
          <input
            type="number"
            min="1"
            value={item.askingPrice}
            onChange={(e) =>
              dispatch({
                type: 'SET_ASKING_PRICE',
                payload: { instanceId: item.instanceId, price: Number(e.target.value) },
              })
            }
            className={styles.priceInput}
          />
          <span className={styles.priceUnit}>g</span>
        </label>
      ) : (
        <span className={styles.priceTag}>{item.askingPrice}g</span>
      )}
      {editable && (
        <button
          className={styles.returnButton}
          onClick={() => dispatch({ type: 'RETURN_TO_INVENTORY', payload: item.instanceId })}
          title="Return to storeroom"
        >
          ↓
        </button>
      )}
    </div>
  );
}

export default function Shelf({ className }) {
  const { state, dispatch } = useGameState();
  const editable = state.phase === 'setting up';

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'INV_ITEM',
      drop: (dragged) => {
        if (state.phase === 'setting up') {
          dispatch({ type: 'MOVE_TO_SHELF', payload: dragged.instanceId });
        }
      },
      collect: (monitor) => ({ isOver: !!monitor.isOver() }),
    }),
    [state.phase, dispatch]
  );

  const emptySlots = Math.max(0, state.shopShelves - state.displayedItems.length);
  const negotiatedId = state.currentNegotiation?.item.instanceId;

  return (
    <div ref={drop} className={`${className || ''} ${isOver ? styles.dropHighlight : ''}`}>
      <h3 className={styles.shelfTitle}>
        🗄️ Shop Shelf ({state.displayedItems.length}/{state.shopShelves})
        {editable && <span className={styles.hint}> — set your price tags</span>}
      </h3>
      <div className={styles.itemsContainer}>
        {state.displayedItems.map((item) => (
          <ShelfItem
            key={item.instanceId}
            item={item}
            editable={editable}
            negotiated={item.instanceId === negotiatedId}
          />
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`empty-${i}`} className={styles.emptySlot}>
            {editable ? 'drop here' : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
