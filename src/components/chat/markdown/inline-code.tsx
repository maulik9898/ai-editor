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
        "relative inline-flex items-center px-1.5 py-0.5 rounded-md text-sm font-mono",
        // Theme colors to match Monaco Editor
        "bg-muted/60 text-foreground border border-border/50",

        // Typography
        "font-medium tracking-tight",
        // Prevent line breaks in inline code
        "whitespace-nowrap",
        className,
      )}
    >
      {children}
    </code>
  );
}
