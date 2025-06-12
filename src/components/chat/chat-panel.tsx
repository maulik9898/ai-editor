"use client";

import { MessageCircle, RotateCcw, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  useCopilotAction,
  useCopilotChat,
  useCopilotReadable,
} from "@copilotkit/react-core";
import { CopilotChat, CopilotKitCSSProperties } from "@copilotkit/react-ui";
import { useEffect, useState } from "react";
import { useEditorContext } from "@/contexts/editor-context";
import { useKnowledgeBase } from "@/contexts/knowledge-base-context";
import { customMarkdownComponents } from "@/components/chat/markdown/markdown-components";
import { useJSONPatchTool } from "./json-patch/json-patch-tool";
import { useJSONPathTool } from "./json-path/json-path-tool";
import { useLetsFormDiagnostic } from "./letsform-diagnostic/letsform-diagnostic-tool";
import { KnowledgeBaseSettingsModal } from "./knowledge-base-settings-modal";

import letsFormMantineSchema from "@/schema/lets-form-mantine.json";
import { useJSONRepairTool } from "./json-repair/json-repair-tool";

export function ChatPanel() {
  const { state, activeTab } = useEditorContext();
  const { knowledgeBase } = useKnowledgeBase();
  const [showSettings, setShowSettings] = useState(false);
  const { reset } = useCopilotChat();
  const activeFile = activeTab ? state.files[activeTab.filePath] : null;

  useJSONPatchTool();
  useJSONPathTool();
  useLetsFormDiagnostic();
  useJSONRepairTool();

  // Make current file content readable to AI
  useCopilotReadable({
    description: `Currently Working File: ${activeFile?.path}`,
    value: "Use query tools to extract data from the file",
  });

  // Make all files readable to AI for context
  useCopilotReadable({
    description: "All open files in the editor",
    value: Object.values(state.files).map((file) => ({
      name: file.name,
      language: file.language,
      isDirty: file.isDirty,
    })),
  });

  // Make knowledge base content readable to AI
  useCopilotReadable({
    description: "",
    value: knowledgeBase || null,
  });

  // useCopilotReadable({
  //   available: "disabled",
  //   description:
  //     "Valid Letsform JSON Schema. You must follow this Schema to ensure json is valid.",
  //   value: null,
  // });

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">AI Assistant</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={reset}
            title="Clear chat history"
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
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Chat Settings</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowSettings(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>• Active File: {activeFile?.name || "None"}</p>
            <p>• Total Files: {Object.keys(state.files).length}</p>
            <p>
              • Knowledge Base:{" "}
              {knowledgeBase ? `${knowledgeBase.length} chars` : "Not set"}
            </p>
            <p>• AI can see all file contents and knowledge base for context</p>
          </div>
        </div>
      )}

      {/* CopilotKit Chat Component */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0">
          <CopilotChat
            labels={{
              title: "AI File Editor",
            }}
            makeSystemMessage={(context, additionalInstructions) => {
              const prompt = `
                You are an expert JSON analysis assistant specializing in efficient data discovery and modification using JSONPath queries and JSON Patch operations. You help user make modification in JSON file based on user context and user request.

                ## User Context

                ${context}

                ## Core Behavior

                **BE DIRECT AND CONVERSATIONAL**: Use natural language as if speaking to a colleague. Get straight to analysis without preambles like "I'll help you analyze..." Just start working.

                **REFERENCE USER CONTEXT FIRST**: Always check the user context above for Let's Form patterns, schema, and component structures before making any queries. This context contains critical information about the JSON structure you're analyzing.

                **BATCH RELATED QUERIES**: Group all related information needs into a single tool call. Never make multiple calls when one comprehensive call would suffice.

                ## Available Tools and Best Practices

               ${additionalInstructions}

               ## Tool End

                Always include clear descriptions of what changes you're making and why.

                ## Working Style

                1. **Check user context** for Let's Form documentation and patterns
                2. **Ask specific questions** if you need clarification about requirements
                3. **Explain your approach** before executing queries or patches
                4. **Present findings clearly** with actionable insights
                5. **Suggest improvements** when you spot optimization opportunities
                6. **Deliver engineering-quality output** with concise, useful information - avoid unnecessary elaboration and stay focused on the task at hand
                7. **Use one tool per chat** - Never call multiple tools in a single response. Execute one tool at a time and wait for results before proceeding
                Remember: You're here to collaborate efficiently. Work with the user's context, get the data you need in one go, analyze immediately, and provide clear, actionable results. `;
              return prompt;
            }}
            className="h-full w-full"
            markdownTagRenderers={customMarkdownComponents}
          />
        </div>
      </div>
    </div>
  );
}
