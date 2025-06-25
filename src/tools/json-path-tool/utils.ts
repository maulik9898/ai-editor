import { JSONPath } from "jsonpath-plus";

export type QueryMatch = Record<
  string,
  object | string | number | boolean | null
>;

export interface QueryResult {
  query: string;
  description: string;
  include_values: boolean;
  success: boolean;
  error?: string;
  matches?: QueryMatch;
  execution_time?: string;
}

export interface JSONPathResult {
  success: boolean;
  file_path: string;
  error?: string;
  queries: QueryResult[];
  summary?: {
    total_queries: number;
    successful_queries: number;
    total_matches: number;
  };
}

/**
 * Execute a single JSONPath query
 */
export function executeQuery(jsonObj: any, queryItem: any): QueryResult {
  const { query, description, include_values = false } = queryItem;

  try {
    const startTime = performance.now();

    // Execute JSONPath query with resultType "all" to get all result types
    const results = JSONPath({
      path: query,
      json: jsonObj,
      resultType: "all",
    });

    const matches: QueryMatch = {};

    results.forEach((result: any, index: number) => {
      const key = result.pointer; // Use JSON Pointer as key, fallback to index

      // Only include values if requested
      if (include_values) {
        matches[key] = result.value;
      } else {
        matches[key] = null; // Store the path as the value when not including values
      }
    });

    const endTime = performance.now();

    return {
      query,
      description,
      include_values,
      success: true,
      matches,
      execution_time: `${Math.round(endTime - startTime)}ms`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Query execution failed";
    return {
      query,
      description,
      include_values,
      success: false,
      error: errorMessage + "Call this again with correct query",
    };
  }
}
