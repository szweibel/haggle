import styles from './AnimatedBackground.module.css';

// Lightweight CSS-only ambient background: drifting coins over a dark
// wood-grain gradient. Deterministic layout so renders are stable.
const COINS = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 137) % 100}%`,
  size: 14 + ((i * 53) % 22),
  duration: 18 + ((i * 71) % 20),
  delay: -((i * 97) % 30),
  opacity: 0.12 + ((i * 29) % 20) / 100,
}));

export default function AnimatedBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      {COINS.map((c, i) => (
        <span
          key={i}
          className={styles.coin}
          style={{
            left: c.left,
            fontSize: `${c.size}px`,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
            opacity: c.opacity,
          }}
        >
          🪙
        </span>
      ))}
    </div>
  );
}
