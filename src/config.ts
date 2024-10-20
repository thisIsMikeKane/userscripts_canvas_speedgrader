// This file cannot contain Webpack-resolved imports (e.g. "~src/foo").

export const OPERATIONS_INTERVAL = 200; // ms
export const OPERATIONS_EXTRA_TRIES = 3;

// ChatGPT API Config
// ##################
export const API_ENDPOINTS = {
    assistant: "https://api.openai.com/v1/assistants",
    thread: "https://api.openai.com/v1/threads",
  };
  
  export const POLL_INTERVAL = 5000; // in milliseconds
  export const MAX_RETRIES = 5;
  