"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, Maximize2, Minimize2, Bot } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";
import { FileTabs } from "./file-tabs";
import { TabContent } from "./tab-content";
import { AddFileDialog } from "./add-file-dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

interface EditorPanelProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  className?: string;
}

export function EditorPanel({
  isFullscreen = false,
  onToggleFullscreen,
  className,
}: EditorPanelProps) {
  const files = useEditorStore((state) => state.files);
  const tabs = useEditorStore((state) => state.tabs);
  const activeTabId = useEditorStore((state) => state.activeTabId);
  const isLoading = useEditorStore((state) => state.isLoading);
  const error = useEditorStore((state) => state.error);
  const activeTab = useEditorStore((state) => {
    return state.tabs.find((t) => t.id === state.activeTabId) || null;
  });
  const activeFile = useEditorStore((state) => {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    return tab ? state.files[tab.filePath] || null : null;
  });
  const updateFileContent = useEditorStore((state) => state.updateFileContent);
  const createNewFile = useEditorStore((state) => state.createNewFile);
  const switchTab = useEditorStore((state) => state.switchTab);
  const closeTab = useEditorStore((state) => state.closeTab);
  const clearError = useEditorStore((state) => state.clearError);
  const { getMonacoTheme } = useTheme();

  const handleContentChange = (content: string) => {
    if (activeFile) {
      updateFileContent(activeFile.path, content);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Bot className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">AI Editor</h1>
          </div>
          {activeFile && (
            <span className="text-sm text-muted-foreground">
              - {activeFile.name}
              {activeFile.isDirty && " (unsaved)"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="button" size="sm" />

          {onToggleFullscreen && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}

          <AddFileDialog onCreateFile={createNewFile} />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-destructive/10 text-destructive border-b border-destructive/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="h-auto p-1 text-destructive hover:text-destructive"
          >
            ✕
          </Button>
        </div>
      )}

      {/* File Tabs */}
      <FileTabs
        files={files}
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={switchTab}
        onTabClose={closeTab}
      />

      {/* Editor Area */}
      <div className="flex-1 relative min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : (
          <TabContent
            tab={activeTab}
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
          <span className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            AI Ready
          </span>
          <span>
            Theme: {getMonacoTheme() === "vs-dark" ? "Dark" : "Light"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Files: {Object.keys(files).length}</span>
          {activeFile && activeFile.isDirty && (
            <span className="text-orange-500">● Unsaved changes</span>
          )}
          {isFullscreen && (
            <span className="text-primary">● Fullscreen Mode</span>
          )}
        </div>
      </div>
    </div>
  );
}
