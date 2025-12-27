import OpenAI from "openai";

// Mimic LanguageModelV1 interface structurally to avoid import issues
export class FireworksLanguageModel {
    readonly specificationVersion = "v2";
    readonly defaultObjectGenerationMode = "json";
    readonly supportsStructuredOutputs = false;

    constructor(
        private modelId: string,
        private config: { apiKey: string; baseURL: string }
    ) { }

    get provider(): string {
        return "fireworks-custom";
    }

    private convertToOpenAIMessages(prompt: any[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return prompt.map((msg: any) => {
            let content = "";
            if (typeof msg.content === "string") {
                content = msg.content;
            } else if (Array.isArray(msg.content)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content = msg.content
                    .map((part: any) => {
                        if (part.type === "text") return part.text;
                        return "";
                    })
                    .join("");
            }

            return {
                role: msg.role,
                content: content,
            };
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async doGenerate(options: any): Promise<any> {
        const openai = new OpenAI(this.config);
        const messages = this.convertToOpenAIMessages(options.prompt);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await openai.chat.completions.create({
            model: this.modelId,
            messages: messages as any,
            stream: false,
        } as any) as any;

        return {
            text: response.choices[0]?.message.content ?? "",
            finishReason: response.choices[0]?.finish_reason,
            usage: {
                promptTokens: response.usage?.prompt_tokens ?? 0,
                completionTokens: response.usage?.completion_tokens ?? 0,
            },
            rawCall: { rawPrompt: options.prompt, rawSettings: {} }
        };
    }

    async doStream(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: any
    ): Promise<{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stream: ReadableStream<any>;
        rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> };
    }> {
        const openai = new OpenAI(this.config);

        // Convert V1 prompt to OpenAI messages
        const messages = this.convertToOpenAIMessages(options.prompt);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await openai.chat.completions.create({
            model: this.modelId,
            messages: messages as any,
            stream: true,
        } as any) as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stream = new ReadableStream<any>({
            async start(controller) {
                try {
                    for await (const chunk of response) {
                        const delta = chunk.choices[0]?.delta;

                        // Capture reasoning content (Fireworks/DeepSeek extension)
                        // @ts-ignore
                        if (delta?.reasoning_content) {
                            controller.enqueue({
                                type: "reasoning-delta",
                                // @ts-ignore
                                textDelta: delta.reasoning_content,
                            });
                        }

                        if (delta?.content) {
                            controller.enqueue({
                                type: "text-delta",
                                textDelta: delta.content,
                            });
                        }
                    }

                    controller.enqueue({
                        type: "finish",
                        finishReason: "stop",
                        usage: { promptTokens: 0, completionTokens: 0 },
                    });
                    controller.close();
                } catch (e) {
                    controller.error(e);
                }
            },
        });

        return {
            stream,
            rawCall: { rawPrompt: options.prompt, rawSettings: {} },
        };
    }
}
