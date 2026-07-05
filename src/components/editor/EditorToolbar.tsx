"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Code,
  Code2,
  CheckSquare,
  Image,
  Link,
  Table as TableIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToolbarProps = {
  editor: Editor | null;
};

export function EditorToolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  const tools = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
      label: "Bold",
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      label: "Italic",
    },
    { type: "divider" as const },
    {
      icon: Heading1,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive("heading", { level: 1 }),
      label: "Heading 1",
    },
    {
      icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
      label: "Heading 2",
    },
    {
      icon: Heading3,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
      label: "Heading 3",
    },
    { type: "divider" as const },
    {
      icon: Quote,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
      label: "Quote",
    },
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
      label: "Bullet List",
    },
    {
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
      label: "Ordered List",
    },
    {
      icon: CheckSquare,
      action: () => editor.chain().focus().toggleTaskList().run(),
      active: editor.isActive("taskList"),
      label: "Task List",
    },
    { type: "divider" as const },
    {
      icon: Code,
      action: () => editor.chain().focus().toggleCode().run(),
      active: editor.isActive("code"),
      label: "Inline Code",
    },
    {
      icon: Code2,
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      active: editor.isActive("codeBlock"),
      label: "Code Block",
    },
    { type: "divider" as const },
    {
      icon: Image,
      action: () => {
        const url = prompt("Enter image URL:");
        if (url) editor.chain().focus().setImage({ src: url }).run();
      },
      active: false,
      label: "Image",
    },
    {
      icon: Link,
      action: () => {
        const url = prompt("Enter URL:");
        if (url) editor.chain().focus().setLink({ href: url }).run();
      },
      active: editor.isActive("link"),
      label: "Link",
    },
    {
      icon: TableIcon,
      action: () =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
      active: editor.isActive("table"),
      label: "Table",
    },
  ];

  return (
    <div className="sticky top-0 z-10 bg-bg-surface border-b border-border-light px-4 py-2 overflow-x-auto">
      <div className="flex items-center gap-1 mx-auto writing-comfortable">
        {tools.map((tool, i) => {
          if ("type" in tool && tool.type === "divider") {
            return (
              <div
                key={i}
                className="w-px h-6 bg-border-light mx-1 shrink-0"
              />
            );
          }

          const t = tool as {
            icon: React.ComponentType<{ className?: string }>;
            action: () => void;
            active: boolean;
            label: string;
          };
          const Icon = t.icon;

          return (
            <button
              key={i}
              onClick={t.action}
              title={t.label}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                t.active
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-border-light"
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
