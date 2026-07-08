import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CreateWebWorkerMLCEngine, prebuiltAppConfig } from '@mlc-ai/web-llm';

const WebLLMContext = createContext();

export const MODEL_OPTIONS = [
  {
    id: 'Qwen3.5-2B-q4f16_1-MLC',
    label: 'Quick',
    params: '2B',
    size: '~1.2 GB',
    blurb: 'Fast download and snappy replies with respectable personality.',
    noThink: true,
  },
  {
    id: 'Qwen3.5-4B-q4f16_1-MLC',
    label: 'Balanced',
    params: '4B',
    size: '~2.3 GB',
    blurb: 'Sharp, characterful hagglers at a reasonable speed. Recommended.',
    recommended: true,
    noThink: true,
  },
  {
    id: 'Qwen3.5-9B-q4f16_1-MLC',
    label: 'Rich',
    params: '9B',
    size: '~5 GB',
    blurb: 'The most cunning customers. Needs a beefy GPU (6.5 GB VRAM).',
    noThink: true,
  },
];

export const MODEL_KEY = 'haggle_model_id';

function resolveModelId(stored) {
  return MODEL_OPTIONS.some((m) => m.id === stored)
    ? stored
    : MODEL_OPTIONS.find((m) => m.recommended).id;
}

export function WebLLMProvider({ children, startLoading }) {
  const [engine, setEngine] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('Waiting to load the AI model…');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const initStarted = useRef(false);
  const modelIdRef = useRef(null);

  useEffect(() => {
    if (!startLoading || initStarted.current) return;
    initStarted.current = true;

    const modelId = resolveModelId(localStorage.getItem(MODEL_KEY));
    modelIdRef.current = modelId;

    (async () => {
      setStatus('Starting AI engine…');
      try {
        if (!navigator.gpu) {
          throw new Error('This browser does not support WebGPU. Try a recent Chrome or Edge.');
        }
        const attempt = (cacheBackend) => {
          const worker = new Worker(new URL('../workers/llm.worker.js', import.meta.url), {
            type: 'module',
          });
          return CreateWebWorkerMLCEngine(worker, modelId, {
            appConfig: { ...prebuiltAppConfig, cacheBackend },
            initProgressCallback: (report) => {
              setStatus(report.text);
              setProgress(report.progress ?? 0);
            },
          });
        };
        // Some browsers' Cache API / IndexedDB choke on multi-GB writes, so
        // fall through the storage backends until one holds the weights.
        // localStorage 'haggle_cache_backend' pins a specific one (debugging).
        const forced = localStorage.getItem('haggle_cache_backend');
        const backends = forced ? [forced] : ['cache', 'opfs', 'indexeddb'];
        let created;
        for (let i = 0; i < backends.length; i++) {
          try {
            created = await attempt(backends[i]);
            break;
          } catch (e) {
            const storageIssue = /cache|indexeddb|storage|quota|file/i.test(String(e?.message ?? e));
            if (!storageIssue || i === backends.length - 1) throw e;
            console.warn(`Weight store "${backends[i]}" failed, trying "${backends[i + 1]}":`, e);
            setStatus('Storage hiccup — retrying with a sturdier cache…');
          }
        }
        setEngine(created);
        setInitialized(true);
        setStatus('AI model ready!');
        setProgress(1);
      } catch (e) {
        console.error('WebLLM initialization failed:', e);
        setError(e.message || String(e));
        setStatus(`AI failed to load: ${e.message}`);
      }
    })();
  }, [startLoading]);

  // Generate a JSON object matching `schema`. Grammar-constrained decoding
  // guarantees shape; we still parse defensively and retry once.
  const generateJSON = useCallback(
    async (messages, schema) => {
      if (!engine) return null;
      setGenerating(true);
      try {
        const modelOption = MODEL_OPTIONS.find((m) => m.id === modelIdRef.current);
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const reply = await engine.chat.completions.create({
              messages,
              temperature: 0.8,
              max_tokens: 400,
              response_format: { type: 'json_object', schema },
              // Hybrid-reasoning models (Qwen3 family) would otherwise burn
              // seconds "thinking" before every line of shop banter.
              ...(modelOption?.noThink ? { extra_body: { enable_thinking: false } } : {}),
            });
            const raw = reply.choices[0].message.content;
            // Reasoning models prepend a <think> block (empty when thinking is
            // disabled); others may wrap in markdown fences. Extract the JSON.
            let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            const start = cleaned.indexOf('{');
            const end = cleaned.lastIndexOf('}');
            if (start !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);
            return JSON.parse(cleaned);
          } catch (e) {
            console.warn(`Generation attempt ${attempt + 1} failed:`, e);
            if (attempt === 1) throw e;
          }
        }
      } catch (e) {
        console.error('AI generation failed:', e);
        return null;
      } finally {
        setGenerating(false);
      }
      return null;
    },
    [engine]
  );

  const value = { initialized, generating, status, progress, error, generateJSON };

  return <WebLLMContext.Provider value={value}>{children}</WebLLMContext.Provider>;
}

export function useWebLLM() {
  const context = useContext(WebLLMContext);
  if (context === undefined) {
    throw new Error('useWebLLM must be used within a WebLLMProvider');
  }
  return context;
}
