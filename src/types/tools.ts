import { z } from "zod";
import { ToolInvocation } from "ai";

export interface ToolDefinition<TInput = any, TOutput = any> {
  description: string;
  parameters: z.ZodSchema<TInput>;
  execute?: (args: TInput) => Promise<TOutput>; // Server-side execution
  clientExecute?: (args: TInput) => Promise<TOutput>; // Client-side execution
  render?: (
    toolInvocation: ToolInvocation,
    addToolResult?: (result: { toolCallId: string; result: any }) => void,
  ) => React.ReactNode;
  displayName: string; // Human-readable name for UI
  uiDescription: string; // Human-readable description for UI
  additionalSystemInstructions?: string; // Extra instructions for the system Prompt
}

export type ToolRegistry = Record<string, ToolDefinition<any, any>>;
