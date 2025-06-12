"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Zap, X } from "lucide-react";

interface StreamingRepairViewProps {
  isStreaming: boolean;
  streamedContent: string;
  onCancel?: () => void;
}

export function StreamingRepairView({
  isStreaming,
  streamedContent,
  onCancel,
}: StreamingRepairViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as content streams
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamedContent]);

  if (!isStreaming && !streamedContent) {
    return null;
  }

  return (
    <div className="border rounded-lg bg-background">
      {/* Header */}
      <div className="border-b p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isStreaming && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          )}
          <Zap className="h-4 w-4 text-blue-600" />
          <span className="font-medium">AI JSON Repair</span>
          {isStreaming && (
            <Badge variant="secondary" className="text-xs">
              Streaming...
            </Badge>
          )}
        </div>

        {isStreaming && onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Streaming Content */}
      <div ref={scrollRef} className="p-4 max-h-96 overflow-y-auto">
        <pre className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">
          {streamedContent}
          {isStreaming && <span className="animate-pulse">|</span>}
        </pre>
      </div>

      {/* Status */}
      <div className="border-t p-2 text-xs text-muted-foreground">
        {isStreaming ? (
          <span>AI is generating repair instructions...</span>
        ) : (
          <span>Response complete. Processing edits...</span>
        )}
      </div>
    </div>
  );
}
