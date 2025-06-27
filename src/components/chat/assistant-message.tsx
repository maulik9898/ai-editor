"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
        {isLoading ? (
          // Plain text rendering during streaming for performance
          <div className="prose prose-sm max-w-none whitespace-pre-wrap [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {message}
          </div>
        ) : (
          // Rich markdown rendering after completion
          <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ className, ...props }) => (
                  <h1
                    className={cn(
                      "mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight last:mb-0",
                      className,
                    )}
                    {...props}
                  />
                ),
                h2: ({ className, ...props }) => (
                  <h2
                    className={cn(
                      "mb-4 mt-8 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 last:mb-0",
                      className,
                    )}
                    {...props}
                  />
                ),
                h3: ({ className, ...props }) => (
                  <h3
                    className={cn(
                      "mb-4 mt-6 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0 last:mb-0",
                      className,
                    )}
                    {...props}
                  />
                ),
                h4: ({ className, ...props }) => (
                  <h4
                    className={cn(
                      "mb-4 mt-6 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0 last:mb-0",
                      className,
                    )}
                    {...props}
                  />
                ),
                h5: ({ className, ...props }) => (
                  <h5
                    className={cn(
                      "my-4 text-lg font-semibold first:mt-0 last:mb-0",
                      className,
                    )}
                    {...props}
                  />
                ),
                h6: ({ className, ...props }) => (
                  <h6
                    className={cn(
                      "my-4 font-semibold first:mt-0 last:mb-0",
                      className,
                    )}
                    {...props}
                  />
                ),
                p: ({ className, ...props }) => (
                  <p
                    className={cn(
                      "mb-5 mt-5 leading-7 first:mt-0 last:mb-0",
                      className,
                    )}
                    {...props}
                  />
                ),
                a: ({ className, ...props }) => (
                  <a
                    className={cn(
                      "text-primary font-medium underline underline-offset-4",
                      className,
                    )}
                    {...props}
                  />
                ),
                blockquote: ({ className, ...props }) => (
                  <blockquote
                    className={cn("border-l-2 pl-6 italic", className)}
                    {...props}
                  />
                ),
                ul: ({ className, ...props }) => (
                  <ul
                    className={cn("my-5 ml-6 list-disc [&>li]:mt-2", className)}
                    {...props}
                  />
                ),
                ol: ({ className, ...props }) => (
                  <ol
                    className={cn(
                      "my-5 ml-6 list-decimal [&>li]:mt-2",
                      className,
                    )}
                    {...props}
                  />
                ),
                hr: ({ className, ...props }) => (
                  <hr className={cn("my-5 border-b", className)} {...props} />
                ),
                table: ({ className, ...props }) => (
                  <table
                    className={cn(
                      "my-5 w-full border-separate border-spacing-0 overflow-y-auto",
                      className,
                    )}
                    {...props}
                  />
                ),
                th: ({ className, ...props }) => (
                  <th
                    className={cn(
                      "bg-muted px-4 py-2 text-left font-bold first:rounded-tl-lg last:rounded-tr-lg [&[align=center]]:text-center [&[align=right]]:text-right",
                      className,
                    )}
                    {...props}
                  />
                ),
                td: ({ className, ...props }) => (
                  <td
                    className={cn(
                      "border-b border-l px-4 py-2 text-left last:border-r [&[align=center]]:text-center [&[align=right]]:text-right",
                      className,
                    )}
                    {...props}
                  />
                ),
                tr: ({ className, ...props }) => (
                  <tr
                    className={cn(
                      "m-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg",
                      className,
                    )}
                    {...props}
                  />
                ),
                pre: ({ children, ...props }) => {
                  const codeElement = children?.toString() || "";
                  const match = /language-(\w+)/.exec(props.className || "");
                  const language = match?.[1];

                  return (
                    <div className="my-5">
                      <CodeHeader language={language} code={codeElement} />
                      <pre
                        className={cn(
                          "overflow-x-auto rounded-b-lg !rounded-t-none bg-black p-4 text-white",
                          props.className,
                        )}
                        {...props}
                      >
                        {children}
                      </pre>
                    </div>
                  );
                },
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const isCodeBlock = match;

                  if (isCodeBlock) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }

                  return (
                    <code
                      className={cn(
                        "bg-muted rounded border font-semibold px-1 py-0.5",
                        className,
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message}
            </ReactMarkdown>
          </div>
        )}
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
