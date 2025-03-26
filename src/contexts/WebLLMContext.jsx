import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import { useGameState } from './GameStateContext'; // Need dispatch for dialogue

const WebLLMContext = createContext();

// Keep track of initialization status globally
let isInitializing = false;
let engineInstance = null;

// Accept startLoading prop
export function WebLLMProvider({ children, startLoading }) { 
  const { dispatch } = useGameState(); // Get dispatch from GameStateContext
  const [engine, setEngine] = useState(engineInstance); // Use global instance if available
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(!!engineInstance); // Check if already initialized

  useEffect(() => {
    async function initWebLLM() {
      // Prevent multiple initializations OR if consent not given yet
      if (!startLoading || initialized || isInitializing || engineInstance) { 
        if (engineInstance && !engine) setEngine(engineInstance); // Ensure state syncs if already initialized
        return;
      }
      
      isInitializing = true;
      setLoading(true);
      // Use SET_WEBLLM_STATUS for initial message
      dispatch({ type: 'SET_WEBLLM_STATUS', payload: 'Initializing AI Engine...' }); 
      console.log("Attempting to initialize WebLLM...");

      // Define the progress callback
      const progressCallback = (report) => {
        console.log("WebLLM Progress:", report);
        // Dispatch status updates to game state
        dispatch({ type: 'SET_WEBLLM_STATUS', payload: report.text }); 
      };

      try {
        const worker = new Worker(new URL('../workers/llm.worker.js', import.meta.url), {
          type: 'module'
        });
        // Pass the callback to CreateWebWorkerMLCEngine
        const createdEngine = await CreateWebWorkerMLCEngine(
          worker,
          "Llama-3.1-8B-Instruct-q4f32_1-MLC",
          { initProgressCallback: progressCallback } // Engine options
        );
        
        engineInstance = createdEngine; // Store globally
        setEngine(createdEngine);
        setInitialized(true);
        // Update status one last time
        dispatch({ type: 'SET_WEBLLM_STATUS', payload: 'AI model ready!' }); 
        console.log("WebLLM initialized successfully.");
      } catch (error) {
        // Update status on error
        dispatch({ type: 'SET_WEBLLM_STATUS', payload: `AI Error: ${error.message}` }); 
        console.error("WebLLM initialization failed:", error);
      } finally {
        setLoading(false);
        isInitializing = false;
      }
    }

    initWebLLM();

    // Cleanup function (optional, might interfere if needed globally)
    // return () => {
    //   engineInstance?.terminate(); 
    //   engineInstance = null;
    //   setInitialized(false);
    //   console.log("WebLLM terminated.");
    // };
  }, [dispatch, initialized, engine, startLoading]); // Add startLoading to dependencies

  // Memoize generateResponse to prevent unnecessary re-renders
  // Updated signature to accept messages array and optional responseFormat
  const generateResponse = useCallback(async (messages, customerName, responseFormat = null) => {
    if (!engine || loading) {
      console.log("Generate response called but engine not ready or loading.");
      return null; // Return null to indicate failure/not ready
    }
    
    setLoading(true);
    // Only add "thinking" dialogue if not expecting JSON (JSON responses handle their own dialogue)
    if (!responseFormat) {
        dispatch({ type: 'ADD_DIALOGUE', payload: `${customerName} is thinking...` });
    }
    console.log(`Generating response for: ${customerName}`, responseFormat ? ' (JSON Mode)' : '');

    try {
      // Construct payload, conditionally adding response_format
      const requestPayload = {
        messages: messages, // Use the full messages array
        // Add other parameters like temperature if needed
        // temperature: 0.7, 
      };
      if (responseFormat) {
        requestPayload.response_format = responseFormat;
      }

      const reply = await engine.chat.completions.create(requestPayload);
      
      const rawContent = reply.choices[0].message.content;

      if (responseFormat) {
        // Handle JSON response
        console.log('Raw LLM JSON response:', rawContent);
        try {
          // Clean potential markdown/formatting issues before parsing
          const cleanedContent = rawContent.replace(/```json\n?/, '').replace(/```$/, '').trim();
          const parsedResponse = JSON.parse(cleanedContent);
          console.log('Parsed LLM JSON response:', parsedResponse);
          // The calling function will handle dispatching dialogue based on parsedResponse
          return parsedResponse; 
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          console.error('Problematic JSON content:', rawContent);
          dispatch({ type: 'ADD_DIALOGUE', payload: `AI Error: Invalid response format.` });
          return null; // Indicate error
        }
      } else {
        // Handle text response (original behavior)
        dispatch({ type: 'ADD_DIALOGUE', payload: `${customerName}: ${rawContent}` });
        console.log(`AI Text Response: ${rawContent}`);
        return rawContent;
      }

    } catch (error) {
      dispatch({ type: 'ADD_DIALOGUE', payload: `AI generation error: ${error.message}` });
      console.error("AI generation failed:", error);
      return null; // Indicate error
    } finally {
      setLoading(false);
    }
  }, [engine, loading, dispatch]);

  const value = { engine, loading, initialized, generateResponse };

  return (
    <WebLLMContext.Provider value={value}>
      {children}
    </WebLLMContext.Provider>
  );
}

export function useWebLLMContext() {
  const context = useContext(WebLLMContext);
  if (context === undefined) {
    throw new Error('useWebLLMContext must be used within a WebLLMProvider');
  }
  return context;
}
