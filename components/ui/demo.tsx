import { TextShimmer } from "@/components/ui/text-shimmer";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Primary thinking indicator - bigger font
export function TextShimmerThinking() {
    return (
        <TextShimmer className="font-mono text-3xl font-bold" duration={1.5}>
            Thinking...
        </TextShimmer>
    );
}

export function TextShimmerBasic() {
    return (
        <TextShimmer className="font-mono text-sm" duration={1}>
            Processing...
        </TextShimmer>
    );
}

export function TextShimmerColor() {
    return (
        <TextShimmer
            duration={1.2}
            className="text-xl font-medium [--base-color:theme(colors.blue.600)] [--base-gradient-color:theme(colors.blue.200)] dark:[--base-color:theme(colors.blue.700)] dark:[--base-gradient-color:theme(colors.blue.400)]"
        >
            Hi, how are you?
        </TextShimmer>
    );
}

export function DefaultToggle() {
    return (
        <div className="space-y-2 text-center">
            <div className="flex justify-center">
                <ThemeToggle />
            </div>
        </div>
    );
}

export function ComponentShowcase() {
    return (
        <div className="flex flex-col gap-8 p-8 items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">Component Showcase</h1>
                <p className="text-muted-foreground">
                    TextShimmer and ThemeToggle components
                </p>
            </div>

            <div className="flex flex-col gap-6 items-center w-full max-w-2xl">
                <div className="space-y-4 text-center">
                    <h2 className="text-xl font-semibold">Theme Toggle</h2>
                    <ThemeToggle />
                </div>

                <div className="space-y-4 text-center">
                    <h2 className="text-xl font-semibold">Text Shimmer - Basic</h2>
                    <TextShimmerBasic />
                </div>

                <div className="space-y-4 text-center">
                    <h2 className="text-xl font-semibold">Text Shimmer - Thinking</h2>
                    <TextShimmerThinking />
                </div>

                <div className="space-y-4 text-center">
                    <h2 className="text-xl font-semibold">Text Shimmer - Color</h2>
                    <TextShimmerColor />
                </div>
            </div>
        </div>
    );
}

export default {
    TextShimmerBasic,
    TextShimmerThinking,
    TextShimmerColor,
    DefaultToggle,
    ComponentShowcase,
};
