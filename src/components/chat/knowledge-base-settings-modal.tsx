"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Database, Save } from "lucide-react";
import { useKnowledgeBase } from "@/contexts/knowledge-base-context";

interface KnowledgeBaseSettingsModalProps {
  trigger?: React.ReactNode;
}

export function KnowledgeBaseSettingsModal({
  trigger,
}: KnowledgeBaseSettingsModalProps) {
  const { knowledgeBase, setKnowledgeBase } = useKnowledgeBase();
  const [tempContent, setTempContent] = useState(knowledgeBase);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    setKnowledgeBase(tempContent);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempContent(knowledgeBase);
    setOpen(false);
  };

  // Sync temp content when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTempContent(knowledgeBase);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Knowledge Base Settings"
          >
            <Database className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Knowledge Base Settings
          </DialogTitle>
          <DialogDescription>
            Add context information that will be available to the AI assistant.
            This content will persist across browser sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="knowledge-content" className="text-sm font-medium">
              Knowledge Base Content
            </label>
            <Textarea
              id="knowledge-content"
              placeholder="Enter context information, documentation, guidelines, or any other information you want the AI to know about..."
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
              className="min-h-[200px] resize-y max-h-[500px]"
            />
            <div className="text-xs text-muted-foreground">
              Characters: {tempContent.length}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            Save Knowledge Base
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
