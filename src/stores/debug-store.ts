"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DebugState {
  isDebugEnabled: boolean;
}

interface DebugActions {
  toggleDebug: () => void;
  setDebugEnabled: (enabled: boolean) => void;
}

interface DebugStore extends DebugState, DebugActions {}

export const useDebugStore = create<DebugStore>()(
  persist(
    (set, get) => ({
      isDebugEnabled: process.env.NODE_ENV === "development",

      toggleDebug: () => {
        const newValue = !get().isDebugEnabled;
        set({ isDebugEnabled: newValue });
      },

      setDebugEnabled: (enabled: boolean) => {
        set({ isDebugEnabled: enabled });
      },
    }),
    {
      name: "ai-editor-debug-enabled",
    },
  ),
);
