import { createFireworks } from "@ai-sdk/fireworks";

// Fireworks AI provider (AI SDK 5 compatible)
const fireworks = createFireworks({
  apiKey: process.env.FIREWORKS_API_KEY ?? "",
});

// Privy's deployed Gemma 3 4B model on Fireworks
const PRIVY_MODEL = "accounts/pari2798-c02e30/deployedModels/gemma-3-4b-it-gfd37w0q";

// Note: Return type is `any` to work around @ai-sdk/provider version mismatch
// between @ai-sdk/fireworks (3.0.0-beta) and ai package (2.0.0)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLanguageModel(modelId?: string): any {
  // Always use Privy's deployed model
  return fireworks(PRIVY_MODEL);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTitleModel(): any {
  return fireworks(PRIVY_MODEL);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getArtifactModel(): any {
  return fireworks(PRIVY_MODEL);
}
