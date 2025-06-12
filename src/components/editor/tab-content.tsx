"use client";

import { Tab } from "@/types/tabs";
import { EditorFile } from "@/types/editor";
import { MonacoEditor } from "./monaco-editor";
import { LetsFormPreview } from "@/components/letsform/letsform-preview";

interface TabContentProps {
  tab: Tab | null;
  file: EditorFile | null;
  onContentChange: (content: string) => void;
  theme?: "vs-dark" | "light";
}

export function TabContent({
  tab,
  file,
  onContentChange,
  theme = "vs-dark",
}: TabContentProps) {
  if (!tab || !file) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No file open</p>
          <p className="text-sm">Open a file to start editing</p>
        </div>
      </div>
    );
  }

  switch (tab.type) {
    case "editor":
      return (
        <MonacoEditor
          file={file}
          onContentChange={onContentChange}
          theme={theme}
        />
      );

    case "letsform-preview":
      return (
        <div className="h-full w-full overflow-hidden max-h-[90vh]">
          <LetsFormPreview file={file} />
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Unknown tab type: {tab.type}</p>
        </div>
      );
  }
}
