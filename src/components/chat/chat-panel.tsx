"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { MessageCircle, RotateCcw, Settings, X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useEditorStore } from "@/stores/editor-store";
import { useKnowledgeBase } from "@/contexts/knowledge-base-context";
import { KnowledgeBaseSettingsModal } from "./knowledge-base-settings-modal";
import {
  getAllAdditionalInstructions,
  getClientToolHandlers,
  getToolRenderer,
  ToolName,
  toolRegistry,
} from "@/tools/registry";
import { Checkbox } from "../ui/checkbox";
import { TokenUsage } from "./token-usage";
import { TokenUsageData } from "@/types/token-usage";
import { ChatInput } from "./chat-input";
import { AssistantMessage } from "./assistant-message";

export function ChatPanel() {
  const files = useEditorStore((state) => state.files);
  const activeTab = useEditorStore((state) => {
    return state.tabs.find((t) => t.id === state.activeTabId) || null;
  });
  const activeFile = useEditorStore((state) => {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    return tab ? state.files[tab.filePath] || null : null;
  });
  const { knowledgeBase } = useKnowledgeBase();
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);
  const [enabledTools, setEnabledTools] = useState<ToolName[]>([
    "diagnose_letsform_schema",
    "query_json_path",
    "suggest_json_patch",
    "repair_json",
  ]);

  const handleToolToggle = useCallback(
    (toolName: ToolName, enabled: boolean) => {
      setEnabledTools((prev) =>
        enabled
          ? [...prev, toolName]
          : prev.filter((tool) => tool !== toolName),
      );
    },
    [],
  );

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  const clientToolHandlers = useMemo(() => getClientToolHandlers(), []);
  const additionalToolInstructions = useMemo(
    () => getAllAdditionalInstructions(enabledTools),
    [enabledTools],
  );

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    stop,
    setMessages,
    addToolResult,
    data,
    setData,
  } = useChat({
    maxSteps: 10,
    body: {
      enabledTools,
      systemPrompt: `You are an expert JSON analysis assistant specializing in efficient data discovery and modification using JSONPath queries and JSON Patch operations. You help user make modification in JSON file based on user context and user request.

      **BE DIRECT AND CONVERSATIONAL**: Use natural language as if speaking to a colleague. Get straight to analysis without preambles like "I'll help you analyze..." Just start working.

      **REFERENCE USER CONTEXT FIRST**: Always check the user context above for Let's Form patterns, schema, and component structures before making any queries. This context contains critical information about the JSON structure you're analyzing.

      **BATCH RELATED QUERIES**: Group all related information needs into a single tool call. Never make multiple calls when one comprehensive call would suffice.

      **ALWAYS FOLLOW BEST PRACTICES WHEN CALLING TOOLS**: This is very important - use tools efficiently, provide clear parameters, and ensure each tool call serves a specific purpose that advances the user's goals.

      Always include clear descriptions of what changes you're making and why.

      ## Working Style

      1. **Check user context** for Let's Form documentation and patterns
      2. **Ask specific questions** if you need clarification about requirements
      3. **Explain your approach** before executing queries or patches
      4. **Present findings clearly** with actionable insights
      5. **Suggest improvements** when you spot optimization opportunities
      6. **Use markdown formatting** - Format your responses using markdown for better readability and structure
      7. **Deliver engineering-quality output** with concise, useful information - avoid unnecessary elaboration and stay focused on the task at hand
      8. **Use one tool per chat** - Never call multiple tools in a single response. Execute one tool at a time and wait for results before proceeding
      Remember: You're here to collaborate efficiently. Work with the user's context, get the data you need in one go, analyze immediately, and provide clear, actionable results.

      <tools_instructions>

      ${additionalToolInstructions}

      </tools_instructions>

      <user_context>

      <editor_context>
      ### Currently Working File: ${activeFile?.path}

      ### All Open Files:
      ${JSON.stringify(
        Object.values(files).map((file) => ({
          name: file.name,
          language: file.language,
          isDirty: file.isDirty,
        })),
      )}
      </editor_context>
      <knowledge_base>
      ${knowledgeBase}
      </knowledge_base>

      </user_context>
      `,
    },
    async onToolCall({ toolCall }) {
      const handler = clientToolHandlers[toolCall.toolName];
      if (handler) {
        // Auto-execute tool
        const result = await handler(toolCall.args);
        console.log(`Auto-executed ${toolCall.toolName}:`, result);
        return result;
      }

      // No handler = interactive tool, wait for addToolResult
      console.log(
        `Interactive tool ${toolCall.toolName} - waiting for user interaction`,
      );
      return undefined;
    },
  });

  const tokenUsage = useMemo(() => {
    if (!data) return undefined;
    const tokenEntries = data.filter(
      (item: any) => item.type === "token_usage",
    );
    if (tokenEntries.length === 0) return undefined;

    // Get the last (most recent) token usage entry
    const latestTokenData = tokenEntries[tokenEntries.length - 1];
    console.log(latestTokenData);
    // @ts-expect-error type
    return (latestTokenData as TokenUsageData | undefined)?.usage;
  }, [data]);

  const isChatLoading = status === "submitted" || status === "streaming";

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const checkIfUserNearBottom = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const threshold = 100;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold;
    setIsUserNearBottom(isNearBottom);
  };

  const resetChat = () => {
    if (isChatLoading) {
      stop();
    }
    setMessages([]);
    setData(undefined);
    setIsUserNearBottom(true);
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Beta
          </span>
          <TokenUsage usage={tokenUsage} />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={resetChat}
            title="Reset chat history"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <KnowledgeBaseSettingsModal />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowSettings(!showSettings)}
            title="Chat settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <ThemeToggle variant="button" size="sm" className="h-8 w-8 p-0" />
        </div>
      </div>

      {/* Settings Panel (if shown) */}
      {showSettings && (
        <div className="p-4 border-b border-border bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Available Tools</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowSettings(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-3">
            {Object.entries(toolRegistry).map(([toolName, toolDef]) => {
              const isEnabled = enabledTools.includes(toolName as ToolName);
              return (
                <div key={toolName} className="flex items-start space-x-3">
                  <Checkbox
                    id={toolName}
                    checked={isEnabled}
                    onCheckedChange={(checked) =>
                      handleToolToggle(toolName as ToolName, checked as boolean)
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={toolName}
                      className="text-xs font-medium cursor-pointer block"
                    >
                      {toolDef.displayName}{" "}
                      {/* ✅ Use displayName from tool definition */}
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {toolDef.uiDescription}{" "}
                      {/* ✅ Use uiDescription from tool definition */}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="text-xs text-muted-foreground">
              {enabledTools.length} of {Object.keys(toolRegistry).length} tools
              enabled
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 border-b border-border bg-destructive/10 text-destructive">
          <div className="text-sm">Error: {error.message}</div>
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4"
        onScroll={checkIfUserNearBottom}
      >
        {messages.length === 0 &&
          !isChatLoading && ( // Added !isChatLoading
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                Welcome to AI Assistant
              </p>

            </div>
          )}
        {messages.map((message) => (
          <div
            key={message.id}
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
                          className={`rounded-lg text-xs py-2 px-2 inline-block ${message.role === "user"
                            ? "bg-primary text-primary-foreground max-w-[90%] self-end"
                            : "max-w-[90%]"
                            }`}
                        >
                          {message.role === "assistant" ? (
                            // Use react-markdown for assistant text
                            <AssistantMessage message={part.text} className="" />
                          ) : (
                            // Plain text for user messages
                            part.text
                          )}
                        </div>
                        {/* Copy button - below the message, aligned based on message type */}
                        <div className={` ${message.role === "user" ? "text-right mt-1" : "text-left"}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-muted rounded-sm"
                            onClick={() => copyToClipboard(part.text)}
                            title="Copy message"
                          >
                            <Copy className="h-2 w-2" />
                          </Button>
                        </div>
                      </div>
                    );

                  case "tool-invocation": {
                    const renderer = getToolRenderer(
                      part.toolInvocation.toolName,
                    );
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
        ))}

        {/* Loading indicator when AI is responding */}
        {isChatLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground animate-bounce">
                  ...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className=" p-4">
        <ChatInput
          value={input}
          onChange={handleInputChange}
          onSubmit={(value) => {
            const event = { preventDefault: () => { } };
            handleSubmit(event);
          }}
          onStop={stop}
          disabled={isChatLoading}
          placeholder="Type your message..."
        />
      </div>
    </div>
  );
}
