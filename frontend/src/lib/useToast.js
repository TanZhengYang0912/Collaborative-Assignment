import { useCallback, useRef, useState } from "react";

// Shared toast state for the engagement/bookmark flows — a page calls
// notify(message) / notify(message, true) for an error, and renders
// <Toast toast={toast} /> once anywhere in its tree.
export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((msg, isError = false) => {
    clearTimeout(timer.current);
    setToast({ msg, isError });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  return [toast, notify];
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
