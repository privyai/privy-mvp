"use client";

import { motion } from "framer-motion";
import { ChevronDown, Lock, Hash, Trash2, Eye, EyeOff, Server } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FlowStep {
  step: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  technical: string;
  details: string[];
  color: string;
}

export function PrivacyFlowDiagram() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const steps: FlowStep[] = [
    {
      step: 1,
      title: "Your Browser",
      subtitle: "Token Generation",
      icon: <Lock className="h-5 w-5" />,
      technical: "crypto.getRandomValues(32 bytes)",
      details: [
        "256-bit entropy (2^256 possible tokens)",
        "Generated using Web Crypto API",
        "Stored only in sessionStorage",
        "Clears when you close browser",
      ],
      color: "text-green-500 border-green-500/20 bg-green-500/5",
    },
    {
      step: 2,
      title: "Our Server",
      subtitle: "One-Way Hash Only",
      icon: <Hash className="h-5 w-5" />,
      technical: "SHA-256(token) → 8f7e2d9c...",
      details: [
        "Server never sees your token",
        "Only stores SHA-256 hash",
        "Cannot reverse hash to token",
        "Even we can't recover lost tokens",
      ],
      color: "text-blue-500 border-blue-500/20 bg-blue-500/5",
    },
    {
      step: 3,
      title: "Your Data",
      subtitle: "Linked, Hashed & Encrypted",
      icon: <Server className="h-5 w-5" />,
      technical: "EU/CH • Encrypted DB • RLS enforced",
      details: [
        "Linked to hash only (not to you)",
        "Encrypted database — no one can see it",
        "Row-level security (RLS) enforced",
        "Servers in EU/Switzerland only",
      ],
      color: "text-purple-500 border-purple-500/20 bg-purple-500/5",
    },
  ];

  const guarantees = [
    { icon: <EyeOff className="h-4 w-4" />, text: "Zero personal information" },
    { icon: <Lock className="h-4 w-4" />, text: "One-way cryptography" },
    { icon: <Trash2 className="h-4 w-4" />, text: "True deletion (burn account)" },
    { icon: <Eye className="h-4 w-4" />, text: "Stateless AI (no memory)" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="text-sm">
          Zero-Trust Architecture
        </Badge>
        <h2 className="font-bold text-3xl md:text-4xl">
          How We Guarantee Your Privacy
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Your identity is a random token. We only store its hash. Even we can't trace it back to you.
        </p>
      </div>

      {/* Flow Diagram */}
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-0 right-0 top-20 h-px bg-border hidden md:block" />

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.15 }}
              className="relative"
            >
              {/* Timeline Dot */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-10 hidden md:block">
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  className={cn(
                    "h-10 w-10 rounded-full border-4 border-background flex items-center justify-center",
                    step.color
                  )}
                >
                  {step.icon}
                </motion.div>
              </div>

              {/* Card */}
              <Card
                className={cn(
                  "mt-8 cursor-pointer transition-all duration-300 hover:shadow-lg",
                  expandedStep === step.step && "ring-2 ring-primary"
                )}
                onClick={() =>
                  setExpandedStep(expandedStep === step.step ? null : step.step)
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2 mb-1">
                        <span className="md:hidden">{step.icon}</span>
                        {step.title}
                      </CardTitle>
                      <CardDescription>{step.subtitle}</CardDescription>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedStep === step.step ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Technical Preview */}
                  <div className={cn(
                    "rounded-md border p-3 font-mono text-xs",
                    step.color
                  )}>
                    <code>{step.technical}</code>
                  </div>

                  {/* Expandable Details */}
                  <motion.div
                    initial={false}
                    animate={{
                      height: expandedStep === step.step ? "auto" : 0,
                      opacity: expandedStep === step.step ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <ul className="space-y-2 pt-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span className="text-muted-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Privacy Guarantees Footer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {guarantees.map((guarantee, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-2 text-sm"
              >
                <div className="text-primary">{guarantee.icon}</div>
                <span className="text-muted-foreground">{guarantee.text}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1 }}
        className="text-center text-xs text-muted-foreground border-t pt-6"
      >
        <p className="font-mono">
          Lost your token? We genuinely can't help — that's the point.
        </p>
      </motion.div>
    </div>
  );
}
