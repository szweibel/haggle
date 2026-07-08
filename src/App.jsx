import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GameStateProvider } from './contexts/GameStateContext';
import { WebLLMProvider } from './contexts/WebLLMContext';
import StartScreen from './components/StartScreen';
import Layout from './components/Layout';
import ShopLayout from './components/ShopLayout';

function App() {
  const [started, setStarted] = useState(false);

  return (
    <DndProvider backend={HTML5Backend}>
      <GameStateProvider>
        <WebLLMProvider startLoading={started}>
          {started ? (
            <Layout>
              <ShopLayout />
            </Layout>
          ) : (
            <StartScreen onStart={() => setStarted(true)} />
          )}
        </WebLLMProvider>
      </GameStateProvider>
    </DndProvider>
  );
}

export default App;
