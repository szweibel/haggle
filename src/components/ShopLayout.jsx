import { useGameState } from '../contexts/GameStateContext';
import { useDrop } from 'react-dnd';
import Shelf from './Shelf';
import Inventory from './Inventory';
import DialoguePanel from './DialoguePanel';
import Controls from './Controls';
import MarketPanel from './MarketPanel'; // Import the new MarketPanel
import { COLORS, UI_PADDING } from '../gameState';

export default function ShopLayout() {
  const { state } = useGameState();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%', // Changed from 100vh to fill parent Layout
      backgroundColor: COLORS.background,
      padding: UI_PADDING,
      boxSizing: 'border-box' // Ensure padding is included in height
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: UI_PADDING,
        marginBottom: UI_PADDING,
        backgroundColor: COLORS.panel,
        borderRadius: 8,
        border: `1px solid ${COLORS.panelStroke}`,
        color: COLORS.text // Set default text color for the panel
      }}>
        <span style={{ fontWeight: 'bold' }}>Day {state.day}</span>
        <span style={{ color: COLORS.textGold, fontWeight: 'bold' }}>{state.gold}g</span>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flex: 1,
        gap: UI_PADDING,
        marginBottom: UI_PADDING,
        overflow: 'hidden' // Prevent content overflow issues
      }}>
        {/* Conditionally render Shelf/Market based on phase */}
        {/* Show Shelf during 'setting up' and 'selling', Market during 'management' */}
        {state.phase === 'management' ? <MarketPanel /> : <Shelf />} 
        <DialoguePanel />
      </div>

      {/* Bottom Bar */}
      <div style={{
        display: 'flex',
        gap: UI_PADDING
      }}>
        <Inventory />
        <Controls />
      </div>
    </div>
  );
}
