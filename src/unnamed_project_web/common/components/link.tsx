import { clsx, type ClassValue as ClsxClassValue } from "clsx";
import type * as React from "react";
import { Link as WouterLink } from "wouter";

/**
 * The brightness of a link's background. Used to make the link more legible.
 *
 * - "light" indicates a light background, resulting in a darker link.
 * - "dark" indicates a dark background, resulting in a lighter link.
 * - "auto" assumes the background is "light" in light mode, or "dark" in dark mode.
 * - "auto_invert" assumes the background is "dark" in light mode, or "light" in dark mode.
 *
 * To clarify, "light" and "dark" assume the background does NOT change between
 * light and dark mode. "auto" and "auto_invert" flip between styles for
 * "light" and "dark" backgrounds based on whether the site is currently in
 * light mode or dark mode.
 *
 */
export type LinkBackground = "light" | "dark" | "auto" | "auto_invert";

export interface InternalLinkProps {
  children: React.ReactNode;

  href: string;

  /**
   * Opens in a new tab or window (depending on *  the user's browser settings)
   * when `true`, otherwise opens in the tab where *  it is clicked (navigates
   * away from the current page). Defaults to `false`.
   */
  newTab?: boolean;

  /** Defaults to "auto". **/
  background?: LinkBackground;

  /** If `true` does not style the link. Defaults to `false`. */
  unstyled?: boolean;

  className?: ClsxClassValue;
}

export function InternalLink(props: InternalLinkProps) {
  const {
    children,
    href,
    newTab = false,
    background = "auto",
    unstyled = false,
    className = null,
  } = props;

  // TODO: Don't put `background` on element. Only accept global attributes and <a> attributes. Figure out simple way to document and process taking global attributes and element-specific attributes until/if we use TypeScript.
  if (newTab === true) {
    return (
      <a
        href={href}
        target="_blank"
        className={clsx(classesForLink(background, unstyled, className))}
      >
        {children}
      </a>
    );
  } else {
    return (
      <WouterLink
        href={href}
        className={clsx(classesForLink(background, unstyled, className))}
      >
        {children}
      </WouterLink>
    );
  }
}

export interface ExternalLinkProps {
  children: React.ReactNode;

  href: string;

  /**
   * Opens in a new tab or window (depending on *  the user's browser settings)
   * when `true`, otherwise opens in the tab where *  it is clicked (navigates
   * away from the current page). Defaults to `true`.
   */
  newTab?: boolean;

  /** Defaults to "auto". **/
  background?: LinkBackground;

  /** If `true` does not style the link. Defaults to `false`. */
  unstyled?: boolean;

  className?: ClsxClassValue;
}

export function ExternalLink(props: ExternalLinkProps) {
  const {
    children,
    href,
    newTab = true,
    background = "auto",
    unstyled = false,
    className = null,
  } = props;

  // TODO: Don't put `background` on element. Only accept global attributes and <a> attributes. Figure out simple way to document and process taking global attributes and element-specific attributes until/if we use TypeScript.
  // TODO: Merge custom 'rel' string with privacy/security presets, and make sure the 'rel' we set doesn't get overridden. e.g., rel="help"
  // TODO: Make sure we're using the appropriate attributes for privacy/security.
  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel="noreferrer noopener"
      className={clsx(classesForLink(background, unstyled, className))}
    >
      {children}
    </a>
  );
}

function classesForLink(background, unstyled, className): ClsxClassValue {
  return [
    "decoration-[1.5px]",
    !unstyled && ["hover:underline", classesForBackground(background)],
    className,
  ];
}

function classesForBackground(background: LinkBackground): ClsxClassValue {
  switch (background) {
    case "light":
      return "text-[rgb(36,109,225)] hover:text-[rgb(78,137,230)]";

    case "dark":
      return "text-[rgb(107,156,234)] hover:text-[rgb(138,178,242)]";

    case "auto":
      return [
        "text-[rgb(36,109,225)] hover:text-[rgb(78,137,230)]",
        "dark:text-[rgb(107,156,234)] dark:hover:text-[rgb(138,178,242)]",
      ];

    case "auto_invert":
      return [
        "text-[rgb(107,156,234)] hover:text-[rgb(138,178,242)]",
        "dark:text-[rgb(36,109,225)] dark:hover:text-[rgb(78,137,230)]",
      ];
  }
}
