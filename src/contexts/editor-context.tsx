"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";
import { EditorState, EditorAction, EditorFile } from "@/types/editor";
import { Tab, TabType } from "@/types/tabs";
import {
  getLanguageFromFileName,
  getDefaultContent,
  validateFileName,
} from "@/lib/file-utils";

import { downloadFile as downloadFileUtil } from "@/lib/download-utils";

const initialState: EditorState = {
  files: {},
  tabs: [],
  activeTabId: null,

  isLoading: false,
  error: null,
};

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "ADD_FILE":
      return {
        ...state,
        files: {
          ...state.files,
          [action.payload.path]: action.payload,
        },
      };

    case "ADD_TAB":
      return {
        ...state,
        tabs: [...state.tabs, action.payload],
      };

    case "SET_ACTIVE_TAB":
      const activeTab = state.tabs.find((t) => t.id === action.payload);
      return {
        ...state,
        activeTabId: action.payload,
      };

    case "REMOVE_TAB":
      const tabToRemove = state.tabs.find((t) => t.id === action.payload);
      const remainingTabs = state.tabs.filter((t) => t.id !== action.payload);
      const wasActive = state.activeTabId === action.payload;
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
        ...state,
        files: newFiles,
        tabs: remainingTabs,
        activeTabId: newActiveTabId,
      };

    case "UPDATE_TAB":
      return {
        ...state,
        tabs: state.tabs.map((tab) =>
          tab.id === action.payload.id
            ? { ...tab, ...action.payload.updates }
            : tab,
        ),
      };

    case "CREATE_NEW_FILE":
      const { name, language, content = "" } = action.payload;
      const newFile: EditorFile = {
        name,
        path: name,
        language,
        content,
        isDirty: false,
      };

      // Create corresponding editor tab
      const newTab: Tab = {
        id: `editor-${name}-${Date.now()}`,
        type: "editor",
        filePath: name,
        label: name,
      };

      return {
        ...state,
        files: {
          ...state.files,
          [name]: newFile,
        },
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };

    case "SET_ACTIVE_FILE":
      return { ...state };

    case "UPDATE_FILE_CONTENT":
      const file = state.files[action.payload.path];
      if (!file) return state;

      return {
        ...state,
        files: {
          ...state.files,
          [action.payload.path]: {
            ...file,
            content: action.payload.content,
            isDirty: true,
          },
        },
      };

    case "SET_FILE_DIRTY":
      const targetFile = state.files[action.payload.path];
      if (!targetFile) return state;

      return {
        ...state,
        files: {
          ...state.files,
          [action.payload.path]: {
            ...targetFile,
            isDirty: action.payload.isDirty,
          },
        },
      };

    case "REMOVE_FILE":
      const { [action.payload]: removed, ...remainingFiles } = state.files;
      return {
        ...state,
        files: remainingFiles,
      };

    default:
      return state;
  }
}

interface EditorContextType {
  state: EditorState;
  // Derived state helpers
  activeTab: Tab | null;
  actions: {
    createNewFile: (
      name: string,
      content: string,
      language?: string,
    ) => boolean;
    updateFileContent: (filePath: string, content: string) => void;
    setActiveFile: (filePath: string) => void;
    closeFile: (filePath: string) => void;
    clearError: () => void;
    // NEW TAB ACTIONS
    createTab: (type: TabType, filePath: string, label?: string) => void;
    switchTab: (tabId: string) => void;
    closeTab: (tabId: string) => void;
    openPreview: (filePath: string, previewType: TabType) => void;
    downloadFile: (filePath: string) => void;
  };
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface EditorProviderProps {
  children: ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps) {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  // Derived state
  const activeTab = state.tabs.find((t) => t.id === state.activeTabId) || null;

  // NEW TAB ACTIONS
  const createTab = useCallback(
    (type: TabType, filePath: string, label?: string) => {
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

      dispatch({ type: "ADD_TAB", payload: newTab });
      dispatch({ type: "SET_ACTIVE_TAB", payload: newTab.id });
    },
    [state.files],
  );

  const switchTab = useCallback((tabId: string) => {
    dispatch({ type: "SET_ACTIVE_TAB", payload: tabId });
  }, []);

  const closeTab = useCallback((tabId: string) => {
    dispatch({ type: "REMOVE_TAB", payload: tabId });
  }, []);

  const openPreview = useCallback(
    (filePath: string, previewType: TabType) => {
      // Check if preview already exists
      const existingPreview = state.tabs.find(
        (t) => t.type === previewType && t.filePath === filePath,
      );

      if (existingPreview) {
        dispatch({ type: "SET_ACTIVE_TAB", payload: existingPreview.id });
      } else {
        createTab(previewType, filePath);
      }
    },
    [state.tabs, createTab],
  );

  const createNewFile = useCallback(
    (name: string, content: string, language?: string) => {
      // Validate file name
      const existingFiles = Object.keys(state.files);
      const validationError = validateFileName(name, existingFiles);

      if (validationError) {
        dispatch({
          type: "SET_ERROR",
          payload: validationError,
        });
        return false;
      }

      const detectedLanguage = language || getLanguageFromFileName(name);
      const finalContent = content || getDefaultContent(detectedLanguage);

      dispatch({
        type: "CREATE_NEW_FILE",
        payload: {
          name,
          language: detectedLanguage,
          content: finalContent,
        },
      });

      return true;
    },
    [state.files],
  );

  const updateFileContent = useCallback((filePath: string, content: string) => {
    dispatch({
      type: "UPDATE_FILE_CONTENT",
      payload: { path: filePath, content },
    });
  }, []);

  const setActiveFile = useCallback((filePath: string) => {
    dispatch({ type: "SET_ACTIVE_FILE", payload: filePath });
  }, []);

  const closeFile = useCallback((filePath: string) => {
    dispatch({ type: "REMOVE_FILE", payload: filePath });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  const downloadFile = useCallback(
    (filePath: string) => {
      const file = state.files[filePath];
      if (!file) {
        dispatch({
          type: "SET_ERROR",
          payload: `File "${filePath}" not found for download`,
        });
        return;
      }

      downloadFileUtil({
        content: file.content,
        filename: file.name,
      });
    },
    [state.files],
  );

  const value: EditorContextType = {
    state,
    activeTab,
    actions: {
      createNewFile,
      updateFileContent,
      setActiveFile,
      closeFile,
      clearError,
      createTab,
      switchTab,
      closeTab,
      openPreview,
      downloadFile,
    },
  };

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

export function useEditorContext(): EditorContextType {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error("useEditorContext must be used within an EditorProvider");
  }
  return context;
}
