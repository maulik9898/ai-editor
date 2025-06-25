"use client";

import { cn } from "@/lib/utils";

interface InlineCodeProps {
  children: React.ReactNode;
  className?: string;
}

export function InlineCode({ children, className }: InlineCodeProps) {
  return (
    <code
      className={cn(
        // Base styling
        "relative p-0.5 inline-flex items-center px-0.5 rounded-md text-xs font-mono",
        // Theme colors to match Monaco Editor
        "bg-muted/60 text-foreground border border-border/50",

        // Typography
        " tracking-tight",
        // Prevent line breaks in inline code
        "whitespace-nowrap",
        className,
      )}
    >
      {children}
    </code>
  );
}
