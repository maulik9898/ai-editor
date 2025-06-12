"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertTriangle,
  Check,
  X,
  AlertCircle,
  Brain,
  Database,
} from "lucide-react";
import { SearchReplaceEdit, EditParser } from "@/lib/edit-parser";
import { DiffEditor } from "@monaco-editor/react";

interface JSONRepairPreviewProps {
  originalContent: string;
  validationError?: string;
  aiEdits?: SearchReplaceEdit[];
  aiRepairError?: string;
  isLoadingAI?: boolean;
  onApproveAIRepair?: () => void;
  onReject?: () => void;
  onRetryAI?: () => void;
  hasKnowledgeBase?: boolean;
}

export function JSONRepairPreview({
  originalContent,
  validationError,
  aiEdits,
  aiRepairError,
  isLoadingAI = false,
  onApproveAIRepair,
  onReject,
  onRetryAI,
  hasKnowledgeBase = false,
}: JSONRepairPreviewProps) {
  const [modifiedContent, setModifiedContent] = useState<string>("");
  const [diffKey, setDiffKey] = useState(0);

  const hasAIRepair = aiEdits && aiEdits.length > 0;
  const hasAIError = !!aiRepairError;

  // Generate modified content when AI edits are available
  useEffect(() => {
    if (hasAIRepair && originalContent) {
      const applyResult = EditParser.applyEdits(originalContent, aiEdits);
      if (applyResult.success && applyResult.result) {
        setModifiedContent(applyResult.result);
        // Force diff editor to refresh by changing key
        setDiffKey((prev) => prev + 1);
      }
    }
  }, [aiEdits, originalContent, hasAIRepair]);

  return (
    <Accordion type="single" collapsible className="max-w-4xl border rounded-lg bg-background">
      <AccordionItem value="ai-repair">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {isLoadingAI ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              ) : hasAIError ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : hasAIRepair ? (
                <Brain className="h-5 w-5 text-blue-600" />
              ) : (
                <Brain className="h-5 w-5 text-blue-600" />
              )}
              <h3 className="font-medium">AI JSON Repair</h3>
              {hasKnowledgeBase && (
                <Badge variant="outline" className="text-xs">
                  <Database className="h-3 w-3 mr-1" />
                  Using Knowledge Base
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mr-2">
              {isLoadingAI && <Badge variant="secondary">Analyzing...</Badge>}
              {hasAIError && <Badge variant="destructive">Failed</Badge>}
              {hasAIRepair && (
                <Badge className="bg-blue-100 text-blue-800">
                  {aiEdits.length} fix{aiEdits.length !== 1 ? "es" : ""} found
                </Badge>
              )}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          {validationError && (
            <div className="text-sm text-muted-foreground mb-4">
              <p>
                <strong>Error:</strong> {validationError}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {isLoadingAI && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  AI is analyzing the JSON structure and syntax errors...
                </p>
                {hasKnowledgeBase && (
                  <p className="text-xs text-blue-600 mt-2">
                    Using your knowledge base for context-aware repairs
                  </p>
                )}
              </div>
            )}

            {hasAIError && (
              <div className="space-y-3">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{aiRepairError}</AlertDescription>
                </Alert>
                {onRetryAI && (
                  <Button variant="outline" onClick={onRetryAI}>
                    <Brain className="h-4 w-4 mr-2" />
                    Retry AI Analysis
                  </Button>
                )}
              </div>
            )}

            {hasAIRepair && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  AI identified {aiEdits.length} specific fix
                  {aiEdits.length !== 1 ? "es" : ""} for your JSON:
                </div>

                {/* Diff Preview */}
                <div className="border rounded overflow-hidden">
                  <DiffEditor
                    key={diffKey}
                    height="300px"
                    language="json"
                    original={originalContent}
                    modified={modifiedContent}
                    originalModelPath={`inmemory://ai-repair-original-${diffKey}.json`}
                    modifiedModelPath={`inmemory://ai-repair-modified-${diffKey}.json`}
                    options={{
                      readOnly: true,
                      renderOverviewRuler: false,
                      compactMode: true,
                      onlyShowAccessibleDiffViewer: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                    theme="vs-dark"
                    keepCurrentOriginalModel={false}
                    keepCurrentModifiedModel={false}
                    loading={
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        Loading diff...
                      </div>
                    }
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={onApproveAIRepair}
                    variant="outline"
                    className=" px-2 text-green-600 hover:bg-green-50 hover:border-green-300"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Apply All Fixes
                  </Button>
                  <Button variant="outline" onClick={onReject}>
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  {onRetryAI && (
                    <Button variant="outline" onClick={onRetryAI}>
                      <Brain className="h-4 w-4 mr-1" />
                      Re-analyze
                    </Button>
                  )}
                </div>
              </div>
            )}

            {!isLoadingAI && !hasAIRepair && !hasAIError && (
              <div className="text-center py-6 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">AI analysis will start automatically...</p>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
