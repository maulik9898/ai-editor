import { diagnosticTool } from "./diagnostic-tool";
import { jsonPatchTool } from "./json-patch-tool";
import { jsonPathTool } from "./json-path-tool";
import { jsonRepairTool } from "./json-repair-tool";

export const toolRegistry = {
  diagnose_letsform_schema: diagnosticTool,
  suggest_json_patch: jsonPatchTool,
  query_json_path: jsonPathTool,
  repair_json: jsonRepairTool,
} as const;

export type ToolName = keyof typeof toolRegistry;

// Helper functions
export function getEnabledTools(enabledToolNames: ToolName[]) {
  return Object.fromEntries(
    enabledToolNames
      .filter((name) => name in toolRegistry)
      .map((name) => [
        name,
        {
          description: toolRegistry[name].description,
          parameters: toolRegistry[name].parameters,
          execute: toolRegistry[name].execute,
        },
      ]),
  );
}

export function getClientToolHandlers() {
  return Object.fromEntries(
    Object.entries(toolRegistry)
      .filter(([_, tool]) => tool.clientExecute)
      .map(([name, tool]) => [name, tool.clientExecute!]),
  ) as Record<string, ((args: any) => Promise<any>) | undefined>;
}

export function getToolRenderer(toolName: string) {
  return toolRegistry[toolName as ToolName]?.render;
}

export function getAllAdditionalInstructions(enabledToolNames?: ToolName[]) {
  const toolsToCheck =
    enabledToolNames || (Object.keys(toolRegistry) as ToolName[]);
  return toolsToCheck
    .filter((name) => name in toolRegistry)
    .map((name) => toolRegistry[name].additionalSystemInstructions)
    .filter(Boolean) // Remove undefined/null values
    .join("\n\n");
}
