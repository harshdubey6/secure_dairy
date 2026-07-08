"use client";

import { useState } from "react";
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
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToolbarProps = {
  editor: Editor | null;
};

type Tool = {
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  active: boolean;
  label: string;
};

function ToolButton({ tool, onClick }: { tool: Tool; onClick?: () => void }) {
  const Icon = tool.icon;
  return (
    <button
      onClick={() => {
        tool.action();
        onClick?.();
      }}
      aria-label={tool.label}
      className={cn(
        "flex items-center justify-center rounded-md transition-colors min-w-[36px] min-h-[36px] p-2",
        tool.active
          ? "bg-accent/10 text-accent"
          : "text-text-secondary hover:text-text-primary hover:bg-border-light"
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border-light shrink-0" />;
}

function UrlInputDialog({
  title,
  placeholder,
  onSubmit,
  onClose,
}: {
  title: string;
  placeholder: string;
  onSubmit: (url: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-bg-surface border border-border-light rounded-lg shadow-lg p-4 mx-4 w-full max-w-sm">
        <p className="font-sans text-sm text-text-primary mb-3">{title}</p>
        <input
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-text-primary outline-none focus-visible:border-ring mb-3"
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) {
              onSubmit(value.trim());
              onClose();
            }
            if (e.key === "Escape") onClose();
          }}
        />
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm font-sans text-text-secondary hover:text-text-primary rounded-md hover:bg-border-light transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (value.trim()) {
                onSubmit(value.trim());
                onClose();
              }
            }}
            disabled={!value.trim()}
            className="px-3 py-2 text-sm font-sans text-white bg-accent hover:bg-accent-hover rounded-md transition-colors disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditorToolbar({ editor }: ToolbarProps) {
  const [showMore, setShowMore] = useState(false);
  const [urlDialog, setUrlDialog] = useState<"image" | "link" | null>(null);

  if (!editor) return null;

  const primaryTools: Tool[] = [
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
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
      label: "Bullet List",
    },
    {
      icon: Link,
      action: () => setUrlDialog("link"),
      active: editor.isActive("link"),
      label: "Link",
    },
  ];

  const secondaryTools: Tool[] = [
    {
      icon: Heading3,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
      label: "Heading 3",
    },
    {
      icon: Quote,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
      label: "Quote",
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
    {
      icon: Image,
      action: () => setUrlDialog("image"),
      active: false,
      label: "Image",
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
    <>
      <div className="sticky top-0 z-10 bg-bg-surface border-b border-border-light px-2 sm:px-4 py-1.5">
        <div className="flex items-center gap-0.5 mx-auto writing-comfortable">
          {primaryTools.map((tool, i) => (
            <ToolButton key={i} tool={tool} />
          ))}

          <Divider />

          <div className="hidden sm:flex items-center gap-0.5">
            {secondaryTools.map((tool, i) => (
              <ToolButton key={i} tool={tool} />
            ))}
          </div>

          <button
            onClick={() => setShowMore(!showMore)}
            aria-label="More formatting options"
            className="sm:hidden flex items-center justify-center min-w-[36px] min-h-[36px] p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-border-light transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {showMore && (
          <div className="flex flex-wrap items-center gap-0.5 pt-1.5 pb-0.5 border-t border-border-light mt-1.5 sm:hidden">
            {secondaryTools.map((tool, i) => (
              <ToolButton key={i} tool={tool} />
            ))}
          </div>
        )}
      </div>

      {urlDialog === "link" && (
        <UrlInputDialog
          title="Insert Link"
          placeholder="https://example.com"
          onSubmit={(url) => {
            editor.chain().focus().setLink({ href: url }).run();
          }}
          onClose={() => setUrlDialog(null)}
        />
      )}

      {urlDialog === "image" && (
        <UrlInputDialog
          title="Insert Image URL"
          placeholder="https://example.com/image.jpg"
          onSubmit={(url) => {
            editor.chain().focus().setImage({ src: url }).run();
          }}
          onClose={() => setUrlDialog(null)}
        />
      )}
    </>
  );
}
