import React from 'react';
import { COLORS, UI_PADDING } from '../gameState';

export default function ConsentModal({ onAccept }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark overlay
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000 // Ensure it's on top
    }}>
      <div style={{
        backgroundColor: COLORS.panel,
        color: COLORS.text,
        padding: UI_PADDING * 2,
        borderRadius: 8,
        border: `2px solid ${COLORS.panelStroke}`,
        maxWidth: '500px',
        textAlign: 'center',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ color: COLORS.textGold, fontFamily: "'Cinzel Decorative', serif" }}>AI Model Notice</h2>
        <p style={{ lineHeight: 1.6, margin: `${UI_PADDING}px 0` }}>
          Welcome to Haggle! This game uses a large language model (LLM) AI to power the customer negotiations.
        </p>
        <p style={{ lineHeight: 1.6, margin: `${UI_PADDING}px 0` }}>
          To enable this, the AI model needs to be downloaded and cached in your browser storage (this might take a few moments, depending on your connection). This download will only happen once.
        </p>
        <p style={{ lineHeight: 1.6, margin: `${UI_PADDING}px 0` }}>
          Click "Accept" to download the model and start playing.
        </p>
        <button
          onClick={onAccept}
          style={{
            marginTop: UI_PADDING,
            padding: `${UI_PADDING}px ${UI_PADDING * 2}px`,
            backgroundColor: COLORS.button,
            color: COLORS.panel,
            border: `1px solid ${COLORS.buttonStroke}`,
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '1.1em',
            fontWeight: 700
          }}
        >
          Accept & Start Download
        </button>
      </div>
    </div>
  );
}
