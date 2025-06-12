import { JSONPath } from "jsonpath-plus";

export interface FieldInfo {
  name: string;
  component: string;
  path: string;
}

export interface DiagnosticIssue {
  paths: string[];
  component: string;
}

export interface DiagnosticResult {
  duplicatedNames?: Record<string, DiagnosticIssue>;
  invalidNames?: Record<string, DiagnosticIssue>;
}

export interface DiagnosticSummary {
  totalIssues: number;
  duplicateCount: number;
  invalidCount: number;
}

export interface DiagnosticResponse {
  success: true;
  diagnostics: DiagnosticResult;
  summary: DiagnosticSummary;
}

export interface DiagnosticErrorResponse {
  success: false;
  jsonError: string;
  file_path: string;
}

/**
 * Validate field name against JavaScript variable naming conventions
 */
export function isValidFieldName(name: string): boolean {
  // Field name must follow JavaScript variable naming rules
  const fieldNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return fieldNameRegex.test(name) && name.length > 0;
}

/**
 * Extract all fields with component and name properties from JSON using JSONPath
 */
export function extractFields(jsonObj: any): FieldInfo[] {
  try {
    // Use JSONPath to find all objects with both component and name properties
    const results = JSONPath({
      path: "$..[*][?(@.component && @.name)]",
      json: jsonObj,
      resultType: "all",
    });

    return results.map((result: any) => ({
      name: result.value.name,
      component: result.value.component,
      path: result.pointer, // JSON Pointer path
    }));
  } catch (error) {
    console.error("Error extracting fields:", error);
    return [];
  }
}

/**
 * Find duplicate field names
 */
export function findDuplicateNames(fields: FieldInfo[]): Record<string, DiagnosticIssue> {
  const nameGroups = new Map<string, FieldInfo[]>();

  // Group fields by name
  fields.forEach(field => {
    if (!nameGroups.has(field.name)) {
      nameGroups.set(field.name, []);
    }
    nameGroups.get(field.name)!.push(field);
  });

  const duplicates: Record<string, DiagnosticIssue> = {};

  // Find groups with more than one field
  nameGroups.forEach((fieldGroup, name) => {
    if (fieldGroup.length > 1) {
      duplicates[name] = {
        paths: fieldGroup.map(f => f.path),
        component: fieldGroup[0].component, // Use first occurrence's component
      };
    }
  });

  return duplicates;
}

/**
 * Find invalid field names
 */
export function findInvalidNames(fields: FieldInfo[]): Record<string, DiagnosticIssue> {
  const invalid: Record<string, DiagnosticIssue> = {};

  fields.forEach(field => {
    if (!isValidFieldName(field.name)) {
      if (!invalid[field.name]) {
        invalid[field.name] = {
          paths: [],
          component: field.component,
        };
      }
      invalid[field.name].paths.push(field.path);
    }
  });

  return invalid;
}

/**
 * Create diagnostic summary
 */
export function createSummary(diagnostics: DiagnosticResult): DiagnosticSummary {
  const duplicateCount = Object.keys(diagnostics.duplicatedNames || {}).length;
  const invalidCount = Object.keys(diagnostics.invalidNames || {}).length;

  return {
    totalIssues: duplicateCount + invalidCount,
    duplicateCount,
    invalidCount,
  };
}

/**
 * Main diagnostic function
 */
export function diagnoseLetsFormSchema(
  jsonContent: string,
  filePath: string
): DiagnosticResponse | DiagnosticErrorResponse {
  try {
    // Parse JSON
    const jsonObj = JSON.parse(jsonContent);

    // Extract all fields
    const fields = extractFields(jsonObj);

    // Find issues
    const duplicatedNames = findDuplicateNames(fields);
    const invalidNames = findInvalidNames(fields);

    // Build diagnostics object (omit empty objects)
    const diagnostics: DiagnosticResult = {};

    if (Object.keys(duplicatedNames).length > 0) {
      diagnostics.duplicatedNames = duplicatedNames;
    }

    if (Object.keys(invalidNames).length > 0) {
      diagnostics.invalidNames = invalidNames;
    }

    // Create summary
    const summary = createSummary(diagnostics);

    return {
      success: true,
      diagnostics,
      summary,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown JSON parsing error";

    return {
      success: false,
      jsonError: errorMessage,
      file_path: filePath,
    };
  }
}
