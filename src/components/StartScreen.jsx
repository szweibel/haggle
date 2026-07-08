import { useEffect, useState } from 'react';
import { MODEL_OPTIONS, MODEL_KEY } from '../contexts/WebLLMContext';
import { useGameState } from '../contexts/GameStateContext';
import AnimatedBackground from './AnimatedBackground';
import styles from './StartScreen.module.css';

// The MLC model kernels bind 10 storage buffers per shader stage; WebKit's
// WebGPU stops at the spec default of 8, so Safari can't run them (yet).
const REQUIRED_STORAGE_BUFFERS = 10;

export default function StartScreen({ onStart }) {
  const { state, dispatch } = useGameState();
  const [modelId, setModelId] = useState(
    () => localStorage.getItem(MODEL_KEY) || MODEL_OPTIONS.find((m) => m.recommended).id
  );
  // 'checking' | 'ok' | 'none' (no WebGPU) | 'limited' (WebGPU too weak)
  const [gpu, setGpu] = useState({ state: 'checking' });

  useEffect(() => {
    (async () => {
      if (!navigator.gpu) return setGpu({ state: 'none' });
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) return setGpu({ state: 'none' });
        const limit = adapter.limits?.maxStorageBuffersPerShaderStage ?? 0;
        setGpu(limit >= REQUIRED_STORAGE_BUFFERS ? { state: 'ok' } : { state: 'limited', limit });
      } catch {
        setGpu({ state: 'none' });
      }
    })();
  }, []);

  const webgpuOk = gpu.state === 'ok' || gpu.state === 'checking';
  const hasProgress =
    state.day > 1 ||
    state.stats.itemsSold > 0 ||
    state.inventory.length > 0 ||
    state.displayedItems.length > 0;

  const begin = (fresh) => {
    if (fresh) dispatch({ type: 'NEW_GAME' });
    localStorage.setItem(MODEL_KEY, modelId);
    onStart();
  };

  return (
    <div className={styles.screen}>
      <AnimatedBackground />
      <div className={styles.card}>
        <h1 className={styles.title}>🪙 Haggle</h1>
        <p className={styles.tagline}>
          You just bought a fantasy item shop — and inherited the <strong>2,500&nbsp;gold debt</strong> that
          came with it. Buy wholesale, set your prices, and haggle with AI-driven customers until the
          deed is truly yours.
        </p>
        <p className={styles.note}>
          Every customer is played by an open-weight language model running <em>entirely in your
          browser</em> — no server, no API key. The model downloads once and is cached.
        </p>

        <h2 className={styles.sectionTitle}>Choose your shopkeeper's brain</h2>
        <div className={styles.modelGrid}>
          {MODEL_OPTIONS.map((m) => (
            <button
              key={m.id}
              className={`${styles.modelCard} ${modelId === m.id ? styles.modelCardSelected : ''}`}
              onClick={() => setModelId(m.id)}
            >
              <span className={styles.modelLabel}>
                {m.label} <span className={styles.modelParams}>{m.params}</span>
              </span>
              <span className={styles.modelSize}>{m.size} download</span>
              <span className={styles.modelBlurb}>{m.blurb}</span>
              {m.recommended && <span className={styles.recommendedBadge}>Recommended</span>}
            </button>
          ))}
        </div>

        {gpu.state === 'none' && (
          <p className={styles.warning}>
            ⚠️ This browser doesn't expose WebGPU, which the in-browser AI needs. Use a recent
            Chrome or Edge on desktop.
          </p>
        )}
        {gpu.state === 'limited' && (
          <p className={styles.warning}>
            ⚠️ This browser's WebGPU allows only {gpu.limit} storage buffers per shader stage, but
            the AI model needs {REQUIRED_STORAGE_BUFFERS} — Safari currently has this cap. Please
            open the game in Chrome or Edge on desktop.
          </p>
        )}

        <div className={styles.actions}>
          {hasProgress ? (
            <>
              <button className={styles.primaryButton} onClick={() => begin(false)} disabled={!webgpuOk}>
                Continue — Day {state.day}, {state.gold}g
              </button>
              <button className={styles.secondaryButton} onClick={() => begin(true)} disabled={!webgpuOk}>
                Start a new game
              </button>
            </>
          ) : (
            <button className={styles.primaryButton} onClick={() => begin(false)} disabled={!webgpuOk}>
              Open the Shop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
