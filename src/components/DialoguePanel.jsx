import { useEffect, useRef } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { useWebLLM } from '../contexts/WebLLMContext';
import styles from './DialoguePanel.module.css';

export default function DialoguePanel({ className }) {
  const { state } = useGameState();
  const { generating } = useWebLLM();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [state.dialogue, generating]);

  return (
    <div className={`${className || ''}`}>
      <h3 className={styles.dialogueTitle}>💬 The Shop Floor</h3>
      <div className={styles.messagesContainer}>
        {state.dialogue.map((msg, index) => {
          if (msg.speaker === 'system') {
            return (
              <div key={index} className={styles.systemMessage}>
                {msg.text}
              </div>
            );
          }
          const isPlayer = msg.speaker === 'player';
          return (
            <div key={index} className={isPlayer ? styles.playerRow : styles.customerRow}>
              <div className={isPlayer ? styles.playerBubble : styles.customerBubble}>
                {!isPlayer && (
                  <span className={styles.speakerName}>
                    {msg.portrait} {msg.name}
                  </span>
                )}
                <span>{msg.text}</span>
                {msg.offer != null && (
                  <span className={styles.offerChip}>
                    {isPlayer ? 'asks' : 'offers'} {msg.offer}g
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {generating && (
          <div className={styles.customerRow}>
            <div className={`${styles.customerBubble} ${styles.thinking}`}>
              <span className={styles.thinkingDots}>
                <span>●</span>
                <span>●</span>
                <span>●</span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
