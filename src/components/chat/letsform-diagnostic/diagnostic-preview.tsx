"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  FileCheck,
  Code,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DebugInformationTabs } from "../common/DebugInformationTabs";
import {
  DiagnosticResponse,
  DiagnosticErrorResponse,
} from "./diagnostic-utils";

interface DiagnosticPreviewProps {
  result: DiagnosticResponse | DiagnosticErrorResponse;
  input: {
    file_path: string;
  };
}

function DiagnosticLoadingView() {
  return (
    <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      <span className="text-sm">Analyzing Let's Form schema...</span>
    </div>
  );
}

function DiagnosticErrorDisplay({
  error,
  filePath,
  result,
  input,
}: {
  error: string;
  filePath: string;
  result: DiagnosticErrorResponse;
  input: any;
}) {
  return (
    <div className="max-w-4xl border rounded-lg bg-background">
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <h3 className="font-medium text-destructive">
            Schema Analysis Error
          </h3>
        </div>

        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="text-sm text-muted-foreground">
          <p>
            <strong>File:</strong> {filePath}
          </p>
        </div>
      </div>

      {/* Debug Section */}
      <Accordion type="multiple">
        <AccordionItem value="debug-info">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span>Debug Information</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <DebugInformationTabs input={input} output={result} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function IssueCard({
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
  if (Object.keys(issues).length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-medium">{title}</h4>
        <Badge
          variant={variant === "destructive" ? "destructive" : "secondary"}
        >
          {Object.keys(issues).length}
        </Badge>
      </div>

      <div className="space-y-2">
        {Object.entries(issues).map(([name, issue]) => (
          <div
            key={name}
            className={`p-3 rounded-md border ${
              variant === "destructive"
                ? "border-destructive "
                : "border-yellow-500 "
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono bg-background px-1 py-0.5 rounded">
                    {name}
                  </code>
                  <Badge variant="outline" className="text-xs">
                    {issue.component}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">
                    {issue.paths.length > 1 ? "Locations:" : "Location:"}
                  </span>{" "}
                  {issue.paths.join(", ")}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiagnosticPreview({ result, input }: DiagnosticPreviewProps) {
  if (!result.success) {
    return (
      <DiagnosticErrorDisplay
        error={result.jsonError}
        filePath={result.file_path}
        result={result}
        input={input}
      />
    );
  }

  const { diagnostics, summary } = result;
  const hasIssues = summary.totalIssues > 0;

  return (
    <Accordion
      type="multiple"
      className="max-w-4xl border rounded-lg bg-background"
    >
      {/* Header */}
      <AccordionItem value="header" className="border-b">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              {hasIssues ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              <h3 className="font-medium">
                Let's Form Schema Analysis - {input.file_path}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {hasIssues ? (
                <Badge variant="destructive">
                  {summary.totalIssues} issues
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-green-700 bg-green-100"
                >
                  ✓ No issues
                </Badge>
              )}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          {hasIssues ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-md">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {summary.duplicateCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Duplicate Names
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {summary.invalidCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Invalid Names
                  </div>
                </div>
              </div>

              {/* Issues */}
              <div className="space-y-6">
                {diagnostics.duplicatedNames && (
                  <IssueCard
                    title="Duplicate Field Names"
                    icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
                    issues={diagnostics.duplicatedNames}
                    variant="destructive"
                  />
                )}

                {diagnostics.invalidNames && (
                  <IssueCard
                    title="Invalid Field Names"
                    icon={<AlertCircle className="h-4 w-4 text-yellow-600" />}
                    issues={diagnostics.invalidNames}
                    variant="warning"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h4 className="font-medium text-green-800 mb-1">
                Schema looks great!
              </h4>
              <p className="text-sm text-muted-foreground">
                No duplicate or invalid field names found.
              </p>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Debug Section */}
      <AccordionItem value="debug-info">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            <span>Debug Information</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <DebugInformationTabs input={input} output={result} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export { DiagnosticLoadingView };
