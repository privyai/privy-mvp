import OpenAI from "openai";

// Mimic LanguageModelV1 interface structurally to avoid import issues
export class FireworksLanguageModel {
    readonly specificationVersion = "v1";
    readonly defaultObjectGenerationMode = "json";
    readonly supportsStructuredOutputs = false;

    constructor(
        private modelId: string,
        private config: { apiKey: string; baseURL: string }
    ) { }

    get provider(): string {
        return "fireworks-custom";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async doGenerate(options: any): Promise<any> {
        throw new Error("Non-streaming not implemented for custom provider");
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messages = options.prompt.map((msg: any) => {
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await openai.chat.completions.create({
            model: this.modelId,
            messages: messages as any,
            stream: true,
            // @ts-ignore - Extra body allowed by OpenAI types but strict check fails
            extra_body: { reasoning_effort: "low" },
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
