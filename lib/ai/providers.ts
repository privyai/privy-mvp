import { createFireworks } from "@ai-sdk/fireworks";

// Fireworks AI provider (AI SDK 5 compatible)
const fireworks = createFireworks({
  apiKey: process.env.FIREWORKS_API_KEY ?? "",
});

// Privy's deployed Gemma 3 4B model on Fireworks
const PRIVY_MODEL = "accounts/pari2798-c02e30/deployedModels/gemma-3-4b-it-gfd37w0q";

export function getLanguageModel(modelId?: string) {
  // Always use Privy's deployed model
  return fireworks(PRIVY_MODEL);
}

export function getTitleModel() {
  return fireworks(PRIVY_MODEL);
}

export function getArtifactModel() {
  return fireworks(PRIVY_MODEL);
}
