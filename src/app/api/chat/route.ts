import { createOpenAI } from "@ai-sdk/openai";
import { createDataStreamResponse, streamText, UIMessage } from "ai"; // Add createDataStreamResponse
import { getModelName, isCopilotEnabled } from "@/utils/openai-client";
import { getCopilotToken } from "@/utils/copilot-token";
import { getEnabledTools, ToolName } from "@/tools/registry";

export async function POST(req: Request) {
  const {
    messages,
    systemPrompt,
    enabledTools = [] as ToolName[],
  }: {
    messages: UIMessage[];
    systemPrompt: string;
    enabledTools?: ToolName[];
  } = await req.json();

  const headers: Record<string, string> = {};

  if (isCopilotEnabled()) {
    const copilotToken = await getCopilotToken();
    headers.Authorization = `Bearer ${copilotToken}`;
    headers["Editor-Version"] = "ZED/1.1.1";
    headers["Content-Type"] = "application/json";
    headers["Copilot-Integration-Id"] = "vscode-chat";
  }

  const openai = createOpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
    headers,
  });

  const modelName = getModelName();
  const tools = getEnabledTools(enabledTools);

  // Use createDataStreamResponse instead of toDataStreamResponse
  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: openai(modelName, { structuredOutputs: false }),
        messages,
        temperature: parseFloat(process.env.NEXT_PUBLIC_TEMPERATURE || "0.7"),
        system: systemPrompt,
        tools,
        experimental_telemetry: { isEnabled: true },
        providerOptions: {
          openai: {
            reasoningEffort: "low",
          },
        },
        onError: (error) => {
          console.error("OpenAI error:", error);
        },
        onFinish: ({ usage, reasoningDetails }) => {
          const { promptTokens, completionTokens, totalTokens } = usage;
          console.log("Reasoning details:", reasoningDetails);

          // Stream token usage data
          dataStream.writeData({
            type: "token_usage",
            usage: {
              promptTokens,
              completionTokens,
              totalTokens,
            },
          });

          // Log for debugging (optional)
          console.log("Prompt tokens:", promptTokens);
          console.log("Completion tokens:", completionTokens);
          console.log("Total tokens:", totalTokens);
        },
      });

      // Merge the streamText result into the data stream
      result.mergeIntoDataStream(dataStream);
    },
  });
}
