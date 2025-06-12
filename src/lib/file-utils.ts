export interface FileType {
  label: string;
  value: string;
  extension: string;
}

export const FILE_TYPES: FileType[] = [
  { label: "JSON", value: "json", extension: ".json" },
  { label: "JavaScript", value: "javascript", extension: ".js" },
  { label: "TypeScript", value: "typescript", extension: ".ts" },
  { label: "HTML", value: "html", extension: ".html" },
  { label: "CSS", value: "css", extension: ".css" },
  { label: "Markdown", value: "markdown", extension: ".md" },
  { label: "Python", value: "python", extension: ".py" },
  { label: "Plain Text", value: "plaintext", extension: ".txt" },
];

// Utility function to detect language from file extension
export function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const fileType = FILE_TYPES.find((type) => type.extension === `.${ext}`);
  return fileType?.value || "plaintext";
}

// Get default content for different file types
export function getDefaultContent(language: string): string {
  switch (language) {
    case "json":
      return "{\n  \n}";
    case "javascript":
      return "// JavaScript file\n";
    case "typescript":
      return "// TypeScript file\n";
    case "html":
      return "<!DOCTYPE html>\n<html>\n<head>\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>";
    case "css":
      return "/* CSS file */\n";
    case "markdown":
      return "# Markdown Document\n\n";
    case "python":
      return "# Python file\n";
    default:
      return "";
  }
}

// Read file from system using standard File API
export async function readFileFromSystem(): Promise<{
  name: string;
  content: string;
  language: string;
} | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = FILE_TYPES.map((type) => type.extension).join(",");

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const content = await file.text();
        const language = getLanguageFromFileName(file.name);

        resolve({
          name: file.name,
          content,
          language,
        });
      } catch (error) {
        console.error("Error reading file:", error);
        resolve(null);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}

// Validate file name
export function validateFileName(
  fileName: string,
  existingFiles: string[],
): string | null {
  if (!fileName.trim()) {
    return "File name cannot be empty";
  }

  if (existingFiles.includes(fileName)) {
    return `File "${fileName}" already exists`;
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(fileName)) {
    return "File name contains invalid characters";
  }

  return null;
}

// Add extension if not present
export function normalizeFileName(fileName: string, fileType: string): string {
  const selectedType = FILE_TYPES.find((type) => type.value === fileType);
  const extension = selectedType?.extension || ".txt";

  return fileName.includes(".") ? fileName : fileName + extension;
}
