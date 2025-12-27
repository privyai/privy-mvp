import { FireworksLanguageModel } from "./custom-fireworks-provider";

// GLM-4.7: 352B MoE, 198k context, optimized for reasoning and agentic workflows
// Note: This model outputs reasoning_content (chain-of-thought) which streams properly
const DEFAULT_MODEL = "accounts/fireworks/models/glm-4p7";

// Note: Return type is `any` to work around @ai-sdk/provider version mismatch
// between @ai-sdk/fireworks (3.0.0-beta) and ai package (2.0.0)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLanguageModel(modelId?: string): any {
  return new FireworksLanguageModel(
    modelId || DEFAULT_MODEL,
    {
      apiKey: process.env.FIREWORKS_API_KEY ?? "",
      baseURL: "https://api.fireworks.ai/inference/v1",
    }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTitleModel(): any {
  return new FireworksLanguageModel(
    DEFAULT_MODEL,
    {
      apiKey: process.env.FIREWORKS_API_KEY ?? "",
      baseURL: "https://api.fireworks.ai/inference/v1",
    }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getArtifactModel(): any {
  return new FireworksLanguageModel(
    DEFAULT_MODEL,
    {
      apiKey: process.env.FIREWORKS_API_KEY ?? "",
      baseURL: "https://api.fireworks.ai/inference/v1",
    }
  );
}

