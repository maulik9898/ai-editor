import { DebugInformationTabs } from "@/components/chat/common/DebugInformationTabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDebugStore } from "@/stores/debug-store";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { CheckCircle2, AlertCircle, Code } from "lucide-react";
import { JsonRepairOutput, JsonRepairInput } from "../json-repair-tool";
import { Badge } from "@/components/ui/badge";

export function JSONRepairResultView({
  result,
  input,
}: {
  result: JsonRepairOutput;
  input: JsonRepairInput;
}) {
  const isDebugEnabled = useDebugStore((state) => state.isDebugEnabled);

  return (
    <Accordion type="multiple" className="border rounded-md bg-background">
      <AccordionItem value="repair-result">
        <AccordionTrigger className="px-3 py-3 hover:no-underline">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              )}
              <span className="text-sm font-medium">JSON Repair</span>
              <code className="text-xs bg-muted px-1 rounded">
                {input.file_path.split("/").pop()}
              </code>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {result.success ? (
                <Badge
                  variant="secondary"
                  className="text-green-700 bg-green-100 text-xs h-5"
                >
                  ✓{" "}
                  {result.method === "validation_check" ? "Valid" : "Repaired"}
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs h-5">
                  Failed
                </Badge>
              )}
              {result.details?.fixes_applied && (
                <Badge variant="outline" className="text-xs h-5">
                  {result.details.fixes_applied} fixes
                </Badge>
              )}
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-3 pb-3">
          <div className="space-y-3">
            {result.success ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-green-800 mb-1">
                  {result.message}
                </div>
                {result.details?.fixes_applied && (
                  <div className="text-xs text-muted-foreground">
                    Applied {result.details.fixes_applied} AI-generated fixes
                  </div>
                )}
              </div>
            ) : (
              <Alert variant="destructive" className="text-xs">
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}

            {result.details && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>File:</strong> {input.file_path}
                </p>
                {result.details.original_error && (
                  <p>
                    <strong>Original Error:</strong>{" "}
                    {result.details.original_error}
                  </p>
                )}
                {result.details.validation_passed !== undefined && (
                  <p>
                    <strong>Validation:</strong>{" "}
                    {result.details.validation_passed ? "Passed" : "Failed"}
                  </p>
                )}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Debug Section */}
      {isDebugEnabled && (
        <AccordionItem value="debug-info">
          <AccordionTrigger className="px-3 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span className="text-sm font-medium">Debug Information</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3">
            <DebugInformationTabs
              input={{ file_path: input.file_path }}
              output={result}
            />
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
