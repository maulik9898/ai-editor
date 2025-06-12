"use client";

import { X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tab } from "@/types/tabs";
import { EditorFile } from "@/types/editor";
import { ContextMenu } from "@/components/custom/context-menu";
import { useEditorContext } from "@/contexts/editor-context";

interface FileTabsProps {
  files: Record<string, EditorFile>;
  tabs: Tab[]; // NEW
  activeTabId: string | null; // NEW
  onTabClick: (tabId: string) => void; // CHANGED
  onTabClose: (tabId: string) => void; // CHANGED
}

export function FileTabs({
  files,
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
}: FileTabsProps) {
  const { actions } = useEditorContext();

  if (tabs.length === 0) {
    return null;
  }

  const getTabIcon = (tab: Tab) => {
    if (tab.type === "letsform-preview") {
      return <Eye size={14} className="text-blue-600" />;
    }
    return null;
  };

  const getContextMenuItems = (tab: Tab) => {
    const file = files[tab.filePath];
    const items = [];

    // Only show preview options for editor tabs
    if (tab.type === "editor" && file) {
      if (file.language === "json") {
        items.push({
          label: "Open Let's Form Preview",
          onClick: () => actions.openPreview(tab.filePath, "letsform-preview"),
        });
      }
    }

    if (file) {
      items.push({
        label: "Download File",
        onClick: () => actions.downloadFile(tab.filePath),
        icon: "download", // Optional: for future icon support
      });
    }

    items.push({
      label: "Close Tab",
      onClick: () => onTabClose(tab.id),
    });

    return items;
  };

  return (
    <div className="flex border-b border-border bg-background">
      {tabs.map((tab) => {
        const file = files[tab.filePath];
        if (!file) return null; // File might have been deleted

        return (
          <ContextMenu key={tab.id} items={getContextMenuItems(tab)}>
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer text-sm",
                "hover:bg-accent hover:text-accent-foreground",
                activeTabId === tab.id && "bg-accent text-accent-foreground",
              )}
              onClick={() => onTabClick(tab.id)}
            >
              {getTabIcon(tab)}
              <span className="truncate max-w-32">{tab.label}</span>
              {file.isDirty && tab.type === "editor" && (
                <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
              )}
              <button
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
              >
                <X size={12} />
              </button>
            </div>
          </ContextMenu>
        );
      })}
    </div>
  );
}
