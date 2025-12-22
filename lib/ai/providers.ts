import { createFireworks } from "@ai-sdk/fireworks";

// Fireworks AI provider (AI SDK 5 compatible)
const fireworks = createFireworks({
  apiKey: process.env.FIREWORKS_API_KEY ?? "",
});

// DeepSeek V3.2 model on Fireworks
const DEEPSEEK_V3 = "accounts/fireworks/models/deepseek-v3p2";

// Note: Return type is `any` to work around @ai-sdk/provider version mismatch
// between @ai-sdk/fireworks (3.0.0-beta) and ai package (2.0.0)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLanguageModel(modelId?: string): any {
  return fireworks(DEEPSEEK_V3);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTitleModel(): any {
  return fireworks(DEEPSEEK_V3);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getArtifactModel(): any {
  return fireworks(DEEPSEEK_V3);
}
