export interface DownloadOptions {
  content: string;
  filename: string;
  mimeType?: string;
}

/**
 * Downloads a file with the given content and filename
 */
export function downloadFile({
  content,
  filename,
  mimeType,
}: DownloadOptions): void {
  // Determine MIME type based on file extension if not provided
  const finalMimeType = mimeType || getMimeTypeFromFilename(filename);

  // Create blob with content
  const blob = new Blob([content], { type: finalMimeType });

  // Create download URL
  const url = URL.createObjectURL(blob);

  // Create temporary link element
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get MIME type based on file extension
 */
function getMimeTypeFromFilename(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    json: "application/json",
    js: "application/javascript",
    ts: "application/typescript",
    html: "text/html",
    css: "text/css",
    md: "text/markdown",
    py: "text/x-python",
    txt: "text/plain",
    xml: "application/xml",
    yaml: "application/x-yaml",
    yml: "application/x-yaml",
  };

  return mimeTypes[extension || ""] || "text/plain";
}
