// Privy uses a single optimized model for coaching
export const DEFAULT_CHAT_MODEL = "accounts/fireworks/models/gemma-3-4b-it";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

// Simplified model list for Privy - just one optimized model
export const chatModels: ChatModel[] = [
  {
    id: "accounts/fireworks/models/gemma-3-4b-it",
    name: "Privy Coach",
    provider: "fireworks",
    description: "Gemma 3 4B - Fast and private coaching",
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
