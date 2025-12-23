// Privy uses Llama 3.3 70B Instruct for reliable streaming
export const DEFAULT_CHAT_MODEL = "accounts/fireworks/models/llama-v3p3-70b-instruct";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

// Simplified model list for Privy - Llama 3.3 70B
export const chatModels: ChatModel[] = [
  {
    id: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    name: "Privy Coach",
    provider: "fireworks",
    description: "Llama 3.3 70B - Fast streaming, excellent for coaching",
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
