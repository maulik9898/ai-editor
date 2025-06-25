import { z } from "zod";
import { ToolDefinition } from "@/types/tools";
import { JSONPatchPreview } from "./preview";
import { ToolInvocation } from "ai";
import { JsonPatchOperation } from "json-joy/esm/json-patch";

// Define input schema
const jsonPatchInputSchema = z.object({
  file_path: z
    .string()
    .describe(
      "Path to the JSON file to modify (must be currently open in editor)",
    ),
  description: z
    .string()
    .describe("Human readable description of the changes being made"),
  operations: z
    .array(
      z.object({
        op: z
          .enum(["add", "remove", "replace", "move", "copy"])
          .describe("Operation type: add, remove, replace, move, copy"),
        path: z
          .string()
          .describe(
            "JSON Pointer path (e.g. '/config/debug'). Index starts with 0",
          ),
        value: z
          .any()
          .optional()
          .describe(
            "Value for add/replace operations (not required for remove, pass empty string)",
          ),
        from: z
          .string()
          .optional()
          .describe(
            "Source path for move/copy operations. (not required for add/replace, pass empty string)",
          ),
      }),
    )
    .describe("Array of RFC 6902 JSON Patch operations"),
});

// Define output schema
const jsonPatchOutputSchema = z.object({
  success: z.boolean(),
  file_path: z.string(),
  description: z.string(),
  operations: z.array(z.any()), // JsonPatchOperation type
  errors: z.array(z.string()).optional(),
  instructions: z.string().optional(),
});

export type JsonPatchInput = z.infer<typeof jsonPatchInputSchema>;
export type JsonPatchOutput = z.infer<typeof jsonPatchOutputSchema>;

export const jsonPatchTool: ToolDefinition<JsonPatchInput, JsonPatchOutput> = {
  description:
    "Suggest RFC 6902 JSON Patch operations to the user for a JSON file currently open in the editor. Only include operations for a single file per tool call. Make sure to give valid Path.",

  parameters: jsonPatchInputSchema,

  displayName: "JSON Patch Tool",

  uiDescription:
    "Create precise edit operations for JSON files that you can review and apply",

  additionalSystemInstructions: `
    ### For JSON Modifications (suggest_json_patch)
    Use RFC 6902 JSON Patch operations:
    - **add**: Insert new properties or array elements
    - **remove**: Delete existing properties or elements
    - **replace**: Update existing values
    - **move**: Relocate properties or elements
    - **copy**: Duplicate properties or elements
  `,

  clientExecute: async (args: JsonPatchInput): Promise<JsonPatchOutput> => {
    try {
      const { getEditorState } = await import("@/stores/editor-store");
      const { validateOperationsIndividually, parseJsonValue } = await import(
        "./utils"
      );

      // Get file from editor store
      const editorState = getEditorState();
      const file = editorState.files[args.file_path];

      // Convert operations to JsonPatchOperation format FIRST
      const patchOperations: JsonPatchOperation[] =
        args.operations
          ?.map((op) => {
            const { op: operation, path, value, from } = op;
            if (operation === "add") {
              return {
                op: "add" as const,
                path: path,
                value: parseJsonValue(value),
              };
            } else if (operation === "replace") {
              return {
                op: "replace" as const,
                path: path,
                value: parseJsonValue(value),
              };
            } else if (operation === "remove") {
              return {
                op: "remove" as const,
                path: path,
              };
            } else if (operation === "move") {
              return {
                op: "move" as const,
                path: path,
                from: from!,
              };
            } else if (operation === "copy") {
              return {
                op: "copy" as const,
                path: path,
                from: from!,
              };
            }
          })
          .filter((f) => f != undefined) || [];

      if (!file) {
        return {
          success: false,
          file_path: args.file_path,
          description: args.description,
          operations: patchOperations, // ✅ Return operations even on error
          errors: [
            `File "${args.file_path}" is not currently open in the editor`,
          ],
          instructions:
            "Please use a file that is currently open in the editor.",
        };
      }

      // File type validation
      if (file.language !== "json" && file.language !== "jsonc") {
        return {
          success: false,
          file_path: args.file_path,
          description: args.description,
          operations: patchOperations, // ✅ Return operations even on error
          errors: [
            `File "${args.file_path}" is not a JSON file (detected: ${file.language})`,
          ],
          instructions: "Only use JSON files for patch operations.",
        };
      }

      // Validate operations
      const validation = validateOperationsIndividually(
        file.content,
        patchOperations,
      );

      if (!validation.isValid) {
        const failedOps = validation.failedOperationIndices
          .map((i) => i + 1)
          .join(", ");
        return {
          success: false,
          file_path: args.file_path,
          description: args.description,
          operations: patchOperations, // ✅ Return operations even on validation failure
          errors: validation.errors,
          instructions: `Operations ${failedOps} failed validation. Only regenerate these failed operations. Do not include the successful operations.`,
        };
      }

      return {
        success: true,
        file_path: args.file_path,
        description: args.description,
        operations: patchOperations,
        instructions:
          "Your changes are suggested to user. User will apply this later",
      };
    } catch (error) {
      // Convert operations even on catch
      const patchOperations: JsonPatchOperation[] =
        args.operations
          ?.map((op) => {
            const { op: operation, path, value, from } = op;
            if (operation === "add") {
              return {
                op: "add" as const,
                path: path,
                value: value, // Don't parse on error to avoid additional failures
              };
            } else if (operation === "replace") {
              return {
                op: "replace" as const,
                path: path,
                value: value,
              };
            } else if (operation === "remove") {
              return {
                op: "remove" as const,
                path: path,
              };
            } else if (operation === "move") {
              return {
                op: "move" as const,
                path: path,
                from: from!,
              };
            } else if (operation === "copy") {
              return {
                op: "copy" as const,
                path: path,
                from: from!,
              };
            }
          })
          .filter((f) => f != undefined) || [];

      return {
        success: false,
        file_path: args.file_path,
        description: args.description,
        operations: patchOperations, // ✅ Return operations even on error
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  },

  render: (toolInvocation: ToolInvocation) => {
    if (toolInvocation.state === "call") {
      return (
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm">Preparing JSON patch operations...</span>
        </div>
      );
    }

    if (toolInvocation.state === "result") {
      const args = jsonPatchInputSchema.parse(toolInvocation.args);
      const result = jsonPatchOutputSchema.parse(toolInvocation.result);

      // ✅ ALWAYS show JSONPatchPreview - removed early error return
      // Get file content for preview
      const { getEditorState } = require("@/stores/editor-store");
      const editorState = getEditorState();
      const file = editorState.files[args.file_path];
      const file_content = file?.content || "";

      return (
        <JSONPatchPreview
          args={args}
          result={result}
          file_content={file_content}
        />
      );
    }

    return null;
  },
};
