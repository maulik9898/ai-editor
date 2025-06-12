"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EditorFile } from "@/types/editor";
import dynamic from "next/dynamic";

const LetsFormMantine = dynamic(() => import("./letsform-mantine-wrapper"), {
  ssr: false,
});

interface LetsFormPreviewProps {
  file: EditorFile;
  enableFieldInspector?: boolean;
}

export function LetsFormPreview({
  file,
  enableFieldInspector = true,
}: LetsFormPreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    validateAndParseJSON();
  }, [file.content]);

  const validateAndParseJSON = () => {
    try {
      const parsed = JSON.parse(file.content);
      setFormData(parsed);
      setError(null);
      setIsValid(true);
    } catch (err) {
      setError(
        `Invalid JSON: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setIsValid(false);
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isValid || !formData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 pb-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Let's Form Preview</h3>
          {enableFieldInspector && (
            <div className="text-xs text-muted-foreground">
              Hover over fields to see their names
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 p-4 pt-2 overflow-y-auto">
        <div className="border rounded-lg p-4 bg-background h-fit">
          <LetsFormMantine
            formData={formData}
            enableFieldInspector={enableFieldInspector}
          />
        </div>
      </div>
    </div>
  );
}
