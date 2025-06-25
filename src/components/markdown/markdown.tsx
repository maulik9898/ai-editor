import { FC, memo } from "react";
import ReactMarkdown, { Options, Components } from "react-markdown";

import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import { CodeBlock } from "./code-block";
import { InlineCode } from "./inline-code";

const defaultComponents: Components = {
  a({ children, ...props }) {
    return (
      <a
        
        {...props}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  },
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
  h1: ({ children, ...props }) => (
    <h1 className="text-xl font-bold my-2" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-lg font-semibold my-2" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className=" font-medium my-2" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 {...props}>
      {children}
    </h6>
  ),
  p: ({ children, ...props }) => (
    <p className="mt-2" {...props}>
      {children}
    </p>
  ),
  hr: ({ children, ...props }) => (
    <hr className="my-1" {...props}>
      {children}
    </hr>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props}>
      {children}
    </blockquote>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside my-2" {...props}>
      {children}
    </ul>
  ),
  li: ({ children, ...props }) => (
    <li className="ml-4" {...props}>
      {children}
    </li>
  ),
};

const MemoizedReactMarkdown: FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.components === nextProps.components,
    
);

type MarkdownProps = {
  content: string;
  components?: Components;
};

export const Markdown = ({ content, components }: MarkdownProps) => {
  return (
    <div className="prose text-xs leading-4">
      <MemoizedReactMarkdown
        components={{ ...defaultComponents, ...components }}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw]}
      >
        {content}
      </MemoizedReactMarkdown>
    </div>
  );
};
