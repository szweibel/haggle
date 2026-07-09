import { useGameState } from '../contexts/GameStateContext';
import { WHOLESALE_ITEMS, ITEM_TIERS, MARKET_TIER_THRESHOLDS } from '../gameState';
import styles from './MarketPanel.module.css';

function MarketItem({ item }) {
  const { state, dispatch } = useGameState();
  const canAfford = state.gold >= item.wholesalePrice;

  return (
    <div className={styles.marketItem}>
      <span className={styles.itemEmoji}>{item.emoji}</span>
      <div className={styles.itemInfo}>
        <span className={styles.itemName}>{item.name}</span>
        <span className={styles.itemMeta}>{item.category}</span>
      </div>
      <button
        onClick={() => dispatch({ type: 'BUY_ITEM', payload: item })}
        disabled={!canAfford}
        className={`${styles.buyButton} ${!canAfford ? styles.buyButtonDisabled : ''}`}
      >
        {item.wholesalePrice}g
      </button>
    </div>
  );
}

export default function MarketPanel({ className }) {
  const { state } = useGameState();

  return (
    <div className={`${className || ''}`}>
      <h3 className={styles.marketTitle}>🏪 Wholesale Market</h3>
      <div className={styles.itemsScroll}>
        {ITEM_TIERS.map((tier) => {
          const required = MARKET_TIER_THRESHOLDS[tier] ?? 0;
          const unlocked = state.reputation >= required;
          const items = WHOLESALE_ITEMS.filter((i) => i.tier === tier);
          return (
            <div key={tier} className={styles.tierSection}>
              <h4 className={styles.tierHeading}>
                {tier}
                {!unlocked && <span className={styles.lockNote}>🔒 unlocks at {required} Rep</span>}
              </h4>
              {unlocked ? (
                <div className={styles.itemsContainer}>
                  {items.map((item) => (
                    <MarketItem key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <p className={styles.lockedText}>
                  Build your reputation with fair deals to trade in {tier.toLowerCase()} goods.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
