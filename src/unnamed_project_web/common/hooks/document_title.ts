import { useState, useEffect } from "react";

import { isStringArray, wrap } from "tanaris/arrays";
import { isString } from "tanaris/strings";

const siteName = "Unnamed Project";

/**
 * Hook to set and access the document's title.
 *
 * Both `useDocumentTitle` and its `setDocumentTitle` setter take a string. You
 * can also pass `null` or call `useDocumentTitle()` with no arguments to use
 * the site's default title.
 *
 * ## Creating consistent titles with `toDocumentTitle`
 *
 * If you would like the title to include the site name (probably in most
 * cases), or would like the title to describe more than one section in a way
 * that's consistent across the application, use `toDocumentTitle` to create
 * the value you pass into `setDocumentTitle`. See the documentation for
 * `toDocumentTitle` to learn more.
 *
 * @example &lt;caption>Setting the document title on mount.&lt;/caption>
 * import {
 *   useDocumentTitle,
 *   toDocumentTitle
 * } from "@/unnamed_project_web/common/hooks/document_title";
 *
 * export function ExamplePage() {
 *   const [documentTitle, setDocumentTitle] = useDocumentTitle(
 *     toDocumentTitle(
 *       ["Sub-section", "Initial Title"]
 *     )
 *   );
 *
 *   return (
 *     <main>
 *       <h1>Example Page</h1>
 *       <p>
 *          The current document title is:{" "}
 *          <code>{documentTitle}</code>
 *       </p>
 *       <button onClick={() => setDocumentTitle("New Title")}>
 *          Change Document Title
 *       </button>
 *    </main>
 *  );
 * }
 *
 * @param {(string | null)} initialTitle}
 *
 * @returns {[string, React.Dispatch<React.SetStateAction<string | null>>]} `[documentTitle, setDocumentTitle]`
 */
export function useDocumentTitle(initialTitle = null) {
  const [title, setTitle] = useState<string>(initialTitle ?? defaultTitle());

  useEffect(() => {
    document.title = title;

    // Set default on unmount in case the next route doesn't set a title.
    return () => {
      document.title = defaultTitle();
    };
  }, [title]);

  return [title, setTitle];
}

/**
 * @returns {string}
 */
function defaultTitle() {
  return siteName ?? "";
}

/**
 * Creates a document title string with the site name (optionally) appended to
 * the end.
 *
 * It is recommended to always use this function for document titles across the
 * website/app. The only time you would _not_ use this function is if you want
 * to set a completely custom document title (e.g., on the main landing page).
 *
 * The result of this function is typically passed into the hook
 * `useDocumentTitle` or the `setDocumentTitle` setter it returns.
 *
 * @param {(string | string[])} titleOrTitles
 * @param {object} opts
 * @param {boolean} opts.withSiteName - Iff `true`, appends site name to end of document title. Defaults to `true`.
 *
 * @returns {string}
 */
export function toDocumentTitle(titleOrTitles, opts = { withSiteName: true }) {
  const { withSiteName } = opts;
  const titles = normalizeTitleOrTitles(titleOrTitles, withSiteName);
  const title = titles.reduceRight((acc, e) => e + " | " + acc);
  return title;
}

/**
 * @param {(string | string[])} titleOrTitles
 * @param {boolean} withSiteName
 *
 * @returns {string[]}
 */
function normalizeTitleOrTitles(titleOrTitles, withSiteName) {
  if (!(isString(titleOrTitles) || isStringArray(titleOrTitles))) {
    throw new Error(
      "'titleOrTitles' argument must be a 'string' or 'string[]'"
    );
  }

  const titles = wrap(titleOrTitles);

  if (withSiteName) {
    return [...titles, siteName];
  } else {
    return titles;
  }
}
