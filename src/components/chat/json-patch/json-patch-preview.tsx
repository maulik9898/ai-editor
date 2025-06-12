"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileJson, Code } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { OperationCard } from "./operation-card";
import {
  PatchPreviewData,
  generatePatchPreview,
  isValidJSON,
  validateOperationsIndividually,
} from "./patch-utils";
import { EditorState } from "@/types/editor";
import { JsonPatchOperation } from "json-joy/esm/json-patch";
import { useEditorContext } from "@/contexts/editor-context";

const DebugInformation = ({ rawToolCall }: { rawToolCall: any }) => (
  <AccordionItem value="debug-info">
    <AccordionTrigger className="px-4 py-3 hover:no-underline">
      <div className="flex items-center gap-2">
        <Code className="h-4 w-4" />
        <span>Tool Call</span>
      </div>
    </AccordionTrigger>
    <AccordionContent className="px-4 pb-4">
      <div className="space-y-4">
        <div>
          <h5 className="text-sm font-medium mb-2 text-muted-foreground">
            Tool Call JSON
          </h5>
          <pre className="text-xs bg-muted border rounded p-3 overflow-auto max-h-64 font-mono">
            {JSON.stringify(rawToolCall, null, 2)}
          </pre>
        </div>
      </div>
    </AccordionContent>
  </AccordionItem>
);

type OperationStatus = "pending" | "applied" | "rejected";

interface JSONPatchPreviewProps {
  file_path: string;
  file_content: string;
  description: string;
  operations: JsonPatchOperation[];
  status: "inProgress" | "executing" | "complete";
}

export function JSONPatchPreview({
  file_path,
  file_content,
  description,
  operations,
  status,
}: JSONPatchPreviewProps) {
  const [operationStates, setOperationStates] = useState<
    Map<number, OperationStatus>
  >(new Map());
  const { actions: editorActions, state } = useEditorContext();
  const [error, setError] = useState<string | null>(null);

  // Store immutable snapshot of file content using ref
  const immutableFileContentRef = useRef<string>("");

  // Initialize ref with file content when we have valid content
  useEffect(() => {
    if (!immutableFileContentRef.current && file_content.trim()) {
      immutableFileContentRef.current = file_content;
    }
  }, [file_content]);

  // Initialize when component mounts or operations change
  useEffect(() => {
    if (status === "complete" && operations?.length > 0) {
      validateAndRespond();
    }
  }, [operations, status]);

  const validateAndRespond = () => {
    try {
      // Basic JSON validation using the immutable file content with fallback
      const content = immutableFileContentRef.current || file_content;
      if (!content.trim()) {
        const errorMsg = `File "${file_path}" appears to be empty`;
        setError(errorMsg);
        return;
      }

      // Validate that the content is valid JSON
      try {
        JSON.parse(content);
      } catch (parseError) {
        const errorMsg = `File "${file_path}" contains invalid JSON`;
        setError(errorMsg);
        return;
      }

      setError(null);
    } catch (err) {
      console.log(err);
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
    }
  };

  const handleOperationApply = (index: number) => {
    const newStates = new Map(operationStates);
    newStates.set(index, "applied");
    setOperationStates(newStates);

    // Apply this individual operation to the immutable file content
    const operation = operations[index];
    try {
      const content = state.files[file_path]?.content;
      const preview = generatePatchPreview(content, [operation]);
      if (preview.isValid) {
        editorActions.updateFileContent(file_path, preview.modifiedContent);
      }
    } catch (err) {
      console.error("Failed to apply operation:", err);
      // Revert state on error
      newStates.set(index, "pending");
      setOperationStates(newStates);
    }
  };

  const handleOperationReject = (index: number) => {
    const newStates = new Map(operationStates);
    const currentState = newStates.get(index);

    if (currentState === "applied") {
      // If operation was applied, we need to undo it
      // This is complex for individual operations, so for now we'll just mark as rejected
      // In a real implementation, you'd need to track operation history for proper undo
      newStates.set(index, "rejected");
    } else {
      newStates.set(index, "rejected");
    }

    setOperationStates(newStates);
  };

  const handleApplyAll = () => {
    const pendingOperations = operations
      .map((op, index) => ({ operation: op, index }))
      .filter(({ index }) => operationStates.get(index) === "pending");

    if (pendingOperations.length === 0) return;

    const newStates = new Map(operationStates);

    try {
      // Apply all pending operations at once
      const opsToApply = pendingOperations.map(({ operation }) => operation);
      const content = state.files[file_path]?.content;
      const preview = generatePatchPreview(content, opsToApply);

      if (preview.isValid) {
        editorActions.updateFileContent(file_path, preview.modifiedContent);

        // Mark all as applied
        pendingOperations.forEach(({ index }) => {
          newStates.set(index, "applied");
        });
        setOperationStates(newStates);
      }
    } catch (err) {
      console.error("Failed to apply operations:", err);
    }
  };

  const handleRejectAll = () => {
    const newStates = new Map(operationStates);

    // Mark all pending operations as rejected
    operations.forEach((_, index) => {
      if (operationStates.get(index) === "pending") {
        newStates.set(index, "rejected");
      }
    });

    setOperationStates(newStates);
  };

  // Create the raw tool call JSON for debugging
  const rawToolCall = {
    file_path,
    description,
    operations,
  };

  // Show loading state
  if (status === "inProgress") {
    return (
      <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm">Preparing JSON patch operations...</span>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="max-w-4xl border rounded-lg bg-background">
        <div className="border-b p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-medium text-destructive">JSON Patch Error</h3>
          </div>

          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>File:</strong> {file_path}
            </p>
            <p>
              <strong>Operations:</strong> {operations?.length || 0}
            </p>
          </div>
        </div>

        {/* Debug Section for Error Cases */}
        <Accordion type="multiple" className="w-full">
          <DebugInformation rawToolCall={rawToolCall} />
        </Accordion>
      </div>
    );
  }

  const appliedCount = Array.from(operationStates.values()).filter(
    (status) => status === "applied",
  ).length;
  const rejectedCount = Array.from(operationStates.values()).filter(
    (status) => status === "rejected",
  ).length;
  const pendingCount = Array.from(operationStates.values()).filter(
    (status) => status === "pending",
  ).length;
  const totalCount = operations.length;

  return (
    <div className="max-w-4xl border rounded-lg bg-background">
      {/* Header */}
      <div className="border-b p-4 flex gap-2">
        <FileJson className="h-8 w-8" />
        <div className="flex flex-col  ">
          <h3 className="font-medium">{description}</h3>
          <p className="text-sm text-muted-foreground">{file_path}</p>
        </div>
      </div>

      {/* Accordion Content */}
      <Accordion type="multiple" className="w-full">
        {/* Operations Section */}
        <AccordionItem value="operations">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center justify-between w-full mr-4">
              <h4 className="font-medium">Operations ({totalCount})</h4>
              <div className="text-sm text-muted-foreground">
                {appliedCount > 0 && `${appliedCount} applied, `}
                {rejectedCount > 0 && `${rejectedCount} rejected, `}
                {pendingCount > 0 && `${pendingCount} pending`}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {/* Bulk Actions */}
            <div className="flex gap-2 ">
              {/* <Button
                variant="outline"
                size="sm"
                onClick={handleApplyAll}
                disabled={pendingCount === 0}
              >
                Apply All Pending ({pendingCount})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                disabled={pendingCount === 0}
              >
                Reject All Pending
              </Button> */}
            </div>

            {/* Operations List */}
            <div className="space-y-3">
              {operations.map((operation, index) => (
                <OperationCard
                  key={index}
                  operation={operation}
                  index={index}
                  status={operationStates.get(index) || "pending"}
                  onApply={() => handleOperationApply(index)}
                  onReject={() => handleOperationReject(index)}
                  originalContent={
                    immutableFileContentRef.current || file_content
                  }
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Raw Tool Call Debug Section */}
        <DebugInformation rawToolCall={rawToolCall} />
      </Accordion>
    </div>
  );
}
