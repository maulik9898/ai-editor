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
import { parseDiff, Diff, Hunk, Decoration } from "react-diff-view";
import { createTwoFilesPatch } from "diff";
import {
  generatePatchPreview,
  validateOperationsIndividually,
} from "./utils";
import { JsonPatchOperation } from "json-joy/esm/json-patch";

// Import react-diff-view styles
import "react-diff-view/style/index.css";

// Custom styles using react-diff-view CSS variables and class names
const diffStyles = `
  .diff-container {
    /* Light mode CSS variables */
    --diff-background-color: hsl(var(--background));
    --diff-text-color: hsl(var(--foreground));
    --diff-font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
    
    /* Gutter colors for light mode */
    --diff-gutter-insert-background-color: #f0fdf4;
    --diff-gutter-insert-text-color: #16a34a;
    --diff-gutter-delete-background-color: #fef2f2;
    --diff-gutter-delete-text-color: #dc2626;
    
    /* Code colors for light mode */
    --diff-code-insert-background-color: #f0fdf4;
    --diff-code-insert-text-color: #15803d;
    --diff-code-delete-background-color: #fef2f2;
    --diff-code-delete-text-color: #991b1b;
  }
  
  /* Dark mode CSS variables */
  .dark .diff-container {
    --diff-background-color: hsl(var(--background));
    --diff-text-color: #f1f5f9;
    
    /* Gutter colors for dark mode */
    --diff-gutter-insert-background-color: #14532d;
    --diff-gutter-insert-text-color: #86efac;
    --diff-gutter-delete-background-color:rgba(127, 29, 29, 0.67);
    --diff-gutter-delete-text-color: #fca5a5;
    
    /* Code colors for dark mode */
    --diff-code-insert-background-color: #14532d;
    --diff-code-insert-text-color: #bbf7d0;
    --diff-code-delete-background-color:rgba(127, 29, 29, 0.67);
    --diff-code-delete-text-color: #fecaca;
  }
  
  /* Additional styling for better appearance */
  .diff-container .diff {
    border: 1px solid hsl(var(--border));
    border-radius: 6px;
    overflow: hidden;
  }
  
  .diff-container .diff-code {
    padding: 0 12px;
    line-height: 1.5;
  }
  
  .diff-container .diff-gutter {
    min-width: 60px;
    padding: 0 8px;
    font-weight: 500;
    text-align: center;
    border-right: 1px solid hsl(var(--border));
  }
`;

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
  const [diffFiles, setDiffFiles] = useState<any[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [diffLoading, setDiffLoading] = useState(false);

  // Store immutable snapshot of original content using ref
  const immutableOriginalContentRef = useRef<string>("");

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
      setDiffLoading(true);
      
      // Generate the modified content for this single operation
      const content = immutableOriginalContentRef.current || originalContent;
      const preview = generatePatchPreview(content, [operation]);

      if (!preview.isValid) {
        console.error("Preview generation failed:", preview.error);
        setDiffLoading(false);
        return;
      }

            // Format JSON content for better diff readability
      const formattedOriginal = JSON.stringify(JSON.parse(content), null, 2);
      const formattedModified = JSON.stringify(JSON.parse(preview.modifiedContent), null, 2);

      // Create a unified diff patch using git-style format with context
      const rawPatch = createTwoFilesPatch(
        "original.json",
        "modified.json",
        content,
        preview.modifiedContent,
        "Original",
        "Modified",
        { context: 3 } 
      );

      // Add git diff header that react-diff-view expects
      const GIT_DIFF_HEADER = `diff --git a/original.json b/modified.json
index 1111111..2222222 100644`;
      
      const patch = GIT_DIFF_HEADER + '\n' + rawPatch;

      // Use react-diff-view's built-in parseDiff
      const files = parseDiff(patch, { 
        nearbySequences: "zip" // Better display for nearby changes
      });
      console.log("Files:", files);

      setDiffFiles(files);
      setDiffLoading(false);
    } catch (error) {
      console.error("Failed to generate diff data:", error);
      setDiffLoading(false);
    }
  }, [operation, originalContent]);

  // Reset diffFiles when operation changes to prevent stale data
  useEffect(() => {
    setDiffFiles([]);
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

  const renderFile = (file: any) => {
    const renderHunksWithCollapse = (hunks: any[]) => {
      const result: any[] = [];
      
      hunks.forEach((hunk, index) => {
        // Add collapse indicator if there's a gap between hunks
        if (index > 0) {
          const prevHunk = hunks[index - 1];
          const currentHunk = hunk;
          
          // Calculate if there's a significant gap
          const prevEnd = prevHunk.oldStart + prevHunk.oldLines;
          const currentStart = currentHunk.oldStart;
          const gap = currentStart - prevEnd;
          
          if (gap > 1) {
            const collapseText = `... ${gap} lines hidden ...`;
            result.push(
              <Decoration key={`collapse-${index}`}>
                <div className=" !bg-muted flex justify-center text-muted-foreground">
                  {collapseText}
                </div>
              </Decoration>
            );
          }
        }
        
        // Add the actual hunk
        result.push(
          <Hunk key={hunk.content} hunk={hunk} />
        );
      });
      
      return result;
    };

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: diffStyles }} />
        <div className="diff-container rounded-md overflow-hidden bg-background">
          <Diff 
            key={file.oldRevision + "-" + file.newRevision} 
            viewType="unified" 
            diffType={file.type}
            hunks={file.hunks}
            className="text-sm font-mono"
          >
            {renderHunksWithCollapse}
          </Diff>
        </div>
      </>
    );
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
              if (isValid && diffFiles.length === 0) {
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
                  {diffLoading ? (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                      Loading diff...
                    </div>
                  ) : diffFiles.length > 0 ? (
                    <div className="min-h-[200px] rounded-b-lg overflow-hidden bg-background w-full p-2">
                      <div className="diff-view-container text-xs max-h-[400px] overflow-auto">
                        {diffFiles.map(renderFile)}
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-b-md p-4 bg-background text-center text-muted-foreground text-sm">
                      Click to load diff preview...
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
