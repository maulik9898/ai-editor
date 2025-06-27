import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { UIMessage } from "ai";

type ScrollBehavior = "auto" | "smooth" | "instant";

// Debounce utility
function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay],
  ) as T;
}

export function useChatScrollManager(
  chatId: string | undefined,
  status: "idle" | "submitted" | "streaming" | "error" | "ready",
  messages: UIMessage[],
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [lastChatId, setLastChatId] = useState(chatId);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const endElement = endRef.current;
    if (endElement) {
      endElement.scrollIntoView({
        behavior: behavior === "auto" ? "auto" : behavior,
        block: "end",
        inline: "nearest",
      });
    }
  }, []);

  // Debounced scroll function to prevent excessive scrolling
  const debouncedScrollToBottom = useDebounce(scrollToBottom, 50);

  // Use an IntersectionObserver to track if the endRef is visible
  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;
    if (!container || !end) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsAtBottom(entry.isIntersecting);
      },
      {
        root: container,
        rootMargin: "0px 0px -30px 0px", // Trigger when 10px from the bottom
        threshold: 0,
      },
    );

    observer.observe(end);
    return () => observer.disconnect();
  }, [containerRef, endRef]);

  // Reset state when the chat ID changes
  useEffect(() => {
    if (chatId !== lastChatId) {
      setHasSentMessage(false);
      setLastChatId(chatId);
      setTimeout(() => scrollToBottom("instant"), 100);
    }
  }, [chatId, lastChatId]);

  // Track when the first message is sent
  useEffect(() => {
    if (status === "submitted") {
      setHasSentMessage(true);
    }
  }, [status]);

  // Track message count changes
  useEffect(() => {
    if (messages.length !== lastMessageCount) {
      setLastMessageCount(messages.length);
    }
  }, [messages.length, lastMessageCount]);

  // Auto-scroll logic
  useEffect(() => {
    // Auto-scroll when submitting a new message
    if (status === "submitted") {
      scrollToBottom("smooth");
      return;
    }

    // Auto-scroll during streaming if user is at bottom
    if (status === "streaming" && isAtBottom) {
      debouncedScrollToBottom("smooth");
      return;
    }

    // Auto-scroll when new messages arrive while user is at bottom
    if (isAtBottom && messages.length > lastMessageCount) {
      scrollToBottom("smooth");
    }
  }, [
    status,
    messages.length,
    lastMessageCount,
    isAtBottom,
    scrollToBottom,
    debouncedScrollToBottom,
  ]);

  const showScrollToBottomButton = !isAtBottom && hasSentMessage;

  return useMemo(
    () => ({
      containerRef,
      endRef,
      scrollToBottom,
      showScrollToBottomButton,
    }),
    [containerRef, endRef, scrollToBottom, showScrollToBottomButton],
  );
}
