import { useEditor } from '@milkdown/react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { nord } from '@milkdown/theme-nord';
import '@milkdown/theme-nord/style.css';

interface MilkdownEditorProps {
  initialContent: string;
  onContentChange: (markdown: string) => void;
}

export function MilkdownEditor({ initialContent, onContentChange }: MilkdownEditorProps) {
  const { loading } = useEditor((root) => {
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

  if (loading) {
    return <div className="editor">Loading editor...</div>;
  }

  return <div className="editor" />;
}
