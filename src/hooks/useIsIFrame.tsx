import { useState, useEffect } from 'react';

export const useIsIFrame = () => {
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      setIsIframe(true);
    }
  }, []);

  return { isIframe };
};
