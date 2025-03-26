import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

const handler = new WebWorkerMLCEngineHandler();

// Proper module worker message handling
if (self instanceof WorkerGlobalScope) {
  self.onmessage = (msg) => {
    handler.onmessage(msg);
  };
}
