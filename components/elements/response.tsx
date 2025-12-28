"use client";

import { type ComponentProps, memo, useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

type ResponseProps = ComponentProps<typeof Streamdown> & {
  isStreaming?: boolean;
};

/**
 * Cascading text renderer - reveals characters progressively for smooth animation.
 * Displays 3-8 characters per frame at 60fps, creating a typewriter effect.
 */
const CascadeText = memo(
  ({ text, className }: { text: string; className?: string }) => {
    const [displayedLength, setDisplayedLength] = useState(0);
    const animationRef = useRef<number | null>(null);
    const lastTimeRef = useRef(0);

    useEffect(() => {
      if (displayedLength >= text.length) return;

      const animate = (timestamp: number) => {
        // Throttle to ~60fps
        if (timestamp - lastTimeRef.current >= 16) {
          lastTimeRef.current = timestamp;
          setDisplayedLength((prev) => {
            const remaining = text.length - prev;
            // Accelerate when behind, slow when caught up
            const charsToAdd = Math.min(Math.max(3, remaining / 10), 8);
            return Math.min(prev + charsToAdd, text.length);
          });
        }
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }, [text, displayedLength]);

    // Reset on new message
    useEffect(() => {
      if (text.length < displayedLength) setDisplayedLength(0);
    }, [text, displayedLength]);

    return (
      <span className={cn("whitespace-pre-wrap", className)}>
        {text.slice(0, displayedLength)}
        {displayedLength < text.length && (
          <span className="inline-block h-4 w-0.5 animate-pulse bg-foreground/60" />
        )}
      </span>
    );
  }
);
CascadeText.displayName = "CascadeText";

export const Response = memo(
  ({ className, isStreaming = false, children, ...props }: ResponseProps) => {
    const text = typeof children === "string" ? children : "";

    // During streaming: use CascadeText for smooth character animation
    if (isStreaming && text) {
      return (
        <div
          className={cn(
            "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
            className
          )}
        >
          <CascadeText className="text-foreground" text={text} />
        </div>
      );
    }

    // After streaming: use Streamdown for proper markdown rendering
    return (
      <Streamdown
        className={cn(
          "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto",
          className
        )}
        mode="static"
        {...props}
      >
        {children}
      </Streamdown>
    );
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.isStreaming === nextProps.isStreaming
);

Response.displayName = "Response";
