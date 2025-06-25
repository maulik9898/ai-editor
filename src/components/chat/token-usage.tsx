"use client";

import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

interface TokenUsageProps {
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export function TokenUsage({ usage }: TokenUsageProps) {
  if (!usage) return null;

  const formatter = Intl.NumberFormat('en', { notation: 'compact' });
  const formattedTokens = formatter.format(usage.totalTokens);

  return (
    <div className="flex items-center gap-2">
      <Zap className="h-3 w-3 text-blue-600" />
      <Badge variant="secondary" className="text-xs">
        {formattedTokens} tokens
      </Badge>
    </div>
  );
}
