import { useGameState } from '../contexts/GameStateContext';
import { GAME_CONFIG } from '../gameState';
import styles from './Overlays.module.css';

function StatsBlock({ stats }) {
  return (
    <div className={styles.statsGrid}>
      <div><strong>{stats.itemsSold}</strong><span>items sold</span></div>
      <div><strong>{stats.totalRevenue}g</strong><span>total revenue</span></div>
      <div><strong>{stats.failedNegotiations}</strong><span>failed haggles</span></div>
      {stats.bestFlip && (
        <div>
          <strong>{stats.bestFlip.emoji} +{stats.bestFlip.profit}g</strong>
          <span>best flip ({stats.bestFlip.name})</span>
        </div>
      )}
    </div>
  );
}

export function DaySummaryOverlay() {
  const { state, dispatch } = useGameState();
  const s = state.daySummary;
  if (!s) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>🌙 Day {s.day} — Closing Time</h2>
        <div className={styles.statsGrid}>
          <div><strong>{s.customersServed}</strong><span>customers</span></div>
          <div><strong>{s.itemsSold}</strong><span>items sold</span></div>
          <div><strong>{s.revenue}g</strong><span>revenue</span></div>
          <div><strong>{s.failed}</strong><span>walked away</span></div>
        </div>
        {s.loanPaid > 0 && (
          <p className={styles.loanNote}>Weekly loan payment made: <strong>{s.loanPaid}g</strong>.</p>
        )}
        <p className={styles.debtNote}>
          Debt remaining: <strong>{s.debtRemaining}g</strong>
        </p>
        <button className={styles.primaryButton} onClick={() => dispatch({ type: 'DISMISS_SUMMARY' })}>
          On to day {state.day}
        </button>
      </div>
    </div>
  );
}

export function VictoryOverlay() {
  const { state, dispatch } = useGameState();
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>🏆 The Shop Is Yours!</h2>
        <p className={styles.body}>
          On day {state.day}, you paid off the last of the {GAME_CONFIG.totalDebt}g debt. The deed is
          yours, free and clear — every merchant in the city knows your name.
        </p>
        <StatsBlock stats={state.stats} />
        <button className={styles.primaryButton} onClick={() => dispatch({ type: 'NEW_GAME' })}>
          Open a new shop
        </button>
      </div>
    </div>
  );
}

export function GameOverOverlay() {
  const { state, dispatch } = useGameState();
  return (
    <div className={styles.overlay}>
      <div className={styles.modalDanger}>
        <h2 className={styles.title}>💀 Repossessed</h2>
        <p className={styles.body}>
          You couldn't make the loan payment. The creditors arrive at dawn and take the shop, the
          stock, and the sign over the door. You survived {state.day - 1} day{state.day - 1 === 1 ? '' : 's'}.
        </p>
        <StatsBlock stats={state.stats} />
        <button className={styles.primaryButton} onClick={() => dispatch({ type: 'NEW_GAME' })}>
          Try again
        </button>
      </div>
    </div>
  );
}
