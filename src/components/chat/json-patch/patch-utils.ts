import { applyPatch, JsonPatchOperation } from "json-joy/esm/json-patch";

export interface PatchPreviewData {
  originalContent: string;
  modifiedContent: string;
  operations: JsonPatchOperation[];
  isValid: boolean;
  error?: string;
}

/**
 * Validate if content is valid JSON
 */
export function isValidJSON(content: string): boolean {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

export function parseJsonValue(value?: string): any {
  // Handle empty or undefined values
  if (!value) {
    return value;
  }

  // Try to parse as JSON first
  try {
    return JSON.parse(value);
  } catch (error) {
    // If parsing fails, treat it as a plain string
    // This handles cases where the user just wants to add a simple string
    return value;
  }
}

/**
 * Apply JSON Patch operations to content and return preview
 */
export function generatePatchPreview(
  originalContent: string,
  operations: JsonPatchOperation[],
): PatchPreviewData {
  try {
    // Validate original content is JSON
    if (!isValidJSON(originalContent)) {
      return {
        originalContent,
        modifiedContent: originalContent,
        operations,
        isValid: false,
        error: "Original content is not valid JSON",
      };
    }

    // Parse original JSON
    const originalObj = JSON.parse(originalContent);

    // Apply patches using json-joy
    const result = applyPatch(originalObj, operations, {
      mutate: false,
    });

    // Format modified content
    const modifiedContent = JSON.stringify(result.doc, null, 2);

    return {
      originalContent,
      modifiedContent,
      operations,
      isValid: true,
    };
  } catch (error) {
    return {
      originalContent,
      modifiedContent: originalContent,
      operations,
      isValid: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error applying patches",
    };
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  failedOperationIndices: number[]; // Track which operations failed
  validOperations: JsonPatchOperation[]; // Operations that passed validation
}

/**
 * Validate each operation individually
 */
export function validateOperationsIndividually(
  originalContent: string,
  operations: JsonPatchOperation[],
): ValidationResult {
  const errors: string[] = [];
  const failedOperationIndices: number[] = [];
  const validOperations: JsonPatchOperation[] = [];

  try {
    // Validate original content is JSON
    if (!isValidJSON(originalContent)) {
      return {
        isValid: false,
        errors: ["Original content is not valid JSON"],
        failedOperationIndices: [],
        validOperations: [],
      };
    }

    const originalObj = JSON.parse(originalContent);

    // Test each operation individually
    operations.forEach((operation, index) => {
      try {
        applyPatch(originalObj, [operation], { mutate: false });

        // If we get here, operation is valid
        validOperations.push(operation);
      } catch (error) {
        console.log(error);
        // This specific operation failed
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Operation ${index + 1}: ${errorMessage}`);
        failedOperationIndices.push(index);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      failedOperationIndices,
      validOperations,
    };
  } catch (parseError) {
    console.log(parseError);
    return {
      isValid: false,
      errors: ["Invalid JSON content"],
      failedOperationIndices: [],
      validOperations: [],
    };
  }
}
