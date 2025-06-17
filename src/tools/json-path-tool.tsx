import { z } from "zod";
import { ToolDefinition } from "../types/tools";
import { JSONPathPreview } from "@/components/chat/json-path/json-path-preview";
import { ToolInvocation } from "ai";

// Define input schema
const jsonPathInputSchema = z.object({
  file_path: z
    .string()
    .describe("JSON file to query (must be currently open in editor)"),
  queries: z
    .array(
      z.object({
        query: z
          .string()
          .describe(
            "JSONPath expression (e.g., '$.fields[?(@.name == \"class\")].component'). CRITICAL: Always use selective, targeted queries. Avoid querying without a selective pattern to prevent context flooding.",
          ),
        description: z
          .string()
          .describe("Human readable description of what this query finds"),
        include_values: z
          .boolean()
          .describe(
            "CRITICAL: false = paths only (use for structure discovery), true = paths + values (use sparingly for specific data). Never use with Recursive queries to prevent context flooding.",
          ),
      }),
    )
    .describe("Array of JSONPath queries to execute"),
});

// Define output schema
const jsonPathOutputSchema = z.object({
  success: z.boolean(),
  file_path: z.string(),
  error: z.string().optional(),
  queries: z.array(
    z.object({
      query: z.string(),
      description: z.string(),
      include_values: z.boolean(),
      success: z.boolean(),
      error: z.string().optional(),
      matches: z.record(z.any()).optional(),
      execution_time: z.string().optional(),
    }),
  ),
  summary: z
    .object({
      total_queries: z.number(),
      successful_queries: z.number(),
      total_matches: z.number(),
    })
    .optional(),
});

export type JsonPathInput = z.infer<typeof jsonPathInputSchema>;
export type JsonPathOutput = z.infer<typeof jsonPathOutputSchema>;

export const jsonPathTool: ToolDefinition<JsonPathInput, JsonPathOutput> = {
  description:
    "Execute JSONPath queries on JSON files. MANDATORY: Always use selective, targeted queries only. Never use broad or recursive patterns.",

  parameters: jsonPathInputSchema,

  displayName: "JSONPath Tool",

  uiDescription:
    "Search and extract specific data from JSON files using query expressions",

  additionalSystemInstructions: `
    ### For JSON Discovery (query_json_path)
    **MANDATORY: Use only selective, targeted queries.**

    **GENERAL INSTRUCTION:**
    - You MUST use only and exclusively selective queries. Never use broad, recursive, or wildcard patterns that could return large datasets.Instead of calling this tool multiple times, combine multiple targeted queries into a single tool call.
    - JSONPath queries are for internal data analysis only - do not include the actual JSONPath expressions in your responses to users, only present the findings and results.

    **CRITICAL SAFETY RULES:**
    - ALWAYS filter results with conditions [?(@.property=='value')]
    - Use include_values: false for discovery, true only for small, specific data sets
    - Combine multiple targeted queries instead of using broad patterns
    - Only query for exactly what you need - no exploratory or "just in case" queries
    - Avoid calling this tool multiple times and combine multiple targeted queries into a single tool call.
    - All JSONPath queries MUST include a filter or index slice to return only the exact node(s) needed—no direct indexing into top-level arrays (e.g. $​.fields[3]) or unfiltered wildcard queries. Enforce include_values:false for discovery.
  `,

  clientExecute: async (args: JsonPathInput): Promise<JsonPathOutput> => {
    try {
      const { getEditorState } = await import("@/stores/editor-store");
      const { executeQuery } = await import(
        "@/components/chat/json-path/json-path-utils"
      );

      // Get file from editor store
      const editorState = getEditorState();
      const file = editorState.files[args.file_path];

      // File existence validation
      if (!file) {
        return {
          success: false,
          error: `File "${args.file_path}" is not currently open in the editor`,
          file_path: args.file_path,
          queries: [],
        };
      }

      // File type validation
      if (file.language !== "json" && file.language !== "jsonc") {
        return {
          success: false,
          error: `File "${args.file_path}" is not a JSON file (detected: ${file.language})`,
          file_path: args.file_path,
          queries: [],
        };
      }

      // Parse JSON
      let jsonObj;
      try {
        jsonObj = JSON.parse(file.content);
      } catch (parseError) {
        return {
          success: false,
          error: "Invalid JSON content",
          file_path: args.file_path,
          queries: [],
        };
      }

      // Execute queries
      const queryResults = args.queries.map((queryItem) =>
        executeQuery(jsonObj, queryItem),
      );

      const result: JsonPathOutput = {
        success: true,
        file_path: args.file_path,
        queries: queryResults,
        summary: {
          total_queries: args.queries.length,
          successful_queries: queryResults.filter((q) => q.success).length,
          total_matches: queryResults.length,
        },
      };

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        file_path: args.file_path,
        queries: [],
      };
    }
  },

  render: (toolInvocation: ToolInvocation) => {
    if (toolInvocation.state === "call") {
      return (
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm">Executing JSONPath queries...</span>
        </div>
      );
    }

    if (toolInvocation.state === "result") {
      const args = jsonPathInputSchema.parse(toolInvocation.args);
      const result = jsonPathOutputSchema.parse(toolInvocation.result);

      return <JSONPathPreview input={args} result={result} />;
    }

    return null;
  },
};
