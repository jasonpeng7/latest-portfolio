import { useEffect, useRef } from 'react';
export function useInterval(callback, delay) {
  const saved = useRef(callback);
  useEffect(() => { saved.current = callback; }, [callback]);
  useEffect(() => { if (delay === null) return; const timer = setInterval(() => saved.current(), delay); return () => clearInterval(timer); }, [delay]);
}
