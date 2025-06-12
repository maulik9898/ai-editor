"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  language?: string;
}

export function CodeBlock({ children, className, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (typeof children === "string") {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-4 border  rounded-xl bg-muted/20 shadow-sm">
      {/* Language badge and copy button */}
      <div className="flex items-center justify-between p-1">
        {language && (
          <span className="text-xs text-muted-foreground px-2 py-1  font-mono">
            {language}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-2"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Code content */}
      <pre
        className={cn(
          "overflow-x-auto border-t p-4 border-border/30 bg-background/50",
          className,
        )}
      >
        <code className="font-mono text-sm leading-relaxed">{children}</code>
      </pre>
    </div>
  );
}
