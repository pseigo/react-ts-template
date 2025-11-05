import { useEffect, useState } from "react";

/**
 * A hook that returns the current safe viewport area height.
 *
 * Treat the returned `viewportHeight` as the entirety of the page that is
 * currently visible within the user's browser window, including 'unsafe' areas
 * (such as on smartphones with curved screen edges).
 *
 * @returns {number} `viewportHeight`
 */
export function useViewportHeight() {
  const [observedViewportHeight, setObservedViewportHeight] = useState(
    window.innerHeight
  );

  useEffect(() => {
    const onWindowResize = () => {
      //console.log(`[useViewportHeight] RESIZED to ${getViewportHeight()}px`);
      setObservedViewportHeight(getViewportHeight());
    };
    window.addEventListener("resize", onWindowResize);

    // Initial update.
    setObservedViewportHeight(getViewportHeight());

    return () => {
      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

  return observedViewportHeight;
}

/**
 * Returns the current safe viewport area height.
 *
 * @returns {number}
 */
export const getViewportHeight = () => window.innerHeight;
