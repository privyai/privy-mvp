import { createOpenAI } from "@ai-sdk/openai";

// Fireworks AI with OpenAI-compatible API
const fireworks = createOpenAI({
  apiKey: process.env.FIREWORKS_API_KEY,
  baseURL: "https://api.fireworks.ai/inference/v1",
});

// Default model for Privy coaching
const PRIVY_MODEL = "accounts/fireworks/models/gemma-3-4b-it";

export function getLanguageModel(modelId?: string) {
  // Always use Privy's coaching model
  return fireworks(PRIVY_MODEL);
}

export function getTitleModel() {
  return fireworks(PRIVY_MODEL);
}

export function getArtifactModel() {
  return fireworks(PRIVY_MODEL);
}
