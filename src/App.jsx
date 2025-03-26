import { useState, useEffect } from 'react';
import { GameStateProvider } from './contexts/GameStateContext';
import { WebLLMProvider } from './contexts/WebLLMContext'; // Import the new provider
import { HashRouter, Routes, Route } from 'react-router-dom';
import ShopLayout from './components/ShopLayout';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Layout from './components/Layout';
import ConsentModal from './components/ConsentModal'; // Import the modal

const CONSENT_KEY = 'haggle_llm_consent_given';

function App() {
  // State to track if consent is needed (based on localStorage)
  const [consentNeeded, setConsentNeeded] = useState(true);
  // State to track if user has actively accepted (to trigger LLM load)
  const [consentAccepted, setConsentAccepted] = useState(false);

  // Check localStorage on initial mount
  useEffect(() => {
    const consentGiven = localStorage.getItem(CONSENT_KEY);
    if (consentGiven === 'true') {
      setConsentNeeded(false);
      setConsentAccepted(true); // If already consented, mark as accepted
    } else {
      setConsentNeeded(true);
      setConsentAccepted(false);
    }
  }, []);

  const handleConsentAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setConsentNeeded(false);
    setConsentAccepted(true); // Mark as accepted to trigger load
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <GameStateProvider>
        {/* Conditionally render WebLLMProvider only after consent */}
        {/* Pass consentAccepted state to trigger loading */}
        <WebLLMProvider startLoading={consentAccepted}> 
          {consentNeeded ? (
            <ConsentModal onAccept={handleConsentAccept} />
          ) : (
            <HashRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<ShopLayout />} />
                </Routes>
              </Layout>
            </HashRouter>
          )}
        </WebLLMProvider>
      </GameStateProvider>
    </DndProvider>
  );
}

export default App;
