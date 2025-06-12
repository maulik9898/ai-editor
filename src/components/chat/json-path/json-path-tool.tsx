"use client";

import {
  useCopilotAction,
  useCopilotAdditionalInstructions,
} from "@copilotkit/react-core";
import { useEditorContext } from "@/contexts/editor-context";
import { JSONPathPreview, JSONPathLoadingView } from "./json-path-preview";
import { JSONPathResult, executeQuery } from "./json-path-utils";

export interface JSONPathToolProps {
  file_path: string;
  queries: {
    query: string;
    description: string;
    include_values: boolean;
  }[];
}

export function useJSONPathTool() {
  const { state: editorState } = useEditorContext();

  useCopilotAdditionalInstructions({
    instructions: `
    ### For JSON Discovery (query_json_path)
    **MANDATORY: Use only selective, targeted queries.**

    **GENERAL INSTRUCTION:**
    You MUST use only and exclusively selective queries. Never use broad, recursive, or wildcard patterns that could return large datasets.

    **CRITICAL SAFETY RULES:**
    - ALWAYS filter results with conditions [?(@.property=='value')]
    - Use include_values: false for discovery, true only for small, specific data sets
    - Combine multiple targeted queries instead of using broad patterns
    - Only query for exactly what you need - no exploratory or "just in case" queries
`,
  });

  useCopilotAction({
    name: "query_json_path",
    description: `Execute JSONPath queries on JSON files. MANDATORY: Always use selective, targeted queries only. Never use broad or recursive patterns.`,
    parameters: [
      {
        name: "file_path",
        type: "string",
        description: "JSON file to query (must be currently open in editor)",
        required: true,
      },
      {
        name: "queries",
        type: "object[]",
        description: "Array of JSONPath queries to execute",
        required: true,
        attributes: [
          {
            name: "query",
            type: "string",
            description:
              "JSONPath expression (e.g., '$.fields[?(@.name == \"class\")].component'). CRITICAL: Always use selective, targeted queries. Avoid querying without a selective pattern to prevent context flooding.",
            required: true,
          },
          {
            name: "description",
            type: "string",
            description: "Human readable description of what this query finds",
            required: true,
          },
          {
            name: "include_values",
            type: "boolean",
            description:
              "CRITICAL: false = paths only (use for structure discovery), true = paths + values (use sparingly for specific data). Never use with Recursive queries to prevent context flooding.",
            required: true,
          },
        ],
      },
    ],
    renderAndWaitForResponse: ({ status, args, respond }) => {
      if (status === "inProgress") {
        return <JSONPathLoadingView />;
      }

      const { file_path, queries } = args;

      // File validation
      const file = editorState.files[file_path];
      if (!file) {
        const result = {
          success: false,
          error: `File "${file_path}" is not currently open in the editor`,
          file_path,
          queries: [],
        } as JSONPathResult;
        respond?.(result);
        return <JSONPathPreview input={args} result={result} />;
      }

      if (file.language !== "json" && file.language !== "jsonc") {
        const result = {
          success: false,
          error: `File "${file_path}" is not a JSON file (detected: ${file.language})`,
          file_path,
          queries: [],
        } as JSONPathResult;
        respond?.(result);
        return <JSONPathPreview input={args} result={result} />;
      }

      try {
        const jsonObj = JSON.parse(file.content);
        const queryResults = queries.map((queryItem: any) =>
          executeQuery(jsonObj, queryItem),
        );

        const result: JSONPathResult = {
          success: true,
          file_path,
          queries: queryResults,
          summary: {
            total_queries: queries.length,
            successful_queries: queryResults.filter((q) => q.success).length,
            total_matches: queryResults.length,
          },
        };
        const returnreponse = result.queries.map((query) => {
          return {
            matches: query.matches || [],
            error: query.error || null,
            query: query.query,
            success: query.success,
          };
        });
        respond?.(returnreponse);
        return <JSONPathPreview input={args} result={result} />;
      } catch (parseError) {
        const result = {
          success: false,
          error: "Invalid JSON content",
          file_path,
          queries: [],
        } as JSONPathResult;
        respond?.(result);
        return <JSONPathPreview input={args} result={result} />;
      }
    },
  });
}
