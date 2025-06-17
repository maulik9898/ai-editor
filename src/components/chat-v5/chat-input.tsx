"use client";

import { useState, useRef, KeyboardEvent } from "react";
import {
  Send,
  Plus,
  Paperclip,
  Search,
  ArrowUp,
  Square,
  CircleStop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "../ui/textarea";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onStop?: () => void;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled = false,
  placeholder = "Type your message...",
  className = "",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 200; // Max height before scrolling
    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    adjustTextareaHeight();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-end gap-2   ">
        {/* Left side buttons */}

        {/* Text input area */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none  text-sm "
            style={{ scrollbarWidth: "thin" }}
          />
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-1 pb-2">
          {disabled ? (
            // Show red pulsating stop button when loading
            <Button
              type="button"
              onClick={onStop}
              size="icon"
              variant="destructive"
              className="h-8 w-8 p-0   bg-destructive "
              title="Stop generation"
            >
              <CircleStop className="h-3 w-3" />
            </Button>
          ) : (
            // Show normal send button when not loading
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim()}
              size="icon"
              className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground "
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
