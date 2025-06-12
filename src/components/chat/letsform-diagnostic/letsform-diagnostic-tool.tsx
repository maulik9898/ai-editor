"use client";

import {
  useCopilotAction,
  useCopilotAdditionalInstructions,
} from "@copilotkit/react-core";
import { useEditorContext } from "@/contexts/editor-context";
import { diagnoseLetsFormSchema } from "./diagnostic-utils";
import { DiagnosticPreview, DiagnosticLoadingView } from "./diagnostic-preview";

export function useLetsFormDiagnostic() {
  const { state } = useEditorContext();

  useCopilotAdditionalInstructions({
    instructions: `
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
  });

  useCopilotAction({
    name: "diagnose_letsform_schema",
    description:
      "Analyze Let's Form JSON schema for duplicate field names, invalid field names, and JSON parsing errors. This helps identify common form configuration issues.",
    parameters: [
      {
        name: "file_path",
        type: "string",
        description:
          "Path to the Let's Form JSON file to analyze (must be currently open in editor)",
        required: true,
      },
    ],
    renderAndWaitForResponse: ({ status, args, respond }) => {
      if (status === "inProgress") {
        return <DiagnosticLoadingView />;
      }

      const { file_path } = args;
      const file = state.files[file_path];

      // File existence validation
      if (!file) {
        const result = {
          success: false as const,
          jsonError: `File "${file_path}" is not currently open in the editor`,
          file_path,
        };
        respond?.(result);
        return <DiagnosticPreview input={args} result={result} />;
      }

      // File type validation
      if (file.language !== "json" && file.language !== "jsonc") {
        const result = {
          success: false as const,
          jsonError: `File "${file_path}" is not a JSON file (detected: ${file.language})`,
          file_path,
        };
        respond?.(result);
        return <DiagnosticPreview input={args} result={result} />;
      }

      // Validate file content is not empty
      if (!file.content.trim()) {
        const result = {
          success: false as const,
          jsonError: `File "${file_path}" appears to be empty`,
          file_path,
        };
        respond?.(result);
        return <DiagnosticPreview input={args} result={result} />;
      }

      // Run diagnostic analysis
      const result = diagnoseLetsFormSchema(file.content, file_path);

      // Prepare response for AI
      if (result.success) {
        const { diagnostics, summary } = result;

        // Create a structured response for the AI
        const aiResponse = {
          success: true,
          summary: {
            totalIssues: summary.totalIssues,
            duplicateCount: summary.duplicateCount,
            invalidCount: summary.invalidCount,
          },
          issues: {
            duplicates: diagnostics.duplicatedNames
              ? Object.keys(diagnostics.duplicatedNames)
              : [],
            invalid: diagnostics.invalidNames
              ? Object.keys(diagnostics.invalidNames)
              : [],
          },
          details: {
            duplicatedNames: diagnostics.duplicatedNames || {},
            invalidNames: diagnostics.invalidNames || {},
          },
        };

        respond?.(aiResponse);
      } else {
        respond?.(result);
      }

      return <DiagnosticPreview input={args} result={result} />;
    },
  });
}
