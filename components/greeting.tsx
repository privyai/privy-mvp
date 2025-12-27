import { motion } from "framer-motion";
import Image from "next/image";
import { MessageCircle, Lightbulb, Sparkles } from "lucide-react";

const modes = [
  {
    name: "Vent",
    icon: MessageCircle,
    description: "Process emotional weight safely, then extract the signal",
    color: "text-orange-500",
  },
  {
    name: "Decision Lab",
    icon: Lightbulb,
    description: "Map tradeoffs, constraints, risks, and next steps",
    color: "text-blue-500",
  },
  {
    name: "Reframe & Reset",
    icon: Sparkles,
    description: "Shift perspective, regain composure, re-enter execution mode",
    color: "text-purple-500",
  },
];

export const Greeting = () => {
  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8"
      key="overview"
    >
      {/* Logo */}
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="mb-4 flex justify-center"
        exit={{ opacity: 0, scale: 0.9 }}
        initial={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: 0.3 }}
      >
        <Image
          src="/logo-simple.svg"
          alt="Privy"
          width={40}
          height={40}
          className="opacity-60"
        />
      </motion.div>

      {/* Welcome Message */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-1 text-center font-semibold text-lg md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.4 }}
      >
        Welcome to Privy.
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center text-muted-foreground text-base md:text-xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        What's on your mind?
      </motion.div>

      {/* Privacy Footer moved here for mobile */}
      <motion.p
        animate={{ opacity: 1 }}
        className="mb-4 text-center text-muted-foreground text-[10px] md:text-xs"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        transition={{ delay: 0.55 }}
      >
        Zero-trust privacy • Your token = your identity • Burn sessions anytime
      </motion.p>

      {/* Coaching Modes */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-3 md:grid-cols-3"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        {modes.map((mode, index) => (
          <motion.div
            key={mode.name}
            animate={{ opacity: 1, y: 0 }}
            className="group rounded-lg border bg-card p-3 transition-colors hover:border-primary/20 hover:bg-accent/50"
            exit={{ opacity: 0, y: 10 }}
            initial={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.7 + index * 0.1 }}
          >
            <div className="mb-2 flex items-center gap-2">
              <mode.icon className={`h-4 w-4 ${mode.color}`} />
              <h3 className="font-medium text-sm">{mode.name}</h3>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {mode.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
