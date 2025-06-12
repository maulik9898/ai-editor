import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

import { getOpenAIClient } from "@/utils/openai-client";


const runtime = new CopilotRuntime({});

export const POST = async (req: NextRequest) => {
  const openai = await getOpenAIClient({
    withLangfuse: true,
  });

  const serviceAdapter = new OpenAIAdapter({
    openai,
    model: process.env.OPENAI_MODEL!,
    keepSystemRole: true,
    disableParallelToolCalls: true,
  });
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: req.nextUrl.pathname,
    logLevel: "debug",
  });

  return handleRequest(req);
};
