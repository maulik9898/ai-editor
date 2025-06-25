"use client";

import { Markdown } from "../markdown/markdown";

interface AssistantMessageProps {
  message: string;
  className?: string;
}

export function AssistantMessage({
  message,
  className,
}: AssistantMessageProps) {
  return (
    <div className={className}>
      <div className="rounded-lg max-w-[90%] ">
        <Markdown content={message} />
      </div>
    </div>
  );
}
