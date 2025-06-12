export interface SearchReplaceEdit {
  oldText: string;
  newText: string;
  index: number; // Order in the response
}

export interface EditParseResult {
  success: boolean;
  edits: SearchReplaceEdit[];
  errors: string[];
  rawResponse: string;
}

export class EditParser {
  static parseEdits(aiResponse: string): EditParseResult {
    const errors: string[] = [];
    const edits: SearchReplaceEdit[] = [];

    try {
      // Find the <edits> section
      const editsMatch = aiResponse.match(/<edits>([\s\S]*?)<\/edits>/);
      if (!editsMatch) {
        errors.push("No <edits> section found in response");
        return { success: false, edits: [], errors, rawResponse: aiResponse };
      }

      const editsContent = editsMatch[1];

      // Find all old_text/new_text pairs
      const oldTextRegex = /<old_text>([\s\S]*?)<\/old_text>/g;
      const newTextRegex = /<new_text>([\s\S]*?)<\/new_text>/g;

      const oldTexts: string[] = [];
      const newTexts: string[] = [];

      let oldMatch;
      while ((oldMatch = oldTextRegex.exec(editsContent)) !== null) {
        oldTexts.push(oldMatch[1]);
      }

      let newMatch;
      while ((newMatch = newTextRegex.exec(editsContent)) !== null) {
        newTexts.push(newMatch[1]);
      }

      // Validate matching pairs
      if (oldTexts.length !== newTexts.length) {
        errors.push(
          `Mismatched edit pairs: ${oldTexts.length} old_text, ${newTexts.length} new_text`,
        );
      }

      // Create edit objects
      const pairCount = Math.min(oldTexts.length, newTexts.length);
      for (let i = 0; i < pairCount; i++) {
        const oldText = oldTexts[i].trim();
        const newText = newTexts[i].trim();

        if (!oldText) {
          errors.push(`Edit ${i + 1}: old_text cannot be empty`);
          continue;
        }

        edits.push({
          oldText,
          newText,
          index: i,
        });
      }

      return {
        success: errors.length === 0,
        edits,
        errors,
        rawResponse: aiResponse,
      };
    } catch (error) {
      errors.push(
        `Parse error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return { success: false, edits: [], errors, rawResponse: aiResponse };
    }
  }

  /**
   * Apply edits to content and return the result
   */
  static applyEdits(
    content: string,
    edits: SearchReplaceEdit[],
  ): {
    success: boolean;
    result?: string;
    errors: string[];
  } {
    const errors: string[] = [];
    let result = content;

    try {
      // Apply edits in order
      for (const edit of edits) {
        const { oldText, newText, index } = edit;

        // Check if old text exists in current content
        if (!result.includes(oldText)) {
          errors.push(`Edit ${index + 1}: old_text not found in content`);
          continue;
        }

        // Replace first occurrence
        result = result.replace(oldText, newText);
      }

      return {
        success: errors.length === 0,
        result,
        errors,
      };
    } catch (error) {
      errors.push(
        `Apply error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return { success: false, errors };
    }
  }
}
