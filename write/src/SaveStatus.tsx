import { useEffect, useState } from 'react';

interface SaveStatusProps {
  message: string;
  isError?: boolean;
}

export function SaveStatus({ message, isError = false }: SaveStatusProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);

      // Auto-hide after 2 seconds if success
      if (!isError) {
        const timeout = setTimeout(() => {
          setVisible(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      setVisible(false);
    }
  }, [message, isError]);

  if (!visible || !message) {
    return null;
  }

  return (
    <div className={`save-status ${isError ? 'error' : 'success'}`}>
      {message}
    </div>
  );
}
