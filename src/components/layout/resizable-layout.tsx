"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen, MessageCircle } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

interface ResizableLayoutProps {
  chatPanel: React.ReactNode;
  editorPanel: React.ReactNode;
  className?: string;
}

export function ResizableLayout({
  chatPanel,
  editorPanel,
  className,
}: ResizableLayoutProps) {
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  const toggleChat = () => {
    setIsChatCollapsed(!isChatCollapsed);
  };

  return (
    <div className={cn("flex flex-col h-dvh", className)}>
      {/* Top Controls */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleChat}
            className="h-8 px-2"
            title={isChatCollapsed ? "Show AI Chat" : "Hide AI Chat"}
          >
            {isChatCollapsed ? (
              <>
                <PanelLeftOpen className="h-4 w-4 mr-1" />
                <MessageCircle className="h-3 w-3" />
              </>
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            {isChatCollapsed ? "Editor Mode" : "AI Chat + Editor"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            AI-Powered File Editor
          </div>
          <ThemeToggle variant="dropdown" size="sm" />
        </div>
      </div>

      {/* Resizable Content */}
      <div className="flex-1">
        {isChatCollapsed ? (
          // Full editor mode
          <div className="h-full w-full">{editorPanel}</div>
        ) : (
          // Split view with resizable panels
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Chat Panel */}
            <ResizablePanel
              defaultSize={35}
              minSize={25}
              maxSize={60}
              className="min-w-[350px]"
            >
              {chatPanel}
            </ResizablePanel>

            {/* Resizable Handle */}
            <ResizableHandle withHandle />

            {/* Editor Panel */}
            <ResizablePanel defaultSize={65} minSize={40}>
              {editorPanel}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
