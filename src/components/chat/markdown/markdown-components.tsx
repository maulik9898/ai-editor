"use client";

import { ComponentsMap } from "@copilotkit/react-ui";
import { InlineCode } from "./inline-code";
import { CodeBlock } from "./code-block";

// Define the custom markdown components for CopilotKit
export const customMarkdownComponents: ComponentsMap<{
  code: { children?: React.ReactNode; className?: string };
  diff: { children?: React.ReactNode; className?: string };
}> = {
  // Inline code (backticks)
  code: ({ children, className, ...props }) => {
    const isCodeBlock = className?.includes("language-");

    if (isCodeBlock) {
      const language = className?.replace("language-", "") || "text";
      return (
        <CodeBlock language={language} className={className} {...props}>
          {children}
        </CodeBlock>
      );
    }

    // Inline code
    return (
      <InlineCode className={className} {...props}>
        {children}
      </InlineCode>
    );
  },
  // Diff code (backticks)
  diff: ({ children, className, ...props }) => {
    console.log("class", className, props);
    // Check if this is a code block or inline code
    const isCodeBlock = className?.includes("language-");

    if (isCodeBlock) {
      const language = className?.replace("language-", "") || "text";
      return (
        <CodeBlock language={language} className={className} {...props}>
          {children}
        </CodeBlock>
      );
    }

    // Inline code
    return (
      <InlineCode className={className} {...props}>
        {children}
      </InlineCode>
    );
  },
};
