"use client";

import { memo } from "react";
import remarkGfm from "remark-gfm";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";
import { defaultComponents } from "../markdown/default-components";
import { MarkdownWrapper } from "../markdown";

interface AssistantMessageProps {
  message: string;
  isLoading: boolean;
  className?: string;
}

const useCopyToClipboard = ({
  copiedDuration = 3000,
}: {
  copiedDuration?: number;
} = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = (value: string) => {
    if (!value) return;

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), copiedDuration);
    });
  };

  return { isCopied, copyToClipboard };
};

const CodeHeader = ({
  language,
  code,
}: {
  language?: string;
  code?: string;
}) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const onCopy = () => {
    if (!code || isCopied) return;
    copyToClipboard(code);
  };

  return (
    <div className="flex items-center justify-between gap-4 mt-4 rounded-t-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
      <span className="lowercase">{language || "text"}</span>
      <button
        onClick={onCopy}
        className="flex items-center justify-center w-6 h-6 rounded hover:bg-zinc-700 transition-colors"
      >
        {!isCopied ? (
          <CopyIcon className="w-4 h-4" />
        ) : (
          <CheckIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

function AssistantMessageComponent({
  message,
  isLoading,
  className,
}: AssistantMessageProps) {
  return (
    <div className={className}>
      <div className="rounded-lg max-w-[90%]">
        <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          <MarkdownWrapper>{message}</MarkdownWrapper>
        </div>
      </div>
    </div>
  );
}

export const AssistantMessage = memo(
  AssistantMessageComponent,
  (prev, next) => {
    // Only re-render if message content or loading state changes
    return prev.message === next.message && prev.isLoading === next.isLoading;
  },
);
