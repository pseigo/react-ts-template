import { useEffect, useRef, useState } from "react";

/**
 * A hook to read an element's current height. Uses `ResizeObserver`
 * internally.
 *
 * `elementRef.current` must be non-null by the time the component's effects run.
 *
 * @param {React.RefObject} elementRef
 *
 * @returns [integer] `[height]`
 */
export function useElementHeightObserver(
  elementRef: React.RefObject<HTMLElement>
) {
  const observerRef = useRef<ResizeObserver | null>(null);
  const [observedHeight, setObservedHeight] = useState(0);

  useEffect(() => {
    observerRef.current = new ResizeObserver((entries) => {
      //const now = new Date().toISOString();

      for (const entry of entries) {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const height = entry.borderBoxSize[0]?.blockSize ?? 0;

        //console.log(`[${now}][useHeightObserver] entry`, entry);
        //console.log(`[${now}][useHeightObserver] height`, height.toFixed(3));

        setObservedHeight(height);
      }
    });

    observerRef.current.observe(elementRef.current);

    return () => {
      if (observerRef.current != null) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  return [observedHeight];
}
