import { COLORS, UI_PADDING } from '../gameState';
import AnimatedBackground from './AnimatedBackground';
import { useWebLLMContext } from '../contexts/WebLLMContext'; // Import context
import { useGameState } from '../contexts/GameStateContext'; // Import game state context

export default function Layout({ children }) {
  const { initialized, loading } = useWebLLMContext(); // Get loading status
  const { state } = useGameState(); // Get game state for webllmStatus

  return (
    <div style={{
      position: 'relative', // Needed for overlay positioning
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      minHeight: '100vh',
      width: '100%',
      padding: '2rem',
      boxSizing: 'border-box'
    }}>
      <AnimatedBackground />
      <div style={{
        width: '95%',
        maxWidth: '1400px',
        height: '85vh',
        backgroundColor: COLORS.background,
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        margin: '0 auto',
        position: 'relative' // Needed for overlay positioning
      }}>
        {children}

        {/* Loading Overlay - Show only if not initialized */}
        {!initialized && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(46, 41, 37, 0.8)', // Dark overlay matching background
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 500, // Below modal, above content
            borderRadius: '12px', // Match parent border radius
            color: COLORS.panel,
            fontSize: '1.5em',
            flexDirection: 'column',
            gap: UI_PADDING
          }}>
            {/* Display dynamic status from game state */}
            <span>{state.webllmStatus || 'Initializing AI Model...'}</span> 
            {/* Optional: Add a spinner component here */}
            {/* <Spinner /> */}
          </div>
        )}
      </div>
    </div>
  );
}
