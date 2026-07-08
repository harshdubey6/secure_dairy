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
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

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

      setPosition({
        top: start.top - editorRect.top - 48,
        left: (start.left + end.left) / 2 - editorRect.left,
      });

      setShow(true);
    }

    editor.on("selectionUpdate", update);
    editor.on("blur", () => {
      setShow(false);
      setShowUrlInput(false);
    });

    return () => {
      editor.off("selectionUpdate", update);
      editor.off("blur", () => setShow(false));
    };
  }, [editor]);

  if (!show) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 flex items-center gap-0.5 bg-bg-elevated border border-border-light rounded-lg shadow-md px-1.5 py-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
        className={cn(
          "flex items-center justify-center min-w-[36px] min-h-[36px] p-2 rounded transition-colors",
          editor.isActive("bold")
            ? "bg-accent/10 text-accent"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
        className={cn(
          "flex items-center justify-center min-w-[36px] min-h-[36px] p-2 rounded transition-colors",
          editor.isActive("italic")
            ? "bg-accent/10 text-accent"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        aria-label="Code"
        className={cn(
          "flex items-center justify-center min-w-[36px] min-h-[36px] p-2 rounded transition-colors",
          editor.isActive("code")
            ? "bg-accent/10 text-accent"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        <Code className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-border-light mx-0.5" />
      <button
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
          } else {
            setShowUrlInput(true);
            setTimeout(() => urlInputRef.current?.focus(), 0);
          }
        }}
        aria-label={editor.isActive("link") ? "Remove link" : "Add link"}
        className={cn(
          "flex items-center justify-center min-w-[36px] min-h-[36px] p-2 rounded transition-colors",
          editor.isActive("link")
            ? "bg-accent/10 text-accent"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        <Link className="w-4 h-4" />
      </button>

      {showUrlInput && (
        <div className="flex items-center gap-1 ml-1 border-l border-border-light pl-2">
          <input
            ref={urlInputRef}
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="Paste URL..."
            className="w-32 h-8 rounded border border-input bg-transparent px-2 text-sm text-text-primary outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && urlValue.trim()) {
                editor.chain().focus().setLink({ href: urlValue.trim() }).run();
                setShowUrlInput(false);
                setUrlValue("");
              }
              if (e.key === "Escape") {
                setShowUrlInput(false);
                setUrlValue("");
              }
            }}
          />
          <button
            onClick={() => {
              if (urlValue.trim()) {
                editor.chain().focus().setLink({ href: urlValue.trim() }).run();
                setShowUrlInput(false);
                setUrlValue("");
              }
            }}
            className="px-2 py-1 text-xs font-sans text-white bg-accent rounded transition-colors disabled:opacity-50"
            disabled={!urlValue.trim()}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
