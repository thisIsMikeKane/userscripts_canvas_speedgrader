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

export async function getAssistantId(): Promise<string | null> {
  let assistantId: string | null = await GM.getValue("assistant_id", null);

  if (!assistantId) {
    assistantId = prompt("Please enter your Assistant ID:") || null;
    if (assistantId) {
      await GM.setValue("assistant_id", assistantId);
      console.log("Assistant ID saved successfully!");
    } else {
      console.log("No Assistant ID provided.");
    }
  }

  return assistantId;
}


