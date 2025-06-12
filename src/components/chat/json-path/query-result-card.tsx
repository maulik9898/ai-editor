"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Copy,
  CheckCircle,
  AlertCircle,
  FileJson,
  FileCode,
} from "lucide-react";
import { QueryResult } from "./json-path-utils";
import Editor from "@monaco-editor/react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface QueryResultCardProps {
  queryResult: QueryResult;
  index: number;
}

export function QueryResultCard({ queryResult, index }: QueryResultCardProps) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleCopyPath = async (path: string) => {
    await navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const getStatusColor = (success: boolean) => {
    return success ? "" : "border-red-300/30 ";
  };

  return (
    <div className={cn(" rounded-md", getStatusColor(queryResult.success))}>
      <div className="">
        {/* Error Display */}
        {!queryResult.success && queryResult.error && (
          <Alert variant="destructive" className="">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Query Error</AlertTitle>
            <AlertDescription>{queryResult.error}</AlertDescription>
          </Alert>
        )}

        {/* Matches Display with Tabs */}
        {queryResult.success && queryResult.matches && (
          <div>
            <div className="flex items-center justify-between mb-2"></div>

            <Tabs defaultValue="paths" className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="paths">
                  <FileCode className="h-3 w-3 mr-1" /> Paths
                </TabsTrigger>
                <TabsTrigger
                  value="values"
                  disabled={!queryResult.include_values}
                >
                  <FileJson className="h-3 w-3 mr-1" /> Values
                </TabsTrigger>
              </TabsList>

              <TabsContent value="paths" className="mt-0">
                <div className="space-y-2  overflow-y-auto">
                  <div className="border rounded overflow-hidden">
                    <Editor
                      height="400px"
                      language="json"
                      value={JSON.stringify(
                        queryResult.matches ? Object.keys(queryResult.matches) : [],
                        null,
                        2,
                      )}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                      theme="vs-dark"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="values" className="mt-0">
                {queryResult.include_values && (
                  <div className="border rounded overflow-hidden">
                    <Editor
                      height="400px"
                      language="json"
                      value={JSON.stringify(
                        queryResult.matches || {},
                        null,
                        2,
                      )}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                      theme="vs-dark"
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
