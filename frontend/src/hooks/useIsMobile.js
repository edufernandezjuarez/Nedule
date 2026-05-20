import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= 600 && navigator.maxTouchPoints > 0
  );

  useEffect(() => {
    function handler() {
      setIsMobile(window.innerWidth <= 600 && navigator.maxTouchPoints > 0);
    }
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isMobile;
}
