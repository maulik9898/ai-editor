export interface TokenUsageData {
  type: "token_usage";
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
