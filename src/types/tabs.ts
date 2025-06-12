export type TabType = "editor" | "letsform-preview";

export interface Tab {
  id: string;
  type: TabType;
  filePath: string;
  label: string;
  icon?: string;
}
