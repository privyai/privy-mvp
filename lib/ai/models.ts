// Privy uses MiniMax-M2.1 for fast, high-quality coaching (228B MoE, ~1s TTFT)
export const DEFAULT_CHAT_MODEL = "accounts/fireworks/models/minimax-m2p1";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

// Simplified model list for Privy - GLM-4.7
export const chatModels: ChatModel[] = [
  {
    id: "accounts/fireworks/models/minimax-m2p1",
    name: "Privy Coach",
    provider: "fireworks",
    description: "MiniMax-M2.1 - Fast, empathetic coaching",
  },
  {
    id: "mode-vent",
    name: "Vent",
    provider: "coaching",
    description: "Safe space for emotional decompression",
  },
  {
    id: "mode-decision",
    name: "Decision Lab",
    provider: "coaching",
    description: "Structured analysis for complex choices",
  },
  {
    id: "mode-reframe",
    name: "Reframe",
    provider: "coaching",
    description: "Shift perspective and regain clarity",
  },
];

// Group models by provider for UI
export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
