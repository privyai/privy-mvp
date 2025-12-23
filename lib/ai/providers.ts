import { createFireworks } from "@ai-sdk/fireworks";

// Fireworks AI provider (AI SDK 5 compatible)
const fireworks = createFireworks({
  apiKey: process.env.FIREWORKS_API_KEY ?? "",
});

// Llama 3.3 70B Instruct - reliable streaming, excellent for coaching
// Note: DeepSeek V3.2 was causing streaming issues (outputs reasoning_content instead of content)
const DEFAULT_MODEL = "accounts/fireworks/models/llama-v3p3-70b-instruct";

// Note: Return type is `any` to work around @ai-sdk/provider version mismatch
// between @ai-sdk/fireworks (3.0.0-beta) and ai package (2.0.0)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLanguageModel(modelId?: string): any {
  return fireworks(DEFAULT_MODEL);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTitleModel(): any {
  return fireworks(DEFAULT_MODEL);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getArtifactModel(): any {
  return fireworks(DEFAULT_MODEL);
}
