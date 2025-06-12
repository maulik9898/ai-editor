import { jsonrepair } from "jsonrepair";

export interface AutoRepairResult {
  success: boolean;
  repairedContent?: string;
  error?: string;
  changesDetected: boolean;
  originalError?: string;
}

export interface JSONValidationResult {
  isValid: boolean;
  error?: string;
  position?: { line: number; column: number };
}

export class JSONRepairUtility {
  /**
   * Validate JSON and get detailed error information
   */
  static validateJSON(content: string): JSONValidationResult {
    if (!content.trim()) {
      return { isValid: false, error: "Empty content" };
    }

    try {
      JSON.parse(content);
      return { isValid: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown JSON error";

      // Try to extract line/column information from error message
      const match = errorMessage.match(
        /at position (\d+)|line (\d+)|column (\d+)/i,
      );
      const position = match
        ? this.getPositionFromError(content, errorMessage)
        : undefined;

      return {
        isValid: false,
        error: errorMessage,
        position,
      };
    }
  }

  /**
   * Attempt automatic repair using jsonrepair library
   */
  static tryAutomaticRepair(content: string): AutoRepairResult {
    const validation = this.validateJSON(content);

    // If already valid, no repair needed
    if (validation.isValid) {
      return {
        success: true,
        repairedContent: content,
        changesDetected: false,
      };
    }

    try {
      const repairedContent = jsonrepair(content);

      // Verify the repair actually worked
      const repairedValidation = this.validateJSON(repairedContent);

      if (!repairedValidation.isValid) {
        return {
          success: false,
          error: `Automatic repair failed: ${repairedValidation.error}`,
          changesDetected: false,
          originalError: validation.error,
        };
      }

      // Check if changes were actually made
      const changesDetected = content !== repairedContent;

      return {
        success: true,
        repairedContent,
        changesDetected,
        originalError: validation.error,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown repair error";

      return {
        success: false,
        error: `Automatic repair failed: ${errorMessage}`,
        changesDetected: false,
        originalError: validation.error,
      };
    }
  }

  /**
   * Extract position information from JSON parse error
   */
  private static getPositionFromError(
    content: string,
    errorMessage: string,
  ): { line: number; column: number } | undefined {
    // Try to extract position from error message
    const positionMatch = errorMessage.match(/at position (\d+)/);
    if (positionMatch) {
      const position = parseInt(positionMatch[1], 10);
      return this.offsetToLineColumn(content, position);
    }

    // Try to extract line number directly
    const lineMatch = errorMessage.match(/line (\d+)/i);
    if (lineMatch) {
      return { line: parseInt(lineMatch[1], 10), column: 0 };
    }

    return undefined;
  }

  /**
   * Convert character offset to line/column position
   */
  private static offsetToLineColumn(
    content: string,
    offset: number,
  ): { line: number; column: number } {
    const lines = content.substring(0, offset).split("\n");
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    };
  }

  /**
   * Get a human-readable description of what might be wrong
   */
  static getRepairSuggestion(validationResult: JSONValidationResult): string {
    if (validationResult.isValid) {
      return "JSON is valid";
    }

    const error = validationResult.error?.toLowerCase() || "";

    return error;
  }
}
