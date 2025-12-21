// Privy uses a custom deployed model for coaching
export const DEFAULT_CHAT_MODEL = "accounts/pari2798-c02e30/deployedModels/gemma-3-4b-it-gfd37w0q";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

// Simplified model list for Privy - just one optimized model
export const chatModels: ChatModel[] = [
  {
    id: "accounts/pari2798-c02e30/deployedModels/gemma-3-4b-it-gfd37w0q",
    name: "Privy Coach",
    provider: "fireworks",
    description: "Gemma 3 4B - Custom deployed for Privy",
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
