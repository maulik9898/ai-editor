import { ToolDefinition } from "@/types/tools";
import { ToolInvocation } from "ai";
import { z } from "zod";
import { DiagnosticPreview } from "./preview";

// Define input schema
const diagnosticInputSchema = z.object({
  file_path: z
    .string()
    .describe(
      "Path to the Let's Form JSON file to analyze (must be currently open in editor)",
    ),
});

// Define output schema for type safety
const diagnosticOutputSchema = z.object({
  success: z.boolean(),
  file_path: z.string(),
  diagnostics: z
    .object({
      duplicatedNames: z
        .record(
          z.object({
            paths: z.array(z.string()),
            component: z.string(),
          }),
        )
        .optional(),
      invalidNames: z
        .record(
          z.object({
            paths: z.array(z.string()),
            component: z.string(),
          }),
        )
        .optional(),
    })
    .optional(),
  summary: z
    .object({
      totalIssues: z.number(),
      duplicateCount: z.number(),
      invalidCount: z.number(),
    })
    .optional(),
  jsonError: z.string().optional(),
});

export type DiagnosticInput = z.infer<typeof diagnosticInputSchema>;
export type DiagnosticOutput = z.infer<typeof diagnosticOutputSchema>;

export const diagnosticTool: ToolDefinition<DiagnosticInput, DiagnosticOutput> =
  {
    description:
      "Analyze Let's Form JSON schema for duplicate field names, invalid field names, and JSON parsing errors. This helps identify common form configuration issues.",

    parameters: diagnosticInputSchema,

    displayName: "Diagnostic Tool",
    uiDescription:
      "Find duplicate field names and validation issues in Let's Form schemas",

    additionalSystemInstructions: `
      ### Let's Form Schema Diagnostics (diagnose_letsform_schema)

      **Purpose**: Use this tool to find duplicate names and invalid names in forms. Analyzes Let's Form JSON schemas for common issues:
      - Duplicate field names that cause form conflicts
      - Invalid field names that don't follow JavaScript variable naming
      - JSON parsing errors in schema files

      **Usage**: Call this tool to find duplicate names and invalid names in form.

      **When to Use**:
      - To find duplicate names and invalid names in forms
      - When users report form submission issues
      - When user asks to find issue with the form
      - To identify fields that need renaming
    `,

    clientExecute: async (args: DiagnosticInput): Promise<DiagnosticOutput> => {
      try {
        const { diagnoseLetsFormSchema } = await import("./utils");
        const { getEditorState } = await import("@/stores/editor-store");

        // Get file content from editor store
        const editorState = getEditorState();
        const file = editorState.files[args.file_path];

        if (!file) {
          return {
            success: false,
            file_path: args.file_path,
            jsonError: `File "${args.file_path}" not found`,
          };
        }

        // Run actual diagnostic on file content
        return diagnoseLetsFormSchema(file.content, args.file_path);
      } catch (error) {
        return {
          success: false,
          file_path: args.file_path,
          jsonError: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    render: (toolInvocation: ToolInvocation) => {
      // Fixed: explicit type annotation
      if (toolInvocation.state === "call") {
        return (
          <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">Analyzing Let's Form schema...</span>
          </div>
        );
      }

      if (toolInvocation.state === "result") {
        const args = diagnosticInputSchema.parse(toolInvocation.args);
        const result = diagnosticOutputSchema.parse(toolInvocation.result);
        return <DiagnosticPreview input={args} result={result} />;
      }

      return null;
    },
  };
