"use client";

import { useState } from "react";
import { ResizableLayout } from "@/components/layout/resizable-layout";
import { ChatPanel } from "@/components/chat/chat-panel";
import { EditorPanel } from "@/components/editor/editor-panel";
import { EditorProvider } from "@/contexts/editor-context";

export default function Home() {
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);

  const toggleEditorFullscreen = () => {
    setIsEditorFullscreen(!isEditorFullscreen);
  };

  return (
    <EditorProvider>
      <div className="min-h-screen w-full overflow-hidden">
        {isEditorFullscreen ? (
          // Full editor mode
          <EditorPanel
            isFullscreen={true}
            onToggleFullscreen={toggleEditorFullscreen}
          />
        ) : (
          // Normal resizable layout
          <ResizableLayout
            chatPanel={<ChatPanel />}
            editorPanel={
              <EditorPanel
                isFullscreen={false}
                onToggleFullscreen={toggleEditorFullscreen}
              />
            }
          />
        )}
      </div>
    </EditorProvider>
  );
}
