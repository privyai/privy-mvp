"use client";

import { Sparkles, MessageCircle, Lightbulb } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

const suggestedPrompts = [
  {
    mode: "Vent",
    icon: <MessageCircle className="h-4 w-4" />,
    prompt: "I need to vent about a difficult situation with my co-founder...",
    color: "text-orange-500 border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10",
  },
  {
    mode: "Decision Lab",
    icon: <Lightbulb className="h-4 w-4" />,
    prompt: "Help me think through whether to pivot our product strategy...",
    color: "text-blue-500 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10",
  },
  {
    mode: "Reframe & Reset",
    icon: <Sparkles className="h-4 w-4" />,
    prompt: "I'm feeling overwhelmed and need to regain composure...",
    color: "text-purple-500 border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10",
  },
];

interface ChatEmptyStateProps {
  onPromptClick?: (prompt: string) => void;
}

export function ChatEmptyState({ onPromptClick }: ChatEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col items-center justify-center px-4 py-12"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <Image
          src="/logo-simple.svg"
          alt="Privy"
          width={48}
          height={48}
          className="opacity-60"
        />
      </motion.div>

      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8 max-w-md text-center"
      >
        <h2 className="mb-2 font-semibold text-2xl">Welcome to Privy</h2>
        <p className="text-muted-foreground">
          Your private mental performance coach. Think out loud, make better
          decisions, stay sharp.
        </p>
      </motion.div>

      {/* Suggested Prompts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid w-full max-w-2xl gap-3 md:grid-cols-3"
      >
        {suggestedPrompts.map((item, index) => (
          <motion.button
            key={item.mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            onClick={() => onPromptClick?.(item.prompt)}
            className={`group relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all ${item.color}`}
            type="button"
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <span className="font-medium text-sm">{item.mode}</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {item.prompt}
            </p>
          </motion.button>
        ))}
      </motion.div>

      {/* Privacy Reminder */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 max-w-md text-center text-muted-foreground text-xs"
      >
        Zero-trust privacy • Your token = your identity • Burn sessions anytime
      </motion.p>
    </motion.div>
  );
}
