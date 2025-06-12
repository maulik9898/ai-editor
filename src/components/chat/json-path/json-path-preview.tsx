"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Search, Code } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { QueryResultCard } from "./query-result-card";
import { JSONPathResult } from "./json-path-utils";
import { DebugInformationTabs } from "../common/DebugInformationTabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Editor } from "@monaco-editor/react";
import { JSONPathToolProps } from "./json-path-tool";

interface JSONPathPreviewProps {
  result: JSONPathResult;
  input: JSONPathToolProps;
}

function JSONPathLoadingView() {
  return (
    <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      <span className="text-sm">Executing JSONPath queries...</span>
    </div>
  );
}

function FileErrorDisplay({
  error,
  filePath,
  result,
  input,
}: {
  error?: string;
  filePath: string;
  result?: JSONPathResult;
  input: JSONPathToolProps;
}) {
  return (
    <div className="max-w-4xl border rounded-lg bg-background">
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <h3 className="font-medium text-destructive">JSONPath Query Error</h3>
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
      {result && (
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
      )}
    </div>
  );
}

export function JSONPathPreview({ result, input }: JSONPathPreviewProps) {
  if (!result.success) {
    return (
      <FileErrorDisplay
        error={result.error}
        filePath={result.file_path}
        result={result}
        input={input}
      />
    );
  }

  return (
    <Accordion
      type="multiple"
      className="max-w-4xl border rounded-lg bg-background"
    >
      {/* Header - Now part of main accordion */}
      <AccordionItem value="header" className="border-b">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex  justify-between w-full gap-2 mb-2">
            <div className="flex gap-2">
              <Search className="h-5 w-5 text-primary" />
              <h3 className="">{result.file_path}</h3>
            </div>

            {result.summary && (
              <div className="text-xs text-muted-foreground mt-1">
                {result.summary.successful_queries}/
                {result.summary.total_queries} queries successful •
                {result.summary.total_matches} total matches
              </div>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <Accordion
            type="multiple"
            className="max-w-4xl border rounded-lg bg-background"
          >
            {result.queries.map((queryResult, index) => (
              <AccordionItem
                className={
                  queryResult.error
                    ? "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90 "
                    : ""
                }
                value={queryResult.query}
              >
                <AccordionTrigger className={`px-4 py-3 hover:no-underline`}>
                  <div className="flex w-full flex-col gap-2 ">
                    <div className="flex items-center justify-between w-full mr-4">
                      <h4 className="font-medium">{queryResult.query}</h4>
                      <div className="text-sm text-muted-foreground">
                        {result.summary?.total_matches} total matches
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      {queryResult.description}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <QueryResultCard queryResult={queryResult} index={index} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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

export { JSONPathLoadingView };
