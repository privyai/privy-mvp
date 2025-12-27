import { createFireworks } from "@ai-sdk/fireworks";

const fireworks = createFireworks({
  apiKey: process.env.FIREWORKS_API_KEY ?? "",
});

// MiniMax-M2.1: 228B MoE, fast inference (~1s TTFT vs 4s for GLM-4.7)
// Optimized for agent-driven workflows and conversational AI
const DEFAULT_MODEL = "accounts/fireworks/models/minimax-m2p1";

// Note: Return type is `any` to work around @ai-sdk/provider version mismatch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLanguageModel(modelId?: string): any {
  return fireworks(modelId || DEFAULT_MODEL);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTitleModel(): any {
  return fireworks(DEFAULT_MODEL);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getArtifactModel(): any {
  return fireworks(DEFAULT_MODEL);
}

