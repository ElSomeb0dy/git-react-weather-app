import { useState, useEffect } from "react";

type Status = { type: "error" | "success"; text: string } | null;

export function useStatusMessage(ttl = 1500) {
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), ttl);
    return () => clearTimeout(t);
  }, [status]);

  return {
    status,
    showError: (text: string) => setStatus({ type: "error", text }),
    showSuccess: (text: string) => setStatus({ type: "success", text }),
  };
}
