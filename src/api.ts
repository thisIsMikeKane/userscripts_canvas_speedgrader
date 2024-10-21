// src/api.ts

import { API_ENDPOINTS, POLL_INTERVAL, MAX_RETRIES } from "./config";
import { getApiKey, getAssistantId } from "./preferences";
import { parseEvaluationResponse } from "./grade_submission";

export async function sendToChatGPT(content: string): Promise<void> {
    const apiKey = await getApiKey();
    const assistantId = await getAssistantId();
    if (!apiKey || !assistantId) return;
  
    if (!assistantId) return;
  
    const threadId = await createThread(apiKey);
    if (!threadId) return;
  
    const messageAdded = await addMessageToThread(apiKey, threadId, content);
    if (!messageAdded) return;
  
    await createRun(apiKey, threadId, assistantId, (responseText) => {
      parseEvaluationResponse(responseText);
    });
  }

// Function to create an assistant using XMLHttpRequest
export async function createAssistant(apiKey: string): Promise<string | null> {
    const assistantUrl = 'https://api.openai.com/v1/assistants';
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', assistantUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
        xhr.setRequestHeader('OpenAI-Beta', 'assistants=v2');

        xhr.onreadystatechange = async function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    console.log('Assistant created:', data.id);
                    await GM.setValue('assistant_id', data.id);
                    resolve(data.id);
                } else {
                    console.error('Error creating assistant:', xhr.statusText, xhr.responseText);
                    resolve(null);
                }
            }
        };

        xhr.onerror = function() {
            console.error('XMLHttpRequest error while creating assistant');
            resolve(null);
        };

        xhr.send(JSON.stringify({
            instructions: "You are a grading assistant for Canvas SpeedGrader. Evaluate the student's response based on the specified rubric.",
            name: "SpeedGrader Assistant",
            model: "gpt-4o"
        }));
    });
}

// Function to create a thread for conversation using XMLHttpRequest
export async function createThread(apiKey: string): Promise<string | null> {
  const threadUrl = 'https://api.openai.com/v1/threads';
  return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', threadUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
      xhr.setRequestHeader('OpenAI-Beta', 'assistants=v2');

      xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
              if (xhr.status === 200) {
                  const data = JSON.parse(xhr.responseText);
                  console.log('Thread created:', data.id);
                  resolve(data.id);
              } else {
                  console.error('Error creating thread:', xhr.statusText, xhr.responseText);
                  resolve(null);
              }
          }
      };

      xhr.onerror = function() {
          console.error('XMLHttpRequest error while creating thread');
          resolve(null);
      };

      xhr.send(JSON.stringify({}));
  });
}

// Function to add a message to the thread using XMLHttpRequest
export async function addMessageToThread(apiKey: string, threadId: string, content: string): Promise<boolean> {
  const messageUrl = `https://api.openai.com/v1/threads/${threadId}/messages`;
  console.log(`Trying to send message to thread ${threadId}`);
  return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', messageUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
      xhr.setRequestHeader('OpenAI-Beta', 'assistants=v2');

      xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
              if (xhr.status === 200) {
                  const data = JSON.parse(xhr.responseText);
                  console.log('Message added to thread:', data);
                  resolve(true);
              } else {
                  console.error('Error adding message to thread:', xhr.statusText, xhr.responseText);
                  resolve(false);
              }
          }
      };

      xhr.onerror = function() {
          console.error('XMLHttpRequest error while adding message to thread');
          resolve(false);
      };

      xhr.send(JSON.stringify({
          role: 'user',
          content: content
      }));
  });
}

export async function createRun(
  apiKey: string,
  threadId: string,
  assistantId: string,
  onResponse: (responseText: string) => void
): Promise<void> {
  const runUrl = `https://api.openai.com/v1/threads/${threadId}/runs`;
  return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', runUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
      xhr.setRequestHeader('OpenAI-Beta', 'assistants=v2');

      xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
              if (xhr.status === 200) {
                  const data = JSON.parse(xhr.responseText);
                  if (data.status === 'queued') {
                      console.log('Run is queued. Polling for completion...');
                      pollRunStatus(apiKey, threadId, data.id);
                  } else if (data.status === 'completed') {
                      console.log('Run completed. Fetching messages...');
                      fetchThreadMessages(apiKey, threadId);
                  } else {
                      console.error('Unexpected run status:', data);
                  }
              } else {
                  console.error('Error creating run:', xhr.statusText, xhr.responseText);
              }
          }
      };

      xhr.onerror = function() {
          console.error('XMLHttpRequest error while creating run');
      };

      xhr.send(JSON.stringify({
          assistant_id: assistantId
      }));
  });
}

// Function to poll the run status until it's complete
async function pollRunStatus(apiKey: string, threadId: string, runId: string) {
  const runStatusUrl = `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`;
  const pollInterval = 5000; // Poll every 5 seconds
  let retries = 0;
  const maxRetries = 5;

  function poll() {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', runStatusUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
      xhr.setRequestHeader('OpenAI-Beta', 'assistants=v2');

      xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
              if (xhr.status === 200) {
                  const data = JSON.parse(xhr.responseText);
                  if (data.status === 'completed') {
                      console.log('Run completed. Fetching messages...');
                      fetchThreadMessages(apiKey, threadId);
                  } else if (data.status === 'queued' || data.status === 'in_progress') {
                      console.log('Run still in progress. Re-polling...');
                      if (retries < maxRetries) {
                          retries++;
                          setTimeout(poll, pollInterval);
                      } else {
                          console.error('Max retries reached. Run did not complete in time.');
                      }
                  } else {
                      console.error('Unexpected run status:', data);
                  }
              } else {
                  console.error('Error polling run status:', xhr.statusText, xhr.responseText);
              }
          }
      };

      xhr.onerror = function() {
          console.error('XMLHttpRequest error while polling run status');
      };

      xhr.send();
  }

  poll();
}

// Function to fetch thread messages after run completion
async function fetchThreadMessages(apiKey: string, threadId: string): Promise<void> {
  const messagesUrl = `https://api.openai.com/v1/threads/${threadId}/messages`;
  return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', messagesUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
      xhr.setRequestHeader('OpenAI-Beta', 'assistants=v2');

      xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
              if (xhr.status === 200) {
                  const data = JSON.parse(xhr.responseText);
                  console.debug(data);
                  if (data.data && data.data.length > 0 && data.data[0].content && data.data[0].content.length > 0) {
                      const messageContent = data.data[0].content[0].text;
                      console.log('Assistant response:', messageContent);
                      parseEvaluationResponse(messageContent);
                  } else {
                      console.error('No valid messages found in the thread response.');
                  }
              } else {
                  console.error('Error fetching thread messages:', xhr.statusText, xhr.responseText);
              }
          }
      };

      xhr.onerror = function() {
          console.error('XMLHttpRequest error while fetching thread messages');
      };

      xhr.send();
  });
}
