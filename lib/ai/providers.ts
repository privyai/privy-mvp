import { createFireworks } from "@ai-sdk/fireworks";

// Fireworks AI provider (AI SDK 5 compatible)
const fireworks = createFireworks({
  apiKey: process.env.FIREWORKS_API_KEY ?? "",
});

// GLM-4.7: 352B MoE, 198k context, optimized for reasoning and agentic workflows
// Note: This model outputs reasoning_content (chain-of-thought) which streams properly
const DEFAULT_MODEL = "accounts/fireworks/models/glm-4p7";

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

