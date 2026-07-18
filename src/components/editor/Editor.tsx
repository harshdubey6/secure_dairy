"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Typography from "@tiptap/extension-typography";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { cn } from "@/lib/utils/cn";
import { useSettingsStore } from "@/stores/settings-store";
import { EditorToolbar } from "./EditorToolbar";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import type { EditorProps } from "@/types/editor";

export function Editor({
  content,
  onChange,
  editable = true,
  placeholder = "Start writing...",
  className,
}: EditorProps) {
  const { fontSize, writingWidth } = useSettingsStore();
  const hasSynced = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      Placeholder.configure({ placeholder }),
      ImageExtension.configure({ inline: false }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-accent underline underline-offset-2" },
      }),
      Typography,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: content && Object.keys(content).length > 0 ? content : {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    editable,
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON() as Record<string, unknown>;
      const text = ed.getText();
      onChange?.(json, text);
    },
  });

  useEffect(() => {
    if (!editor || !content) return;
    if (Object.keys(content).length === 0) return;
    if (hasSynced.current) return;

    const currentJson = JSON.stringify(editor.getJSON());
    const targetJson = JSON.stringify(content);

    if (currentJson !== targetJson) {
      hasSynced.current = true;
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  const writingWidthClass = `writing-${writingWidth}`;

  return (
    <div className={cn("relative", className)}>
      <EditorToolbar editor={editor} />
      {editor && <EditorBubbleMenu editor={editor} />}
      <div
        className={cn("mx-auto px-4 sm:px-8 py-6", writingWidthClass)}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1.8,
        }}
      >
        <EditorContent
          editor={editor}
          className="prose-journal outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[60vh] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-text-muted [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_li]:mb-1 [&_.ProseMirror_blockquote]:border-l-[3px] [&_.ProseMirror_blockquote]:border-accent [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-text-secondary [&_.ProseMirror_blockquote]:font-accent [&_.ProseMirror_blockquote]:text-lg [&_.ProseMirror_pre]:bg-bg-page [&_.ProseMirror_pre]:border [&_.ProseMirror_pre]:border-border-light [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre_code]:font-mono [&_.ProseMirror_pre_code]:text-sm [&_.ProseMirror_img]:rounded-md [&_.ProseMirror_img]:border [&_.ProseMirror_img]:border-border-light [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:mx-auto [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-border [&_.ProseMirror_th]:p-2 [&_.ProseMirror_th]:bg-bg-surface [&_.ProseMirror_th]:font-sans [&_.ProseMirror_th]:font-medium [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-border [&_.ProseMirror_td]:p-2 [&_.ProseMirror_ul[data-type=taskList]]:list-none [&_.ProseMirror_ul[data-type=taskList]_li]:flex [&_.ProseMirror_ul[data-type=taskList]_li_label]:flex-none [&_.ProseMirror_ul[data-type=taskList]_li_label_input]:mr-2 [&_.ProseMirror_ul[data-type=taskList]_li_div]:flex-1"
        />
      </div>
    </div>
  );
}
