import { COLORS } from '../gameState';
import AnimatedBackground from './AnimatedBackground';

export default function Layout({ children }) {
  return (
    <div style={{
      position: 'relative',
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
        margin: '0 auto'
      }}>
        {children}
      </div>
    </div>
  );
}
