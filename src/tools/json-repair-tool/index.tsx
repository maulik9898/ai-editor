import { z } from "zod";
import { ToolDefinition } from "@/types/tools";
import { JSONRepairComponent } from "./component";
import { ToolInvocation } from "ai";
import { JSONRepairResultView } from "./json-repair-result";

// Define input schema
const jsonRepairInputSchema = z.object({
  file_path: z
    .string()
    .describe("Path to the JSON file to repair (must be currently open)"),
});

// Define output schema
const jsonRepairOutputSchema = z.object({
  success: z.boolean(),
  method: z.string().optional(),
  changes_applied: z.boolean().optional(),
  edits_count: z.number().optional(),
  message: z.string(),
  error: z.string().optional(),
  details: z
    .object({
      original_error: z.string().optional(),
      fixes_applied: z.number().optional(),
      validation_passed: z.boolean().optional(),
      remaining_error: z.string().optional(),
      edit_errors: z.array(z.string()).optional(),
    })
    .optional(),
});

export type JsonRepairInput = z.infer<typeof jsonRepairInputSchema>;
export type JsonRepairOutput = z.infer<typeof jsonRepairOutputSchema>;

export const jsonRepairTool: ToolDefinition<JsonRepairInput, JsonRepairOutput> =
  {
    description:
      "Repair invalid JSON files using AI-powered analysis with knowledge base context. Generates specific edits to fix syntax errors while preserving data structure. Applies fixes automatically and validates results. Use this when JSON validation fails.",

    parameters: jsonRepairInputSchema,

    displayName: "JSON Repair",

    uiDescription:
      "Fix broken JSON files automatically using AI to detect and repair syntax errors",

    additionalSystemInstructions: `
      ### JSON Repair Tool (repair_json)
      **Purpose**: Fix invalid JSON files using AI-powered analysis and repairs with knowledge base context.

      **Workflow**:
      1. Validate JSON and identify syntax errors
      2. Use AI to analyze errors with knowledge base context
      3. Generate specific, targeted edits to fix syntax issues
      4. Apply AI edits automatically and validate result
      5. Return success/failure with validation results

      **AI Features**:
      - Context-aware repairs using your knowledge base
      - Understands form schemas and validation rules
      - Preserves data structure while fixing syntax
      - Provides specific, minimal edits

      **When to Use**:
      - When JSON files have syntax errors
      - Before other JSON tools (JSONPath, JSONPatch) if validation fails
      - When user reports JSON parsing issues
      - When validation errors prevent form functionality
      - For complex JSON structures that need context understanding
    `,

    render: (toolInvocation: ToolInvocation, addToolResult) => {
      if (toolInvocation.state === "partial-call") {
        return (
          <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span className="text-sm">
              Analyzing JSON for repair options...
            </span>
          </div>
        );
      }

      if (toolInvocation.state === "result") {
        const args = jsonRepairInputSchema.parse(toolInvocation.args);
        const result = jsonRepairOutputSchema.parse(toolInvocation.result);

        return <JSONRepairResultView result={result} input={args} />;
      }

      // Interactive state - show repair component
      if (toolInvocation.state === "call" && addToolResult) {
        const args = jsonRepairInputSchema.parse(toolInvocation.args);

        return (
          <JSONRepairComponent
            filePath={args.file_path}
            onResult={(repairResult) => {
              // Call addToolResult with the repair result
              addToolResult({
                toolCallId: toolInvocation.toolCallId,
                result: repairResult,
              });
            }}
          />
        );
      }

      return null;
    },
  };
