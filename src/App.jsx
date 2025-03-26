import { GameStateProvider } from './contexts/GameStateContext';
import { WebLLMProvider } from './contexts/WebLLMContext'; // Import the new provider
import { HashRouter, Routes, Route } from 'react-router-dom';
import ShopLayout from './components/ShopLayout';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Layout from './components/Layout';

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <GameStateProvider>
        {/* WebLLMProvider needs to be inside GameStateProvider */}
        <WebLLMProvider> 
          <HashRouter>
            <Layout>
              <Routes>
              <Route path="/" element={<ShopLayout />} />
              </Routes>
            </Layout>
          </HashRouter>
        </WebLLMProvider>
      </GameStateProvider>
    </DndProvider>
  );
}

export default App;
