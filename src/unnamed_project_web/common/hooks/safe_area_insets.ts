/**
 * @file Hooks for accessing the 'safe-area-inset' CSS environment variables.
 *
 * @requires `../documents/safe_area_inset.css` is included in the stylesheet
 *  of every page containing a component using a hook from this file. It's a
 *  tiny file, so consider importing it into the global stylesheet for your
 *  application.
 *
 * @see https://drafts.csswg.org/css-env/#safe-area-insets
 * @see https://webkit.org/blog/7929/designing-websites-for-iphone-x/
 * @see https://m3.material.io/foundations/layout/understanding-layout/hardware-considerations#8a709768-dc91-4fe5-beb9-be1e2206dd8b
 */

import { useEffect, useRef, useState } from "react";

/**
 * See this hook's file documentation for details.
 *
 * @returns {[number, number, number, number]}
 *  `[safeAreaInsetTop, safeAreaInsetRight, safeAreaInsetBottom, safeAreaInsetLeft]`
 */
export function useSafeAreaInsets() {
  const documentCssRef = useRef(getDocumentCss());
  const [insetTop, setInsetTop] = useState(0);
  const [insetRight, setInsetRight] = useState(0);
  const [insetBottom, setInsetBottom] = useState(0);
  const [insetLeft, setInsetLeft] = useState(0);

  useEffect(() => {
    assertInvariants("useSafeAreaInsets", documentCssRef.current);

    const update = () => {
      setInsetTop(getInsetTop(documentCssRef.current));
      setInsetRight(getInsetRight(documentCssRef.current));
      setInsetBottom(getInsetBottom(documentCssRef.current));
      setInsetLeft(getInsetLeft(documentCssRef.current));
    };
    update();

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return [insetTop, insetRight, insetBottom, insetLeft];
}

/**
 * See this hook's file documentation for details.
 *
 * @returns {number} `safeAreaInsetTop`
 */
export function useSafeAreaInsetTop() {
  const documentCssRef = useRef(getDocumentCss());
  const [insetTop, setInsetTop] = useState(0);

  useEffect(() => {
    assertInvariants("useSafeAreaInsetTop", documentCssRef.current);

    const update = () => setInsetTop(getInsetTop(documentCssRef.current));
    update();

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return insetTop;
}

/**
 * See this hook's file documentation for details.
 *
 * @returns {number} `safeAreaInsetRight`
 */
export function useSafeAreaInsetRight() {
  const documentCssRef = useRef(getDocumentCss());
  const [insetRight, setInsetRight] = useState(0);

  useEffect(() => {
    assertInvariants("useSafeAreaInsetRight", documentCssRef.current);

    const update = () => setInsetRight(getInsetRight(documentCssRef.current));
    update();

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return insetRight;
}

/**
 * See this hook's file documentation for details.
 *
 * @returns {number} `safeAreaInsetBottom`
 */
export function useSafeAreaInsetBottom() {
  const documentCssRef = useRef(getDocumentCss());
  const [insetBottom, setInsetBottom] = useState(0);

  useEffect(() => {
    assertInvariants("useSafeAreaInsetBottom", documentCssRef.current);

    const update = () => setInsetBottom(getInsetBottom(documentCssRef.current));
    update();

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return insetBottom;
}

/**
 * See this hook's file documentation for details.
 *
 * @returns {number} `safeAreaInsetLeft`
 */
export function useSafeAreaInsetLeft() {
  const documentCssRef = useRef(getDocumentCss());
  const [insetLeft, setInsetLeft] = useState(0);

  useEffect(() => {
    assertInvariants("useSafeAreaInsetLeft", documentCssRef.current);

    const update = () => setInsetLeft(getInsetLeft(documentCssRef.current));
    update();

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return insetLeft;
}

/**
 * @returns {CSSStyleDeclaration}
 */
function getDocumentCss() {
  return window.getComputedStyle(document.documentElement);
}

/**
 * @param {CSSStyleDeclaration} documentCss
 *
 * @throws {Error} if an invariant does not hold
 */
function assertInvariants(hookName, documentCss) {
  const errorHint =
    "has 'unnamed_project/common/documents/safe_area_inset.css' been imported into this page's stylesheet?";

  for (const side of ["top", "right", "bottom", "left"]) {
    const name = `--safe-area-inset-${side}`;
    const value = documentCss.getPropertyValue(name);

    if (value === "") {
      throw new Error(
        `[${hookName}] no value for property '${name}' on document (${errorHint})`
      );
    } else if (Number.isNaN(value)) {
      throw new Error(
        `[${hookName}] property '${name}' cannot be converted to a number (${errorHint})`
      );
    }
  }
}

function getInsetTop(documentCss) {
  return doGetInset(documentCss, "--safe-area-inset-top");
}

function getInsetRight(documentCss) {
  return doGetInset(documentCss, "--safe-area-inset-right");
}

function getInsetBottom(documentCss) {
  return doGetInset(documentCss, "--safe-area-inset-bottom");
}

function getInsetLeft(documentCss) {
  return doGetInset(documentCss, "--safe-area-inset-left");
}

function doGetInset(documentCss, propertyName) {
  return parseFloat(documentCss.getPropertyValue(propertyName));
}
