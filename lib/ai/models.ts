// Privy uses GLM-4.7 for superior reasoning (352B MoE, 198k context)
export const DEFAULT_CHAT_MODEL = "accounts/fireworks/models/glm-4p7";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

// Simplified model list for Privy - GLM-4.7
export const chatModels: ChatModel[] = [
  {
    id: "accounts/fireworks/models/glm-4p7",
    name: "Privy Coach",
    provider: "fireworks",
    description: "GLM-4.7 - 352B MoE, 198k context, advanced reasoning",
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
