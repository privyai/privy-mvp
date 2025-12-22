// Privy uses DeepSeek V3.2 for superior reasoning
export const DEFAULT_CHAT_MODEL = "accounts/fireworks/models/deepseek-v3p2";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

// Simplified model list for Privy - DeepSeek V3.2
export const chatModels: ChatModel[] = [
  {
    id: "accounts/fireworks/models/deepseek-v3p2",
    name: "Privy Coach",
    provider: "fireworks",
    description: "DeepSeek V3.2 - Superior reasoning, 160k context",
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
