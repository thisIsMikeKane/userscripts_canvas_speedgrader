import {
    PreferenceManager,
} from "ts-preferences";
import { loggingResponseHandler } from "userscripter/run-time/preferences";

import U from "~src/userscript";

export const P = {
} as const;

export const Preferences = new PreferenceManager(P, U.id + "-preference-", loggingResponseHandler);

import { createAssistant, createThread, addMessageToThread, createRun } from "./api";
import { populateGradeFields } from "./site";

export async function getApiKey(): Promise<string | null> {
  // Explicitly type the result of GM.getValue
  let apiKey: string | null = await GM.getValue("openai_api_key", null);
  
  if (!apiKey) {
    apiKey = prompt("Please enter your OpenAI API key:") || null;
    if (apiKey) {
      await GM.setValue("openai_api_key", apiKey);
      console.log("API key saved successfully!");
    } else {
      console.log("No API key provided.");
    }
  }

  return apiKey;
}


export async function sendToChatGPT(content: string): Promise<void> {
  const apiKey = await getApiKey();
  if (!apiKey) return;

  // Explicitly type the assistantId as string | null
  let assistantId: string | null = await GM.getValue("assistant_id", null);
  if (!assistantId) {
    assistantId = await createAssistant(apiKey);
    if (!assistantId) return;
    await GM.setValue("assistant_id", assistantId);
  }

  const threadId = await createThread(apiKey);
  if (!threadId) return;

  const messageAdded = await addMessageToThread(apiKey, threadId, content);
  if (!messageAdded) return;

  await createRun(apiKey, threadId, assistantId, (responseText) => {
    parseEvaluationResponse(responseText);
  });
}


function parseEvaluationResponse(responseText: string): void {
  try {
    const evaluation = JSON.parse(responseText) as Evaluation;
    if (evaluation && evaluation.grade && evaluation.comment && evaluation.rubric) {
      console.log("Parsed Evaluation:", evaluation);
      populateGradeFields(evaluation);
    } else {
      console.error("Invalid response format:", responseText);
    }
  } catch (error) {
    console.error("Failed to parse response as JSON:", error);
  }
}

interface Evaluation {
  grade: string;
  comment: string;
  rubric: string;
}
