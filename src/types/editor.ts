import { Tab } from "./tabs";

export interface EditorFile {
  name: string;
  path: string;
  language: string;
  content: string;
  isDirty: boolean;
  // Removed handle property
}

export interface EditorState {
  files: Record<string, EditorFile>;
  tabs: Tab[];
  activeTabId: string | null;
  isLoading: boolean;
  error: string | null;
}

export type EditorAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "ADD_FILE"; payload: EditorFile }
  | { type: "SET_ACTIVE_FILE"; payload: string } // KEEP for now
  | { type: "UPDATE_FILE_CONTENT"; payload: { path: string; content: string } }
  | { type: "SET_FILE_DIRTY"; payload: { path: string; isDirty: boolean } }
  | { type: "REMOVE_FILE"; payload: string }
  | {
      type: "CREATE_NEW_FILE";
      payload: { name: string; language: string; content?: string };
    }
  | { type: "ADD_TAB"; payload: Tab }
  | { type: "SET_ACTIVE_TAB"; payload: string }
  | { type: "REMOVE_TAB"; payload: string }
  | { type: "UPDATE_TAB"; payload: { id: string; updates: Partial<Tab> } };
