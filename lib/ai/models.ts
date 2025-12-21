// Privy uses a single optimized model for coaching
export const DEFAULT_CHAT_MODEL = "accounts/fireworks/models/llama-v3p1-8b-instruct";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

// Simplified model list for Privy - just one optimized model
export const chatModels: ChatModel[] = [
  {
    id: "accounts/fireworks/models/llama-v3p1-8b-instruct",
    name: "Privy Coach",
    provider: "fireworks",
    description: "Llama 3.1 8B - Fast and reliable for private coaching",
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
