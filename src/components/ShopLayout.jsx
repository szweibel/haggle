import { useGameState } from '../contexts/GameStateContext';
import { customersPerDay, reputationTitle } from '../gameState';
import Shelf from './Shelf';
import Inventory from './Inventory';
import DialoguePanel from './DialoguePanel';
import Controls from './Controls';
import MarketPanel from './MarketPanel';
import { DaySummaryOverlay, GameOverOverlay, VictoryOverlay } from './Overlays';
import styles from './ShopLayout.module.css';

const PHASE_LABELS = {
  management: '🌙 Night — restock & plan',
  'setting up': '🌅 Morning — stock & price',
  selling: '☀️ Day — shop is open',
};

export default function ShopLayout() {
  const { state, dispatch } = useGameState();

  const customersLeft = Math.max(0, customersPerDay(state.reputation) - state.customersServedToday);

  const handleNewGame = () => {
    if (window.confirm('Abandon this shop and start over?')) {
      dispatch({ type: 'NEW_GAME' });
    }
  };

  return (
    <div className={styles.shopLayout}>
      <div className={styles.topBar}>
        <span className={styles.dayInfo}>
          Day {state.day} <span className={styles.phaseLabel}>{PHASE_LABELS[state.phase] ?? ''}</span>
        </span>
        {state.phase === 'selling' && (
          <span className={styles.customersInfo}>
            🚪 {customersLeft} customer{customersLeft === 1 ? '' : 's'} left today
          </span>
        )}
        <span className={styles.spacer} />
        <span className={styles.repInfo} title={reputationTitle(state.reputation)}>
          ⭐ {state.reputation} <span className={styles.repTitle}>{reputationTitle(state.reputation)}</span>
        </span>
        <span className={state.day >= state.loanDueDay ? styles.loanInfoDanger : styles.loanInfo}>
          💸 {state.totalLoanOwed}g owed · {state.loanPayment}g due day {state.loanDueDay}
        </span>
        <span className={styles.goldInfo}>🪙 {state.gold}g</span>
        <button className={styles.newGameButton} onClick={handleNewGame} title="Start a new game">
          ↺
        </button>
      </div>

      <div className={styles.mainArea}>
        <div className={styles.leftColumn}>
          <div className={styles.leftTop}>
            {state.phase === 'management' ? (
              <MarketPanel className={styles.panel} />
            ) : (
              <Shelf className={styles.panel} />
            )}
          </div>
          <div className={styles.leftBottom}>
            <Inventory className={styles.panel} />
          </div>
        </div>
        <div className={styles.rightColumn}>
          <div className={styles.rightTop}>
            <DialoguePanel className={styles.panel} />
          </div>
          <div className={styles.rightBottom}>
            <Controls className={styles.panel} />
          </div>
        </div>
      </div>

      {state.daySummary && !state.gameOver && !state.victory && <DaySummaryOverlay />}
      {state.victory && <VictoryOverlay />}
      {state.gameOver && !state.victory && <GameOverOverlay />}
    </div>
  );
}
