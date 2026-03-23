import { useState, useEffect } from "react";

function computeLocalTime(timezoneOffsetSeconds: number): string {
  const utcMs = Date.now();
  const localMs = utcMs + timezoneOffsetSeconds * 1000;
  const d = new Date(localMs);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export function useLocalTime(timezoneOffsetSeconds: number | undefined): string {
  const [time, setTime] = useState(() =>
    timezoneOffsetSeconds !== undefined ? computeLocalTime(timezoneOffsetSeconds) : ""
  );

  useEffect(() => {
    if (timezoneOffsetSeconds === undefined) return;
    setTime(computeLocalTime(timezoneOffsetSeconds));
    const id = setInterval(() => setTime(computeLocalTime(timezoneOffsetSeconds)), 10000);
    return () => clearInterval(id);
  }, [timezoneOffsetSeconds]);

  return time;
}
