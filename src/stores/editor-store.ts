import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { EditorFile } from "@/types/editor";
import type { Tab, TabType } from "@/types/tabs";
import {
  getLanguageFromFileName,
  getDefaultContent,
  validateFileName,
} from "@/lib/file-utils";
import { downloadFile as downloadFileUtil } from "@/lib/download-utils";

// Store state interface
interface EditorState {
  files: Record<string, EditorFile>;
  tabs: Tab[];
  activeTabId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Store actions interface
interface EditorActions {
  // File management
  createNewFile: (name: string, content: string, language?: string) => boolean;
  updateFileContent: (filePath: string, content: string) => void;
  removeFile: (filePath: string) => void;
  setFileDirty: (filePath: string, isDirty: boolean) => void;

  // Tab management
  createTab: (type: TabType, filePath: string, label?: string) => void;
  switchTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;

  closeFile: (filePath: string) => void;

  // Preview management
  openPreview: (filePath: string, previewType: TabType) => void;

  // Utility actions
  downloadFile: (filePath: string) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Tool-friendly getters
  getFileContent: (filePath: string) => string | undefined;
  validateFile: (filePath: string) => { isValid: boolean; error?: string };
}

// Complete store interface
interface EditorStore extends EditorState, EditorActions {}

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      files: {},
      tabs: [],
      activeTabId: null,
      isLoading: false,
      error: null,

      // File management actions
      createNewFile: (name: string, content: string, language?: string) => {
        const state = get();

        // Validate file name
        const existingFiles = Object.keys(state.files);
        const validationError = validateFileName(name, existingFiles);

        if (validationError) {
          set({ error: validationError });
          return false;
        }

        const detectedLanguage = language || getLanguageFromFileName(name);
        const finalContent = content || getDefaultContent(detectedLanguage);

        const newFile: EditorFile = {
          name,
          path: name,
          language: detectedLanguage,
          content: finalContent,
          isDirty: false,
        };

        // Create corresponding editor tab
        const newTab: Tab = {
          id: `editor-${name}-${Date.now()}`,
          type: "editor",
          filePath: name,
          label: name,
        };

        set((state) => ({
          files: {
            ...state.files,
            [name]: newFile,
          },
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
          error: null,
        }));

        return true;
      },

      updateFileContent: (filePath: string, content: string) => {
        set((state) => {
          const file = state.files[filePath];
          if (!file) return state;

          return {
            files: {
              ...state.files,
              [filePath]: {
                ...file,
                content,
                isDirty: true,
              },
            },
          };
        });
      },

      removeFile: (filePath: string) => {
        set((state) => {
          const { [filePath]: removed, ...remainingFiles } = state.files;
          return {
            files: remainingFiles,
          };
        });
      },

      setFileDirty: (filePath: string, isDirty: boolean) => {
        set((state) => {
          const file = state.files[filePath];
          if (!file) return state;

          return {
            files: {
              ...state.files,
              [filePath]: {
                ...file,
                isDirty,
              },
            },
          };
        });
      },

      // Tab management actions
      createTab: (type: TabType, filePath: string, label?: string) => {
        const state = get();
        const file = state.files[filePath];
        if (!file) return;

        const newTab: Tab = {
          id: `${type}-${filePath}-${Date.now()}`,
          type,
          filePath,
          label:
            label ||
            `${file.name}${type === "letsform-preview" ? " (Preview)" : ""}`,
          icon: type === "letsform-preview" ? "eye" : undefined,
        };

        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        }));
      },

      switchTab: (tabId: string) => {
        set({ activeTabId: tabId });
      },

      closeTab: (tabId: string) => {
        set((state) => {
          const tabToRemove = state.tabs.find((t) => t.id === tabId);
          const remainingTabs = state.tabs.filter((t) => t.id !== tabId);
          const wasActive = state.activeTabId === tabId;
          const newActiveTabId =
            wasActive && remainingTabs.length > 0
              ? remainingTabs[remainingTabs.length - 1].id
              : wasActive
                ? null
                : state.activeTabId;

          // Check if any remaining tabs reference the same file
          const fileStillInUse = tabToRemove
            ? remainingTabs.some((tab) => tab.filePath === tabToRemove.filePath)
            : false;

          // If no tabs reference this file anymore, remove it from files
          const newFiles =
            fileStillInUse || !tabToRemove
              ? state.files
              : Object.fromEntries(
                  Object.entries(state.files).filter(
                    ([path]) => path !== tabToRemove.filePath,
                  ),
                );

          return {
            files: newFiles,
            tabs: remainingTabs,
            activeTabId: newActiveTabId,
          };
        });
      },

      updateTab: (tabId: string, updates: Partial<Tab>) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId ? { ...tab, ...updates } : tab,
          ),
        }));
      },

      closeFile: (filePath: string) => {
        // Remove all tabs for this file
        const state = get();
        const tabsToRemove = state.tabs.filter(
          (tab) => tab.filePath === filePath,
        );

        tabsToRemove.forEach((tab) => {
          get().closeTab(tab.id);
        });
      },

      // Preview management
      openPreview: (filePath: string, previewType: TabType) => {
        const state = get();
        // Check if preview already exists
        const existingPreview = state.tabs.find(
          (t) => t.type === previewType && t.filePath === filePath,
        );

        if (existingPreview) {
          get().switchTab(existingPreview.id);
        } else {
          get().createTab(previewType, filePath);
        }
      },

      // Utility actions
      downloadFile: (filePath: string) => {
        const state = get();
        const file = state.files[filePath];
        if (!file) {
          set({ error: `File "${filePath}" not found for download` });
          return;
        }

        downloadFileUtil({
          content: file.content,
          filename: file.name,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      // Tool-friendly getters
      getFileContent: (filePath: string) => {
        const state = get();
        return state.files[filePath]?.content;
      },

      validateFile: (filePath: string) => {
        const state = get();
        const file = state.files[filePath];

        if (!file) {
          return { isValid: false, error: `File "${filePath}" not found` };
        }

        if (file.language === "json" || file.language === "jsonc") {
          try {
            JSON.parse(file.content);
            return { isValid: true };
          } catch (error) {
            return {
              isValid: false,
              error: `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
          }
        }

        return { isValid: true };
      },
    }),
    {
      name: "editor-store",
    },
  ),
);

// Export types for use in components
export type { EditorStore, EditorState, EditorActions };

// Utility function to get store state without subscribing (for tools)
export const getEditorState = () => useEditorStore.getState();
