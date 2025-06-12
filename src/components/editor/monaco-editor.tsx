"use client";

import { useRef } from "react";
import Editor from "@monaco-editor/react";
import { EditorFile } from "@/types/editor";

interface MonacoEditorProps {
  file: EditorFile | null;
  onContentChange: (content: string) => void;
  height?: string;
  theme?: "vs-dark" | "light";
}

export function MonacoEditor({
  file,
  onContentChange,
  height = "100%",
  theme = "vs-dark",
}: MonacoEditorProps) {
  const editorRef = useRef<any>(null);

  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor;

    // Configure JSON validation for better JSON editing experience
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: true,
    });
  }

  function handleEditorChange(value: string | undefined) {
    if (value !== undefined && file) {
      onContentChange(value);
    }
  }

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No file open</p>
          <p className="text-sm">Open a file to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <Editor
      height={height}
      theme={theme}
      path={file.path}
      language={file.language}
      value={file.content}
      onMount={handleEditorDidMount}
      onChange={handleEditorChange}
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: "on",
        wordWrap: "on",
        automaticLayout: true,
        scrollBeyondLastLine: false,
        tabSize: 2,
        insertSpaces: true,
        formatOnPaste: true,
        formatOnType: true,
      }}
    />
  );
}
