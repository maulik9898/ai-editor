"use client";

import { memo, useMemo } from "react";
import type { UIMessage } from "ai";
import { MessageCircle } from "lucide-react";
import { Message } from "./message";

import equal from "fast-deep-equal";

interface MessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
  onCopyToClipboard: (text: string) => void;
  addToolResult: any;
  endRef?: React.RefObject<HTMLDivElement | null>;
}

function PureMessages({
  messages,
  isLoading,
  onCopyToClipboard,
  addToolResult,
  endRef,
}: MessagesProps) {
  // Memoize empty state to prevent unnecessary re-renders
  const emptyState = useMemo(() => {
    if (messages.length === 0 && !isLoading) {
      return (
        <div className="text-center text-muted-foreground py-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Welcome to AI Assistant</p>
          <p className="text-sm opacity-75">
            Start a conversation to analyze and modify your JSON files
          </p>
        </div>
      );
    }
    return null;
  }, [messages.length, isLoading]);

  // Memoize loading indicator
  const loadingIndicator = useMemo(() => {
    if (!isLoading) return null;

    return (
      <div className="flex justify-start animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
        <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:0.4s]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [isLoading]);

  // Memoize rendered messages with staggered animation
  const renderedMessages = useMemo(() => {
    return messages.map((message, index) => {
      const isLastMessage = index === messages.length - 1;
      const isMessageLoading = isLastMessage && isLoading;

      return (
        <div
          key={message.id}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
          style={{
            animationDelay: `${Math.min(index * 50, 300)}ms`,
          }}
        >
          <Message
            message={message}
            isLoading={isMessageLoading}
            onCopyToClipboard={onCopyToClipboard}
            addToolResult={addToolResult}
          />
        </div>
      );
    });
  }, [messages, onCopyToClipboard, addToolResult, isLoading]);

  // Render the scroll anchor element
  const scrollAnchor = useMemo(() => {
    if (!endRef) return null;

    return (
      <div
        ref={endRef}
        className="shrink-0 min-w-[24px] min-h-[24px] animate-in fade-in-0 duration-100"
      />
    );
  }, [endRef]);

  return (
    <div className="space-y-4">
      {emptyState}
      {renderedMessages}
      {loadingIndicator}
      {scrollAnchor}
    </div>
  );
}

// Optimized memo comparison function
export const Messages = memo(PureMessages);

// Set display name for debugging
Messages.displayName = "Messages";
