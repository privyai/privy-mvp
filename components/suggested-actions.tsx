"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const suggestedActions = [
    "I need to vent about a frustrating situation at work...",
    "Help me decide between two career options I'm considering",
    "I'm stuck in negative thinking about a recent failure",
    "I want to reframe how I see a challenging relationship",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate suggestions every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % suggestedActions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [suggestedActions.length]);

  const currentSuggestion = suggestedActions[currentIndex];

  return (
    <div
      className="flex w-full justify-center"
      data-testid="suggested-actions"
    >
      <AnimatePresence mode="wait">
        <motion.button
          key={currentIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            window.history.pushState({}, "", `/chat/${chatId}`);
            sendMessage({
              role: "user",
              parts: [{ type: "text", text: currentSuggestion }],
            });
          }}
          className="flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-4 py-2 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
          type="button"
        >
          <Sparkles className="h-3 w-3 shrink-0" />
          <span className="text-center">
            {currentSuggestion}
          </span>
        </motion.button>
      </AnimatePresence>
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
