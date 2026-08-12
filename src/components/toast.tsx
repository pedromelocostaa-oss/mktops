'use client';

import { useEffect, useState } from 'react';

export default function Toast({
  message,
  duration = 4000,
  onDone,
}: {
  message: string;
  duration?: number;
  onDone?: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDone]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand text-white px-5 py-3 rounded-md shadow-lg text-sm font-medium z-50 animate-[slideUp_0.3s_ease-out]">
      {message}
    </div>
  );
}
