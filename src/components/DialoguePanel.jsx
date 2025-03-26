import { useEffect, useRef } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { COLORS, UI_PADDING } from '../gameState';
import { useWebLLMContext } from '../contexts/WebLLMContext';
import Spinner from './Spinner';

export default function DialoguePanel() {
  const { state } = useGameState();
  const { loading } = useWebLLMContext();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.dialogue]);

  return (
    <div style={{
      flex: 0.35,
      backgroundColor: COLORS.panel,
      borderRadius: 8,
      border: `1px solid ${COLORS.panelStroke}`,
      padding: UI_PADDING,
      overflowY: 'auto',
      maxHeight: '100%',
      color: COLORS.text
    }}>
      <h3 style={{ 
        marginTop: 0, 
        fontFamily: "'Cinzel Decorative', serif",
        color: COLORS.textGold
      }}>Dialogue</h3>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: UI_PADDING/2
      }}>
        {state.dialogue.map((message, index) => (
          <div key={index} style={{
            padding: UI_PADDING/2,
            backgroundColor: '#EAE0C8',
            color: COLORS.text,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center'
          }}>
            {message}
            {loading && index === state.dialogue.length - 1 && <Spinner />}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
