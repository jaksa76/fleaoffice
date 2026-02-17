import { useRef, useEffect } from 'react';
import { Milkdown, useEditor } from '@milkdown/react';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { nord } from '@milkdown/theme-nord';
import '@milkdown/theme-nord/style.css';

interface MilkdownEditorProps {
  initialContent: string;
  onContentChange: (markdown: string) => void;
}

export function MilkdownEditor({ initialContent, onContentChange }: MilkdownEditorProps) {
  const editorRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const { loading, get } = useEditor((root) => {
    return Editor.make()
      .config((ctx: any) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, initialContent);
      })
      .config(nord)
      .use(commonmark)
      .use(listener)
      .config((ctx: any) => {
        ctx.get(listenerCtx).markdownUpdated((_ctx: any, markdown: string) => {
          onContentChange(markdown);
        });
      });
  }, [initialContent]);

  // Auto-focus when editor loads
  useEffect(() => {
    if (!loading && get) {
      setTimeout(() => {
        try {
          const editor = get();
          if (editor) {
            editor.action((ctx: any) => {
              const view = ctx.get(editorViewCtx);
              view?.focus();
              editorRef.current = view;
            });
          }
        } catch (e) {
          console.error('Failed to focus editor:', e);
        }
      }, 100);
    }
  }, [loading, get]);

  // Handle clicks on the wrapper (below content) to focus editor
  const handleWrapperClick = (e: React.MouseEvent) => {
    if (e.target === wrapperRef.current && editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div 
      ref={wrapperRef}
      className="editor" 
      onClick={handleWrapperClick}
    >
      {loading ? 'Loading editor...' : null}
      <Milkdown />
    </div>
  );
}
