"use client";

import { memo } from "react";
import type { UIMessage } from "ai";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssistantMessage } from "./assistant-message";
import { getToolRenderer } from "@/tools/registry";
import equal from "fast-deep-equal";

interface MessageProps {
  message: UIMessage;
  isLoading: boolean;
  onCopyToClipboard: (text: string) => void;
  addToolResult: any;
}

function PureMessage({
  message,
  isLoading,
  onCopyToClipboard,
  addToolResult,
}: MessageProps) {
  return (
    <div
      className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={
          message.role === "user" ? "flex justify-end w-full" : "w-full"
        }
      >
        {/* Handle message parts */}
        {message.parts?.map((part, index) => {
          switch (part.type) {
            case "text":
              return (
                <div key={index} className="group flex flex-col w-full">
                  <div
                    className={`rounded-lg text-sm py-2 px-2 inline-block ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground max-w-[90%] self-end"
                        : "max-w-[90%]"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <AssistantMessage
                        message={part.text}
                        isLoading={isLoading}
                        className=""
                      />
                    ) : (
                      part.text
                    )}
                  </div>
                  {/* Copy button - below the message, aligned based on message type */}
                  <div
                    className={` ${message.role === "user" ? "text-right mt-1" : "text-left"}`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-muted rounded-sm"
                      onClick={() => onCopyToClipboard(part.text)}
                      title="Copy message"
                    >
                      <Copy className="h-2 w-2" />
                    </Button>
                  </div>
                </div>
              );

            case "tool-invocation": {
              const renderer = getToolRenderer(part.toolInvocation.toolName);
              return renderer ? (
                <div key={index} className="w-full my-2">
                  {renderer(part.toolInvocation, addToolResult)}
                </div>
              ) : (
                <div
                  key={index}
                  className="w-full text-muted-foreground italic"
                >
                  Tool "{part.toolInvocation.toolName}" executed
                </div>
              );
            }

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

export const Message = memo(PureMessage);
