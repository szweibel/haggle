import { COLORS } from '../gameState';

export default function Spinner() {
  // Define keyframes directly in JS - less ideal but works for simple cases
  const keyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  // Inject styles if not already present
  const styleId = 'spinner-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = keyframes;
    document.head.appendChild(styleSheet);
  }

  return (
    <div style={{
      display: 'inline-block',
      width: '0.9em', // Slightly smaller
      height: '0.9em',
      border: `3px solid ${COLORS.textLight}33`, // Lighter track with alpha
      borderTopColor: COLORS.textGold, // Use gold color for the moving part
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite', // Slightly faster
      marginLeft: '0.75em', // Adjust spacing
      verticalAlign: 'middle' // Align better with text
    }} />
  );
}
