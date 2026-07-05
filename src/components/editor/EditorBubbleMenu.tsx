"use client";

import { useState, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { Bold, Italic, Code, Link } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = {
  editor: Editor;
};

export function EditorBubbleMenu({ editor }: Props) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function update() {
      const { selection } = editor.state;
      const { empty, from, to } = selection;

      if (empty || from === to) {
        setShow(false);
        return;
      }

      const { view } = editor;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);

      const editorRect = view.dom.getBoundingClientRect();
      const menuHeight = 40;

      setPosition({
        top: start.top - editorRect.top - menuHeight - 8,
        left: (start.left + end.left) / 2 - editorRect.left,
      });

      setShow(true);
    }

    editor.on("selectionUpdate", update);
    editor.on("blur", () => setShow(false));

    return () => {
      editor.off("selectionUpdate", update);
      editor.off("blur", () => setShow(false));
    };
  }, [editor]);

  if (!show) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 flex items-center gap-1 bg-bg-elevated border border-border-light rounded-lg shadow-md px-2 py-1.5"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "p-1 rounded transition-colors",
          editor.isActive("bold")
            ? "bg-accent/10 text-accent"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "p-1 rounded transition-colors",
          editor.isActive("italic")
            ? "bg-accent/10 text-accent"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        <Italic className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={cn(
          "p-1 rounded transition-colors",
          editor.isActive("code")
            ? "bg-accent/10 text-accent"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        <Code className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-4 bg-border-light mx-0.5" />
      <button
        onClick={() => {
          const url = prompt("Enter URL:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
        className={cn(
          "p-1 rounded transition-colors",
          editor.isActive("link")
            ? "bg-accent/10 text-accent"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        <Link className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
