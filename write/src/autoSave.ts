import { useEffect } from 'react';

export function useAutoSave(
  content: string,
  isDirty: boolean,
  onSave: () => Promise<void>,
  delay = 2000
) {
  useEffect(() => {
    if (!isDirty) return;

    const timeout = setTimeout(() => {
      onSave();
    }, delay);

    return () => clearTimeout(timeout);
  }, [content, isDirty, onSave, delay]);
}
