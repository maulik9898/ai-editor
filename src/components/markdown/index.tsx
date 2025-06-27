"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { memo } from "react";
import { defaultComponents } from "./default-components";

interface MarkdownWrapperProps {
  children: string;
  className?: string;
}

const MarkdownWrapperImpl = ({ children, className }: MarkdownWrapperProps) => {
  return (
    <div className={className}>
      <Markdown remarkPlugins={[remarkGfm]} components={defaultComponents}>
        {children}
      </Markdown>
    </div>
  );
};

export const MarkdownWrapper = memo(MarkdownWrapperImpl);
