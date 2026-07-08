import AnimatedBackground from './AnimatedBackground';
import { useWebLLM } from '../contexts/WebLLMContext';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  const { initialized, status, progress, error } = useWebLLM();

  return (
    <div className={styles.viewport}>
      <AnimatedBackground />
      <div className={styles.frame}>
        {children}
        {!initialized && (
          <div className={styles.loadingBanner}>
            <span className={styles.bannerLabel}>
              {error ? '⚠️ AI failed to load' : '🧠 Summoning customers…'}
            </span>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.round((progress || 0) * 100)}%` }}
              />
            </div>
            <span className={styles.statusText}>
              {error
                ? `${error} — you can stock the shop, but no customers will come.`
                : `${status} You can stock the shop meanwhile.`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
