"use client";

import {
  useCopilotAction,
  useCopilotAdditionalInstructions,
} from "@copilotkit/react-core";
import { JSONRepairComponent } from "./json-repair-component";

export function useJSONRepairTool() {
  useCopilotAdditionalInstructions({
    instructions: `
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
  });

  useCopilotAction({
    name: "repair_json",
    description:
      "Repair invalid JSON files using AI-powered analysis with knowledge base context. Generates specific edits to fix syntax errors while preserving data structure. Applies fixes automatically and validates results. Use this when JSON validation fails.",
    parameters: [
      {
        name: "file_path",
        type: "string",
        description: "Path to the JSON file to repair (must be currently open)",
        required: true,
      },
    ],
    renderAndWaitForResponse: ({ status, args, respond }) => {
      if (status === "inProgress") {
        return (
          <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span className="text-sm">
              Analyzing JSON for repair options...
            </span>
          </div>
        );
      }

      const { file_path } = args;

      if (!file_path) {
        console.log("🚨 JSON Repair Tool: No file path provided");
        respond?.({
          success: false,
          error: "No file path provided",
        });
        return <div className="text-red-600">No file path provided</div>;
      }

      return (
        <JSONRepairComponent
          filePath={file_path}
          onResult={(result) => {
            console.log("📤 JSON Repair Tool: Sending response to AI:", result);
            respond?.(result);
          }}
        />
      );
    },
  });
}
