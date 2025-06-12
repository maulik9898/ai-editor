"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  Plus,
  Minus,
  RotateCcw,
  ArrowRightLeft,
  Copy,
  CheckCircle,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { DiffEditor } from "@monaco-editor/react";
import {
  generatePatchPreview,
  validateOperationsIndividually,
} from "./patch-utils";
import { JsonPatchOperation } from "json-joy/esm/json-patch";

interface OperationCardProps {
  operation: JsonPatchOperation;
  index: number;
  status: "pending" | "applied" | "rejected";
  onApply: () => void;
  onReject: () => void;
  originalContent: string; // Full JSON content
  disabled?: boolean;
}

export function OperationCard({
  operation,
  index,
  status,
  onApply,
  onReject,
  originalContent,
  disabled = false,
}: OperationCardProps) {
  const [diffData, setDiffData] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [editorMounted, setEditorMounted] = useState(false);

  // Store immutable snapshot of original content using ref
  const immutableOriginalContentRef = useRef<string>("");
  const editorRef = useRef<any>(null);

  // Initialize ref with original content when we have valid content
  useEffect(() => {
    if (!immutableOriginalContentRef.current && originalContent.trim()) {
      immutableOriginalContentRef.current = originalContent;
    }
  }, [originalContent]);

  useEffect(() => {
    validateOperation();
  }, [operation]);

  const validateOperation = () => {
    try {
      // ONLY validate the individual operation - no file checks
      const content = immutableOriginalContentRef.current || originalContent;
      const validation = validateOperationsIndividually(content, [operation]);

      if (!validation.isValid) {
        // Extract just the operation error (remove "Operation 1: " prefix)
        const error = validation.errors[0] || "Invalid operation";
        const cleanError = error.replace(/^Operation \d+: /, "");
        setValidationError(cleanError);
        setIsValid(false);
        return;
      }

      // Operation is valid
      setValidationError(null);
      setIsValid(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setValidationError(errorMsg);
      setIsValid(false);
    }
  };

  const generateDiffData = useCallback(() => {
    try {
      // Generate the modified content for this single operation
      const content = immutableOriginalContentRef.current || originalContent;
      const preview = generatePatchPreview(content, [operation]);

      if (!preview.isValid) {
        console.error("Preview generation failed:", preview.error);
        return;
      }
      setDiffData(preview.modifiedContent);
    } catch (error) {
      console.error("Failed to generate diff data:", error);
    }
  }, [operation, originalContent]);

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    setEditorMounted(true);
  }, []);

  const handleEditorWillUnmount = useCallback(() => {
    setEditorMounted(false);
    if (editorRef.current) {
      try {
        editorRef.current.dispose();
      } catch (error) {
        // Ignore disposal errors
        console.warn("Monaco editor disposal warning:", error);
      }
      editorRef.current = null;
    }
  }, []);

  // Cleanup on unmount and reset diffData when operation changes
  useEffect(() => {
    return () => {
      handleEditorWillUnmount();
      setDiffData(null);
    };
  }, [handleEditorWillUnmount]);

  // Reset diffData when operation changes to prevent stale data
  useEffect(() => {
    setDiffData(null);
  }, [
    operation.op,
    operation.path,
    "value" in operation ? operation.value : null,
  ]);

  const getOperationIcon = (op: string) => {
    const iconProps = { className: "h-4 w-4" };

    switch (op) {
      case "add":
        return <Plus {...iconProps} className="h-4 w-4 text-green-600" />;
      case "remove":
        return <Minus {...iconProps} className="h-4 w-4 text-red-600" />;
      case "replace":
        return <RotateCcw {...iconProps} className="h-4 w-4 text-blue-600" />;
      case "move":
        return (
          <ArrowRightLeft {...iconProps} className="h-4 w-4 text-purple-600" />
        );
      case "copy":
        return <Copy {...iconProps} className="h-4 w-4 text-orange-600" />;
      case "test":
        return <CheckCircle {...iconProps} className="h-4 w-4 text-gray-600" />;
      default:
        return <RotateCcw {...iconProps} className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOperationColor = (op: string) => {
    switch (op) {
      case "add":
        return "bg-green-100 text-green-800 border-green-200";
      case "remove":
        return "bg-red-100 text-red-800 border-red-200";
      case "replace":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "move":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "copy":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "test":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  const getStatusColor = (status: string, isValid: boolean) => {
    switch (status) {
      case "applied":
        return "border-green-300/30 ";
      case "rejected":
        return "border-yellow-300/30 ";
      default:
        return isValid ? "border-border bg-background" : "border-red-500/30"; // Error styling for invalid operations
    }
  };

  return (
    <div
      className={cn(
        "border rounded-lg transition-all h-full w-full",
        getStatusColor(status, isValid),
        disabled && "opacity-60",
      )}
    >
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={`operation-${index}`} className="border-none">
          <AccordionTrigger
            className="px-2 py-2 hover:no-underline"
            onClick={() => {
              if (isValid && !diffData) {
                generateDiffData();
              }
            }}
          >
            <div className="flex items-center gap-3 w-full">
              {/* Operation Icon */}
              <div className="flex-shrink-0">
                {getOperationIcon(operation.op)}
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium",
                      getOperationColor(operation.op),
                    )}
                  >
                    {operation.op.toUpperCase()}
                  </Badge>

                  <p className="text-sm font-medium text-muted-foreground">
                    Operation #{index}
                  </p>

                  {status === "applied" && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      Applied
                    </Badge>
                  )}
                  {status === "rejected" && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      Rejected
                    </Badge>
                  )}
                  {!isValid && (
                    <Badge className="bg-red-200 text-xs">Invalid</Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 flex gap-1">
                {status === "pending" && isValid && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApply();
                      }}
                      disabled={disabled}
                      className="h-8 px-2 text-green-600 hover:bg-green-50 hover:border-green-300"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReject();
                      }}
                      disabled={disabled}
                      className="h-8 px-2 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                {!isValid && (
                  <div className="flex items-center text-xs text-red-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Error
                  </div>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0 rounded-b-md">
            <div className="bg-muted/30 w-full h-full rounded-b-md">
              <div className="p-2">
                {/* Operation Details */}
                <span className="font-mono text-muted-foreground">
                  {operation.path}
                </span>
                {operation.op === "add" || operation.op === "replace" ? (
                  <span className="ml-2 text-muted-foreground">
                    →{" "}
                    {typeof operation.value === "string"
                      ? `"${operation.value}"`
                      : JSON.stringify(operation.value)}
                  </span>
                ) : null}
                {operation.op === "move" || operation.op === "copy" ? (
                  <span className="ml-2 text-muted-foreground">
                    ← {operation.from}
                  </span>
                ) : null}
              </div>
              {!isValid ? (
                <div className="p-4 text-center text-red-600">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Cannot preview invalid operation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Validation Error : {validationError}
                  </p>
                </div>
              ) : (
                <div className="h-full">
                  {diffData ? (
                    <div className="min-h-full h-full rounded-b-lg overflow-hidden bg-background w-full">
                      <DiffEditor
                        key={`diff-${index}-${operation.op}-${operation.path}`}
                        height="200px"
                        language="json"
                        original={
                          immutableOriginalContentRef.current || originalContent
                        }
                        modified={diffData}
                        originalModelPath={`immutable://operation-${index}-original.json`}
                        modifiedModelPath={`inmemory://operation-${index}-modified.json`}
                        options={{
                          readOnly: true,
                          renderOverviewRuler: false,
                          compactMode: true,
                          onlyShowAccessibleDiffViewer: true,
                        }}
                        className="w-full min-h-full"
                        theme="vs-dark"
                        keepCurrentOriginalModel={false}
                        keepCurrentModifiedModel={false}
                        onMount={handleEditorMount}
                        loading={
                          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            Loading diff...
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <div className="border rounded-b-md p-4 bg-background text-center text-muted-foreground text-sm">
                      Loading diff preview...
                    </div>
                  )}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
