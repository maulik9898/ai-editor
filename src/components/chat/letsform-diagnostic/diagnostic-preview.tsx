"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Code,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DebugInformationTabs } from "../common/DebugInformationTabs";
import { DiagnosticOutput } from "@/tools/diagnostic-tool";
import { useState } from "react";
import { useDebugStore } from "@/stores/debug-store";

interface DiagnosticPreviewProps {
  result: DiagnosticOutput;
  input: {
    file_path: string;
  };
}

function DiagnosticLoadingView() {
  return (
    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
      <span className="text-xs">Analyzing schema...</span>
    </div>
  );
}

function CompactIssueList({
  title,
  icon,
  issues,
  variant,
}: {
  title: string;
  icon: React.ReactNode;
  issues: Record<string, { paths: string[]; component: string }>;
  variant: "destructive" | "warning";
}) {
  const [isOpen, setIsOpen] = useState(true);

  if (Object.keys(issues).length === 0) return null;

  return (
    <div className="space-y-1">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium hover:bg-muted/50 p-1 rounded w-full">
          {isOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {icon}
          <span>{title}</span>
          <Badge
            variant={variant === "destructive" ? "destructive" : "secondary"}
            className="text-xs h-4"
          >
            {Object.keys(issues).length}
          </Badge>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 ml-4">
          {Object.entries(issues).map(([name, issue]) => (
            <div
              key={name}
              className="text-xs p-2 rounded border-l-2 bg-muted/20"
              style={{
                borderLeftColor:
                  variant === "destructive"
                    ? "rgb(239 68 68)"
                    : "rgb(234 179 8)",
              }}
            >
              <div className="flex items-center gap-1 mb-1">
                <code className="font-mono text-xs bg-background px-1 rounded">
                  {name}
                </code>
                <Badge variant="outline" className="text-xs h-3 px-1">
                  {issue.component}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {issue.paths.join(" • ")}
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function DiagnosticPreview({ result, input }: DiagnosticPreviewProps) {
  const isDebugEnabled = useDebugStore((state) => state.isDebugEnabled);
  if (!result.success) {
    return (
      <Accordion type="multiple" className="border rounded-md bg-background">
        <AccordionItem value="error-analysis">
          <AccordionTrigger className="px-3 py-3 hover:no-underline">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Schema Analysis</span>
                <code className="text-xs bg-muted px-1 rounded">
                  {input.file_path.split("/").pop()}
                </code>
              </div>
              <Badge variant="destructive" className="text-xs h-5">
                Error
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3">
            <div className="space-y-3">
              <Alert variant="destructive" className="text-xs">
                <AlertDescription>{result.jsonError}</AlertDescription>
              </Alert>
              <div className="text-xs text-muted-foreground">
                <strong>File:</strong> {input.file_path}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        {isDebugEnabled && (
          <AccordionItem value="debug-info">
            <AccordionTrigger className="px-3 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span className="text-sm font-medium">Debug Information</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <DebugInformationTabs input={input} output={result} />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    );
  }

  const { diagnostics, summary } = result;
  const hasIssues = summary && summary.totalIssues > 0;

  return (
    <Accordion type="multiple" className="border rounded-md bg-background">
      <AccordionItem value="schema-analysis">
        <AccordionTrigger className="px-3 py-3 hover:no-underline">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {hasIssues ? (
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">Schema Analysis</span>
              <code className="text-xs bg-muted px-1 rounded truncate">
                {input.file_path.split("/").pop()}
              </code>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {hasIssues ? (
                <>
                  {summary.duplicateCount > 0 && (
                    <Badge variant="destructive" className="text-xs h-5">
                      {summary.duplicateCount} dup
                    </Badge>
                  )}
                  {summary.invalidCount > 0 && (
                    <Badge variant="secondary" className="text-xs h-5">
                      {summary.invalidCount} invalid
                    </Badge>
                  )}
                </>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-green-700 bg-green-100 text-xs h-5"
                >
                  ✓ Clean
                </Badge>
              )}
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-3 pb-3">
          {hasIssues ? (
            <div className="space-y-3">
              {diagnostics?.duplicatedNames && (
                <CompactIssueList
                  title="Duplicates"
                  icon={<AlertTriangle className="h-3 w-3 text-red-600" />}
                  issues={diagnostics.duplicatedNames}
                  variant="destructive"
                />
              )}

              {diagnostics?.invalidNames && (
                <CompactIssueList
                  title="Invalid Names"
                  icon={<AlertCircle className="h-3 w-3 text-yellow-600" />}
                  issues={diagnostics.invalidNames}
                  variant="warning"
                />
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-green-800 mb-1">
                Schema looks great!
              </div>
              <div className="text-xs text-muted-foreground">
                No duplicate or invalid field names found
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {isDebugEnabled && (
        <AccordionItem value="debug-info">
          <AccordionTrigger className="px-3 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span className="text-sm font-medium">Debug Information</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3">
            <DebugInformationTabs input={input} output={result} />
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}

export { DiagnosticLoadingView };
