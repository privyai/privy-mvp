import { createFireworks } from "@ai-sdk/fireworks";

// Fireworks AI provider (AI SDK 5 compatible)
const fireworks = createFireworks({
  apiKey: process.env.FIREWORKS_API_KEY ?? "",
});

// Default model for Privy coaching - Llama 3.1 8B Instruct (fast and reliable)
const PRIVY_MODEL = "accounts/fireworks/models/llama-v3p1-8b-instruct";

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
