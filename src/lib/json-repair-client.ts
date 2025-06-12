export interface StreamingRepairOptions {
  content: string;
  error: string;
  knowledgeBase?: string;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export class JSONRepairClient {
  static async streamRepair({
    content,
    error,
    knowledgeBase,
    onChunk,
    onComplete,
    onError,
  }: StreamingRepairOptions): Promise<string> {
    try {
      const response = await fetch("/api/json-repair-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "repair", // Simple identifier
          content,
          error,
          knowledgeBase,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream available");
      }

      let fullResponse = "";
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;

          // Call chunk handler if provided
          onChunk?.(chunk);
        }

        // Call completion handler
        onComplete?.(fullResponse);

        return fullResponse;
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      onError?.(err);
      throw err;
    }
  }

  /**
   * Non-streaming version for simple use cases
   */
  static async repairJSON(
    content: string,
    error: string,
    knowledgeBase?: string,
  ): Promise<string> {
    return this.streamRepair({ content, error, knowledgeBase });
  }
}
