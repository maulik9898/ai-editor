import { OpenAI } from "openai";
import { NextRequest } from "next/server";
import { getCopilotToken } from "@/utils/copilot-token";
import { getOpenAIClient } from "@/utils/openai-client";

export interface JSONRepairRequest {
  prompt: string;
  content: string;
  error: string;
  knowledgeBase?: string;
}

export const POST = async (req: NextRequest) => {
  try {
    const { prompt, content, error, knowledgeBase }: JSONRepairRequest =
      await req.json();

    if (!prompt || !content) {
      return new Response(
        JSON.stringify({ error: "Missing prompt or content" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get OpenAI token (reusing your existing auth)
    const copilotToken = await getCopilotToken();

    const openai = await getOpenAIClient({
      withLangfuse: false, // Disable for streaming response
    });

    // Create the full prompt with the template
    const fullPrompt = createJSONRepairPrompt(content, error, knowledgeBase);

    // Stream the response
    const stream = await openai.chat.completions.create({
      model: process.env.JSON_FIX_MODEL!,

      messages: [
        {
          role: "system",
          content:
            "You are a JSON repair specialist. Follow the exact format requirements and use any provided knowledge base context for better understanding.",
        },
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      stream: true,
      temperature: 0, // Keep deterministic for JSON repair
    });

    // Create a ReadableStream to forward the OpenAI stream
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              // Send each chunk as text
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("JSON repair agent error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

function createJSONRepairPrompt(
  content: string,
  error: string,
  knowledgeBase?: string,
): string {
  const knowledgeBaseSection = knowledgeBase
    ? `
<knowledge_base>
${knowledgeBase}

Use this knowledge base to understand the context and expected structure of the JSON being repaired. This may contain form schema information, validation rules, or other relevant context.
</knowledge_base>
`
    : "";

  return `You MUST respond with a series of edits to fix JSON syntax errors, using the following format:

\`\`\`
<edits>

<old_text>
OLD TEXT 1 HERE
</old_text>
<new_text>
NEW TEXT 1 HERE
</new_text>

<old_text>
OLD TEXT 2 HERE
</old_text>
<new_text>
NEW TEXT 2 HERE
</new_text>

</edits>
\`\`\`

# JSON Repair Instructions

- Use \`<old_text>\` and \`<new_text>\` tags to replace content
- \`<old_text>\` must exactly match existing file content, including indentation
- \`<old_text>\` must come from the actual file, not an outline
- \`<old_text>\` cannot be empty
- Be minimal with replacements:
  - For unique lines, include only those lines
  - For non-unique lines, include enough context to identify them
- Do not escape quotes, newlines, or other characters within tags
- For multiple occurrences, repeat the same tag pair for each instance
- Edits are sequential - each assumes previous edits are already applied
- Only fix JSON syntax errors - do not modify the data structure
- Always close all tags properly
- Use knowledge base context to understand expected structure and values

<example>
<edits>

<old_text>
{
  "name": "John"
  "age": 30
}
</old_text>
<new_text>
{
  "name": "John",
  "age": 30
}
</new_text>

</edits>
</example>

${knowledgeBaseSection}

<json_content>
${content}
</json_content>

<error_description>
JSON Parse Error: ${error}

Fix only the syntax errors that are causing this JSON to be invalid. Focus on:
- Missing commas
- Missing or incorrect quotes
- Missing brackets or braces
- Trailing commas
- Invalid characters

Do not modify the structure or content, only fix syntax issues. Use the knowledge base context to understand the intended structure and values.
</error_description>

Tool calls have been disabled. You MUST start your response with <edits>.`;
}
