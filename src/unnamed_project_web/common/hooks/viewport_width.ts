import { useEffect, useState } from "react";

/**
 * A hook that returns the current safe viewport area width.
 *
 * Treat the returned `viewportWidth` as the entirety of the page that is
 * currently visible within the user's browser window, _including 'unsafe'
 * areas (such as on smartphones with curved screen edges).
 *
 * @returns {number} `viewportWidth`
 */
export function useViewportWidth() {
  const [observedViewportWidth, setObservedViewportWidth] = useState(
    window.innerWidth
  );

  useEffect(() => {
    const onWindowResize = () => {
      //console.log(`[useViewportWidth] RESIZED to ${getViewportWidth()}px`);
      setObservedViewportWidth(getViewportWidth());
    };
    window.addEventListener("resize", onWindowResize);

    // Initial update.
    setObservedViewportWidth(getViewportWidth());

    return () => {
      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

  return observedViewportWidth;
}

/**
 * Returns the current safe viewport area width.
 *
 * @returns {number}
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/clientWidth
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/innerWidth
 */
export const getViewportWidth = () => document.documentElement.clientWidth;
