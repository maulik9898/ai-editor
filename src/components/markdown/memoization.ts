import { Element } from "hast";
import React, { ComponentProps, ComponentType, ElementType, memo } from "react";

type Components = {
  [Key in Extract<ElementType, string>]?: ComponentType<ComponentProps<Key>>;
};

const areChildrenEqual = (prev: string | unknown, next: string | unknown) => {
  if (typeof prev === "string") return prev === next;
  return JSON.stringify(prev) === JSON.stringify(next);
};

export const areNodesEqual = (
  prev: Element | undefined,
  next: Element | undefined,
) => {
  // TODO troubleshoot why this is triggering for code blocks
  if (!prev || !next) return false;
  const isEqual =
    JSON.stringify(prev?.properties) === JSON.stringify(next?.properties) &&
    areChildrenEqual(prev?.children, next?.children);
  return isEqual;
};

export const memoCompareNodes = (
  prev: { node?: Element | undefined },
  next: { node?: Element | undefined },
) => {
  return areNodesEqual(prev.node, next.node);
};

export const memoizeMarkdownComponents = (components: Components = {}) => {
  return Object.fromEntries(
    Object.entries(components ?? {}).map(([key, value]) => {
      if (!value) return [key, value];

      const Component = value as ComponentType<any>;
      const WithoutNode = (allProps: {
        node?: Element;
        [key: string]: any;
      }) => {
        const { node, ...props } = allProps;
        return React.createElement(Component, props);
      };
      return [key, memo(WithoutNode, memoCompareNodes)];
    }),
  );
};
