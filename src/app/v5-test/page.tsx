"use client";

import { useState } from "react";
import { ResizableLayout } from "@/components/layout/resizable-layout";
import { ChatPanelV5 } from "@/components/chat-v5/chat-panel-v5";
import { EditorPanel } from "@/components/editor/editor-panel";

export default function V5TestPage() {
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);

  const toggleEditorFullscreen = () => {
    setIsEditorFullscreen(!isEditorFullscreen);
  };

  return (
    <div className="min-h-screen w-full overflow-hidden">
      {isEditorFullscreen ? (
        // Full editor mode
        <EditorPanel
          isFullscreen={true}
          onToggleFullscreen={toggleEditorFullscreen}
        />
      ) : (
        // Normal resizable layout with V5 chat
        <ResizableLayout
          chatPanel={<ChatPanelV5 />}
          editorPanel={
            <EditorPanel
              isFullscreen={false}
              onToggleFullscreen={toggleEditorFullscreen}
            />
          }
        />
      )}
    </div>
  );
}
