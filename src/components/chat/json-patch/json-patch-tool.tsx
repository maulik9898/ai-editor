"use client";

import {
  useCopilotAction,
  useCopilotAdditionalInstructions,
} from "@copilotkit/react-core";
import { useEditorContext } from "@/contexts/editor-context";
import { JSONPatchPreview } from "./json-patch-preview";
import { JsonPatchOperation } from "json-joy/esm/json-patch";
import { parseJsonValue, validateOperationsIndividually } from "./patch-utils";

export function useJSONPatchTool() {
  const { state, actions } = useEditorContext();

  useCopilotAdditionalInstructions({
    instructions: `
    ### For JSON Modifications (suggest_json_patch)
    Use RFC 6902 JSON Patch operations:
    - **add**: Insert new properties or array elements
    - **remove**: Delete existing properties or elements
    - **replace**: Update existing values
    - **move**: Relocate properties or elements
    - **copy**: Duplicate properties or elements
`,
  });

  useCopilotAction({
    name: "suggest_json_patch",
    description:
      "Suggest RFC 6902 JSON Patch operations to the user for a JSON file currently open in the editor. Only include operations for a single file per tool call. Make sure to give valid Path.",
    parameters: [
      {
        name: "file_path",
        type: "string",
        description:
          "Path to the JSON file to modify (must be currently open in editor)",
        required: true,
      },
      {
        name: "description",
        type: "string",
        description: "Human readable description of the changes being made",
        required: true,
      },
      {
        name: "operations",
        type: "object[]",
        description: "Array of RFC 6902 JSON Patch operations",
        required: true,
        attributes: [
          {
            name: "op",
            type: "string",
            description:
              "Operation type: add, remove, replace, move, copy, test",
            required: true,
            enum: ["add", "remove", "replace", "move", "copy"],
          },
          {
            name: "path",
            type: "string",
            description:
              "JSON Pointer path (e.g. '/config/debug'). Index starts with 0",
            required: true,
          },
          {
            name: "value",
            type: "string",
            description:
              "Value for add/replace operations (not required for remove)",
            required: false,
          },
          {
            name: "from",
            type: "string",
            description: "Source path for move/copy operations",
            required: false,
          },
        ],
      },
    ],
    handler: async (args) => {
      const { file_path, operations } = args;
      const file = state.files[file_path];
      const patchOperations: JsonPatchOperation[] =
        operations
          ?.map((op) => {
            const { op: operation, path, value, from } = op;
            if (operation === "add") {
              return {
                op: "add" as const,
                path: path,
                value: value,
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
      if (!file) {
        const errorMsg = `File "${file_path}" is not currently open in the editor`;
        return {
          success: false,
          errors: [errorMsg],
          instructions:
            "Please use a file that is currently open in the editor.",
        };
      }

      // File type validation
      if (file.language !== "json" && file.language !== "jsonc") {
        const errorMsg = `File "${file_path}" is not a JSON file (detected: ${file.language})`;
        return {
          success: false,
          errors: [errorMsg],
          instructions: "Only use JSON files for patch operations.",
        };
      }

      // Individual operation validation
      const validation = validateOperationsIndividually(
        file.content,
        patchOperations,
      );

      if (!validation.isValid) {
        console.log(validation);

        const failedOps = validation.failedOperationIndices
          .map((i) => i + 1)
          .join(", ");
        return {
          success: false,
          errors: validation.errors,
          instructions: `Operations ${failedOps} failed validation. Only regenerate these failed operations. Do not include the successful operations.`,
        };
      }

      return {
        success: true,
        errors: [],
        instructions:
          "Your changes are suggested to user.User will apply this later",
      };
    },
    render: ({ args, status }) => {
      const { file_path, description, operations } = args;
      if (!file_path) {
        return <></>;
      }
      if (!description) {
        return <></>;
      }

      // Capture file content at render time for immutable snapshot
      const file = state.files[file_path];
      const file_content = file?.content || "";

      const patchOperations: JsonPatchOperation[] =
        operations
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

      // All operations are valid, show preview
      return (
        <JSONPatchPreview
          file_path={file_path}
          file_content={file_content}
          description={description}
          operations={patchOperations || []}
          status={status}
        />
      );
    },
  });
}
