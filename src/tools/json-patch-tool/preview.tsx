"use client";

import { useState, useEffect, useRef } from "react";
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
  generatePatchPreview,
} from "./utils";
import { useEditorStore } from "@/stores/editor-store";
import { DebugInformationTabs } from "@/components/common/DebugInformationTabs";
import { useDebugStore } from "@/stores/debug-store";
import { JsonPatchInput, JsonPatchOutput } from "./index";

type OperationStatus = "pending" | "applied" | "rejected";

interface JSONPatchPreviewProps {
  file_content: string;
  result: JsonPatchOutput;
  args: JsonPatchInput;
}

export function JSONPatchPreview({
  file_content,
  result,
  args,
}: JSONPatchPreviewProps) {
  const [operationStates, setOperationStates] = useState<
    Map<number, OperationStatus>
  >(new Map());
  const files = useEditorStore((state) => state.files);
  const updateFileContent = useEditorStore((state) => state.updateFileContent);
  const [error, setError] = useState<string | null>(null);

  const isDebugEnabled = useDebugStore((state) => state.isDebugEnabled);

  // Store immutable snapshot of file content using ref
  const immutableFileContentRef = useRef<string>("");

  const operations = result.operations;
  const file_path = args.file_path;
  const description = args.description;

  // Initialize ref with file content when we have valid content
  useEffect(() => {
    if (!immutableFileContentRef.current && file_content.trim()) {
      immutableFileContentRef.current = file_content;
    }
  }, [file_content]);

  // Initialize when component mounts or operations change
  useEffect(() => {
    if (operations?.length > 0) {
      validateAndRespond();
    }
  }, [operations]);

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
      const content = files[file_path]?.content;
      const preview = generatePatchPreview(content, [operation]);
      if (preview.isValid) {
        updateFileContent(file_path, preview.modifiedContent);
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
      const content = files[file_path]?.content;
      const preview = generatePatchPreview(content, opsToApply);

      if (preview.isValid) {
        updateFileContent(file_path, preview.modifiedContent);

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

  // Handle error state
  if (error) {
    return (
      <div className=" border rounded-lg bg-background">
        <Accordion type="multiple">
          <AccordionItem value="error-details">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <h3 className="font-medium text-sm text-destructive">
                  JSON Patch Error
                </h3>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
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
            </AccordionContent>
          </AccordionItem>

          {isDebugEnabled && (
            <AccordionItem value="debug-info">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <span className="text-sm font-medium">Debug Information</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <DebugInformationTabs input={args} output={result} />
              </AccordionContent>
            </AccordionItem>
          )}
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
    <div className=" border rounded-lg bg-background">
      <Accordion type="multiple" className="w-full">
        {/* Operations Section */}
        <AccordionItem value="operations">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2 w-full mr-4">
              <FileJson className="h-5 w-5" />
              <div className="flex flex-col flex-1 gap-1">
                <h3 className="text-sm font-medium">{description}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{file_path}</span>
                  <span>•</span>
                  <span>{totalCount} ops</span>
                  {appliedCount > 0 && (
                    <>
                      <span>•</span>
                      <span>{appliedCount} applied</span>
                    </>
                  )}
                  {rejectedCount > 0 && (
                    <>
                      <span>•</span>
                      <span>{rejectedCount} rejected</span>
                    </>
                  )}
                  {pendingCount > 0 && (
                    <>
                      <span>•</span>
                      <span>{pendingCount} pending</span>
                    </>
                  )}
                </div>
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
        {isDebugEnabled && (
          <AccordionItem value="debug-info">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span className="text-sm font-medium">Debug Information</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <DebugInformationTabs input={args} output={result} />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
