import { Application, extend } from '@pixi/react'; // Import extend
import { Graphics, Sprite, Texture } from 'pixi.js'; // Import classes from pixi.js
import { useCallback, useEffect, useState, useRef } from 'react'; // Restore useRef
import * as PIXI from 'pixi.js';

// Extend Pixi components for use in React
extend({ Graphics, Sprite });

export default function AnimatedBackground() {
  // Removed const app = useApp();
  const appRef = useRef(); // Restore appRef
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const [shapes, setShapes] = useState([]);
  const [coinTexture, setCoinTexture] = useState(null);


  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create coin texture once when ref is ready and texture doesn't exist
  useEffect(() => {
    // Ensure ref is set
    if (!appRef.current) return;

    // Get the actual Pixi Application instance
    const app = appRef.current.getApplication();

    // Ensure app, renderer are available, and texture hasn't been created
    if (!app || !app.renderer || coinTexture) return;

    const g = new Graphics(); // Use Graphics class from pixi.js
    const radius = 10; // Base size for texture
    
    // Draw coin with border and inner detail
    g.beginFill(0xFFD700);
    g.lineStyle(1, 0xCC9900);
    g.drawCircle(radius, radius, radius);
    g.endFill();
    
    // Inner circle detail
    g.beginFill(0xFFF0A0);
    g.drawCircle(radius, radius, radius * 0.6);
    g.endFill();

    // Generate texture using the renderer from the retrieved app instance
    const texture = app.renderer.generateTexture(g);
    console.log('Coin texture generated:', texture); // Log texture generation
    setCoinTexture(texture);
  }); // No dependency array: runs after every render, guarded by the check inside

  // Initialize coins
  useEffect(() => {
    if (!coinTexture) return;

    const initialCoins = Array.from({ length: 30 }, () => {
      const radius = Math.random() * 10 + 5;
      const speedFactor = 0.2 + (1 - radius/15); // Smaller coins move slower
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: radius,
        speedX: (Math.random() - 0.5) * 0.5 * speedFactor,
        speedY: (Math.random() - 0.5) * 0.5 * speedFactor,
        rotation: Math.random() * Math.PI * 2, // Random starting rotation
        rotationSpeed: (Math.random() - 0.5) * 0.05, // Rotation speed
      };
    });
    console.log('Initializing shapes:', initialCoins); // Log initial shapes
    setShapes(initialCoins);
  }, [width, height, coinTexture]);

  // Animation loop
  useEffect(() => {
    if (!coinTexture) return;

    const animate = () => {
      setShapes(prevShapes =>
        prevShapes.map(coin => {
          let newX = coin.x + coin.speedX;
          let newY = coin.y + coin.speedY;
          let newRotation = coin.rotation + coin.rotationSpeed;

          // Wrap around edges
          if (newX < -coin.radius) newX = width + coin.radius;
          if (newX > width + coin.radius) newX = -coin.radius;
          if (newY < -coin.radius) newY = height + coin.radius;
          if (newY > height + coin.radius) newY = -coin.radius;

          return {
            ...coin,
            x: newX,
            y: newY,
            rotation: newRotation,
          };
        })
      );
    };

    const interval = setInterval(animate, 16); // ~60fps
    return () => clearInterval(interval);
  }, [width, height, coinTexture]);

  const draw = useCallback(g => {
    g.clear();
    g.fill({ color: 0x1a1a2e, alpha: 0.5 }); // Dark blue background with transparency
    g.rect(0, 0, width, height);
    g.fill();
  }, [width, height]);

  // Removed console.log('Render - appRef.current:', appRef.current);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1
    }}>
      <Application width={width} height={height} backgroundAlpha={0} ref={appRef}>
        <pixiGraphics draw={draw} />
        {coinTexture && shapes.map((coin, i) => (
          <pixiSprite
            key={i}
            texture={coinTexture}
            x={coin.x}
            y={coin.y}
            width={coin.radius * 2}
            height={coin.radius * 2}
            rotation={coin.rotation}
            anchor={0.5}
          />
        ))}
      </Application>
    </div>
  );
}
