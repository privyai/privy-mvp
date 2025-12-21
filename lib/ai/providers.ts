import { createFireworks } from "@ai-sdk/fireworks";

// Fireworks AI provider (AI SDK 5 compatible)
const fireworks = createFireworks({
  apiKey: process.env.FIREWORKS_API_KEY ?? "",
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
