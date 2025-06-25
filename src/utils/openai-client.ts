import OpenAI from "openai";
import Langfuse, { observeOpenAI } from "langfuse";
import { getCopilotToken } from "./copilot-token";

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_HOST,
});

export interface OpenAIClientOptions {
  withLangfuse?: boolean;
  additionalHeaders?: Record<string, string>;
}

/**
 * Creates an OpenAI client based on environment configuration
 * Will use GitHub Copilot API if USE_COPILOT_API=true, otherwise direct OpenAI
 */
export async function getOpenAIClient(
  options: OpenAIClientOptions = {},
): Promise<OpenAI> {
  const { withLangfuse = true, additionalHeaders = {} } = options;

  let openaiClient: OpenAI;
  let apiProvider: string;

  // Check if we should use Copilot API or direct OpenAI
  if (process.env.USE_COPILOT_API === "true") {
    try {
      console.log("🤖 Attempting to use GitHub Copilot API...");
      const copilotToken = await getCopilotToken();

      openaiClient = new OpenAI({
        defaultHeaders: {
          Authorization: `Bearer ${copilotToken}`,
          "Editor-Version": "ZED/1.1.1",
          "Content-Type": "application/json",
          "Copilot-Integration-Id": "vscode-chat",
          ...additionalHeaders,
        },
      });

      apiProvider = "GitHub Copilot";
    } catch (error) {
      console.warn(
        "⚠️ Failed to initialize Copilot API, falling back to OpenAI:",
        error,
      );

      // Fall back to direct OpenAI
      openaiClient = new OpenAI({});

      apiProvider = "OpenAI (Copilot Fallback)";
      console.log("✅ Fallback to direct OpenAI API successful");
    }
  } else {
    console.log("🔧 Using direct OpenAI API (Copilot disabled)");

    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is required when USE_COPILOT_API is disabled",
      );
    }

    openaiClient = new OpenAI({});

    apiProvider = "OpenAI Direct";
    console.log("✅ Direct OpenAI API initialized");
  }

  // Optionally wrap with Langfuse for observability
  if (withLangfuse) {
    const observedClient = observeOpenAI(openaiClient, {
      release: "0.11",
      metadata: {
        provider: apiProvider,
        copilotEnabled: process.env.USE_COPILOT_API === "true",
      },
    });

    console.log(
      `📊 OpenAI client wrapped with Langfuse observability (Provider: ${apiProvider})`,
    );
    return observedClient;
  }

  console.log(`🚀 OpenAI client ready (Provider: ${apiProvider})`);
  return openaiClient;
}

/**
 * Gets the model name from environment variables
 */
export function getModelName(): string {
  const model = process.env.OPENAI_MODEL;
  if (!model) {
    throw new Error("OPENAI_MODEL environment variable is required");
  }
  return model;
}

/**
 * Utility to check if Copilot API is enabled
 */
export function isCopilotEnabled(): boolean {
  return process.env.USE_COPILOT_API === "true";
}
