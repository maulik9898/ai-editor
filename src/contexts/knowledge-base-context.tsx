"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface KnowledgeBaseContextType {
  knowledgeBase: string;
  setKnowledgeBase: (content: string) => void;
}

const KnowledgeBaseContext = createContext<
  KnowledgeBaseContextType | undefined
>(undefined);

const KNOWLEDGE_BASE_KEY = "ai-editor-knowledge-base";

interface KnowledgeBaseProviderProps {
  children: ReactNode;
}

export function KnowledgeBaseProvider({
  children,
}: KnowledgeBaseProviderProps) {
  const [knowledgeBase, setKnowledgeBaseState] = useState<string>("");

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(KNOWLEDGE_BASE_KEY);
      if (stored) {
        setKnowledgeBaseState(stored);
      }
    }
  }, []);

  const setKnowledgeBase = (content: string) => {
    setKnowledgeBaseState(content);
    if (typeof window !== "undefined") {
      localStorage.setItem(KNOWLEDGE_BASE_KEY, content);
    }
  };

  const value: KnowledgeBaseContextType = {
    knowledgeBase,
    setKnowledgeBase,
  };

  return (
    <KnowledgeBaseContext.Provider value={value}>
      {children}
    </KnowledgeBaseContext.Provider>
  );
}

export function useKnowledgeBase(): KnowledgeBaseContextType {
  const context = useContext(KnowledgeBaseContext);
  if (context === undefined) {
    throw new Error(
      "useKnowledgeBase must be used within a KnowledgeBaseProvider",
    );
  }
  return context;
}
