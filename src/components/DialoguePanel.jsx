import { useEffect, useRef } from 'react';
import { useGameState } from '../contexts/GameStateContext';
// Removed COLORS, UI_PADDING import
import { useWebLLMContext } from '../contexts/WebLLMContext';
import Spinner from './Spinner';
import styles from './DialoguePanel.module.css'; // Import the new CSS module

// Accept className as a prop
export default function DialoguePanel({ className }) {
  const { state } = useGameState();
  const { loading } = useWebLLMContext();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.dialogue]);

  // Combine passed className with any internal classes if needed later
  const combinedClassName = `${className || ''}`; 

  return (
    // Apply the combined className from props
    <div className={combinedClassName} style={{ /* Keep only non-conflicting styles if any */ }}>
      {/* Apply title style */}
      <h3 className={styles.dialogueTitle}>Dialogue</h3>
      {/* Apply messages container style */}
      <div className={styles.messagesContainer}>
        {state.dialogue.map((message, index) => (
          // Apply message style
          <div key={index} className={styles.message}>
            {message}
            {/* Apply spinner container style if needed */}
            {loading && index === state.dialogue.length - 1 && <span className={styles.spinnerContainer}><Spinner /></span>}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
