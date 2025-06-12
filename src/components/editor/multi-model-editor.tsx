"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

import { FileTabs } from "./file-tabs";
import { MonacoEditor } from "./monaco-editor";
import { AddFileDialog } from "./add-file-dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useEditorContext } from "@/contexts/editor-context";
import { useTheme } from "@/hooks/use-theme";

export function MultiModelEditor() {
  const { state, actions, activeTab } = useEditorContext();
  const { getMonacoTheme } = useTheme();

  const activeFile = activeTab ? state.files[activeTab.filePath] : null;

  const handleContentChange = (content: string) => {
    if (activeFile) {
      actions.updateFileContent(activeFile.path, content);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">AI Editor</h1>
          {activeFile && (
            <span className="text-sm text-muted-foreground">
              - {activeFile.name}
              {activeFile.isDirty && " (unsaved)"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="button" size="sm" />

          <AddFileDialog onCreateFile={actions.createNewFile} />
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-destructive/10 text-destructive border-b border-destructive/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{state.error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={actions.clearError}
            className="h-auto p-1 text-destructive hover:text-destructive"
          >
            ✕
          </Button>
        </div>
      )}

      {/* File Tabs */}
      <FileTabs
        files={state.files}
        tabs={state.tabs}
        activeTabId={activeTab?.id ?? null}
        onTabClick={actions.setActiveFile}
        onTabClose={actions.closeFile}
      />

      {/* Editor Area */}
      <div className="flex-1 relative">
        {state.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : (
          <MonacoEditor
            file={activeFile}
            onContentChange={handleContentChange}
            theme={getMonacoTheme()}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground bg-muted/30">
        <div className="flex items-center gap-4">
          {activeFile && (
            <>
              <span>Language: {activeFile.language}</span>
              <span>File: {activeFile.name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Files: {Object.keys(state.files).length}</span>
          {activeFile && activeFile.isDirty && (
            <span className="text-orange-500">● Unsaved changes</span>
          )}
        </div>
      </div>
    </div>
  );
}
