import type { Editor } from "@tiptap/react";

export type EditorProps = {
  content?: Record<string, unknown>;
  onChange?: (json: Record<string, unknown>, text: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
};

export type EditorToolbarAction = "bold" | "italic" | "h1" | "h2" | "h3" | "quote" | "bulletList" | "orderedList" | "code" | "codeBlock" | "taskList" | "image" | "link" | "table";

export type EditorMenuProps = {
  editor: Editor | null;
};
