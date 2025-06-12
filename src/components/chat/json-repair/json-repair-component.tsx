"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useEditorContext } from "@/contexts/editor-context";
import { useKnowledgeBase } from "@/contexts/knowledge-base-context";
import { JSONRepairUtility, AutoRepairResult } from "@/lib/json-repair";
import { JSONRepairClient } from "@/lib/json-repair-client";
import { EditParser, SearchReplaceEdit } from "@/lib/edit-parser";
import { JSONRepairPreview } from "./json-repair-preview";

interface JSONRepairComponentProps {
  filePath: string;
  onResult: (result: any) => void;
}

export function JSONRepairComponent({
  filePath,
  onResult,
}: JSONRepairComponentProps) {
  const { state, actions } = useEditorContext();
  const { knowledgeBase } = useKnowledgeBase();

  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
  } | null>(null);
  const [isStreamingAI, setIsStreamingAI] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [aiEdits, setAiEdits] = useState<SearchReplaceEdit[]>([]);
  const [aiError, setAiError] = useState<string>("");
  const [repairStarted, setRepairStarted] = useState(false);

  const file = state.files[filePath];

  // File validation
  if (!file) {
    useEffect(() => {
      onResult({
        success: false,
        error: `File "${filePath}" not found`,
      });
    }, [filePath, onResult]);

    return <div className="text-red-600">File not found: {filePath}</div>;
  }

  if (file.language !== "json" && file.language !== "jsonc") {
    useEffect(() => {
      onResult({
        success: false,
        error: `File is not JSON (detected: ${file.language})`,
      });
    }, [file.language, onResult]);

    return <div className="text-red-600">Not a JSON file: {filePath}</div>;
  }

  // Validate JSON and start AI repair automatically
  useEffect(() => {
    if (!validationResult && file && !repairStarted) {
      const validation = JSONRepairUtility.validateJSON(file.content);
      setValidationResult(validation);

      if (!validation.isValid) {
        setRepairStarted(true);
        // Start AI repair immediately
        tryAIRepair(validation.error || "Unknown JSON error");
      } else {
        // JSON is already valid
        onResult({
          success: true,
          message: "JSON is already valid - no repair needed",
        });
      }
    }
  }, [file, validationResult, repairStarted]);

  const tryAIRepair = useCallback(
    async (errorMessage: string) => {
      if (!file) return;

      setIsStreamingAI(true);
      setStreamedContent("");
      setAiError("");
      setAiEdits([]);

      try {
        await JSONRepairClient.streamRepair({
          content: file.content,
          error: errorMessage,
          knowledgeBase: knowledgeBase || undefined,
          onChunk: (chunk) => {
            setStreamedContent((prev) => prev + chunk);
          },
          onComplete: (fullResponse) => {
            setIsStreamingAI(false);

            // Parse the AI response
            const parseResult = EditParser.parseEdits(fullResponse);

            if (parseResult.success) {
              setAiEdits(parseResult.edits);
            } else {
              setAiError(`Parse failed: ${parseResult.errors.join(", ")}`);
            }
          },
          onError: (error) => {
            setIsStreamingAI(false);
            setAiError(error.message);
          },
        });
      } catch (error) {
        setIsStreamingAI(false);
        setAiError(error instanceof Error ? error.message : "Unknown error");
      }
    },
    [file, knowledgeBase],
  );

  const handleApproveAIRepair = useCallback(() => {
    if (aiEdits.length > 0 && file) {
      const applyResult = EditParser.applyEdits(file.content, aiEdits);

      if (applyResult.success && applyResult.result) {
        // Apply the changes to the editor
        actions.updateFileContent(filePath, applyResult.result);

        // Validate that the result is actually valid JSON
        const validation = JSONRepairUtility.validateJSON(applyResult.result);

        if (validation.isValid) {
          // Send success response immediately
          const successResult = {
            success: true,
            method: "ai_assisted",
            changes_applied: true,
            edits_count: aiEdits.length,
            message: `✅ JSON successfully repaired! Applied ${aiEdits.length} AI-generated fix${aiEdits.length !== 1 ? "es" : ""} and validated the result. The file is now valid JSON.`,
            details: {
              original_error: validationResult?.error,
              fixes_applied: aiEdits.length,
              validation_passed: true,
            },
          };

          onResult(successResult);
        } else {
          const errorResult = {
            success: false,
            error: `❌ AI repair applied but JSON is still invalid: ${validation.error}`,
            message:
              "The AI fixes were applied but the JSON still has validation errors. Manual intervention may be required.",
            details: {
              original_error: validationResult?.error,
              fixes_applied: aiEdits.length,
              validation_passed: false,
              remaining_error: validation.error,
            },
          };

          onResult(errorResult);
        }
      } else {
        const errorResult = {
          success: false,
          error: `❌ Failed to apply AI edits: ${applyResult.errors.join(", ")}`,
          message: "The AI-generated fixes could not be applied to the file.",
          details: {
            original_error: validationResult?.error,
            edit_errors: applyResult.errors,
          },
        };

        onResult(errorResult);
      }
    } else {
      const errorResult = {
        success: false,
        error: "❌ No AI edits available to apply",
        message: "No repair suggestions are available to apply.",
      };

      onResult(errorResult);
    }
  }, [aiEdits, file, filePath, actions, onResult, validationResult?.error]);

  const handleReject = useCallback(() => {
    const rejectResult = {
      success: false,
      error: "User rejected AI repair suggestions",
      message: "Please fix the JSON manually",
    };

    onResult(rejectResult);
  }, [onResult]);

  const handleRetryAI = useCallback(() => {
    if (validationResult?.error) {
      setAiEdits([]);
      setAiError("");
      setStreamedContent("");
      tryAIRepair(validationResult.error);
    }
  }, [validationResult?.error, tryAIRepair]);

  if (!file) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Main Repair Preview */}
      <JSONRepairPreview
        originalContent={file.content}
        validationError={validationResult?.error}
        aiEdits={aiEdits.length > 0 ? aiEdits : undefined}
        aiRepairError={aiError || undefined}
        isLoadingAI={isStreamingAI}
        onApproveAIRepair={handleApproveAIRepair}
        onReject={handleReject}
        onRetryAI={handleRetryAI}
        hasKnowledgeBase={!!knowledgeBase}
      />
    </div>
  );
}
