/*
 * react-ts-template/scripts/common/strings.ts
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Peyton Seigo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the “Software”), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

// TODO: extract all to tanaris

import { basename } from "node:path";

import { isNaturalNumber } from "@/scripts/common/numbers";

export { wrapText, wrapTextSmart, WrapTextOptions } from "./strings/wrap";

export interface LeftPadTextOptions {
  /** Newline escape sequence. Defaults to "\n". */
  newLine?: string;
}
const k_leftPadTextDefaultOpts: LeftPadTextOptions = {
  newLine: "\n",
};

/**
 * Returns `suffix` iff `n` is singular (1), otherwise empty string.
 *
 * @param `suffix` - Defaults to "s".
 */
export const plural = (n: number, suffix: string = "s"): string =>
  n === 1 ? "" : suffix;

/**
 * Returns `true` iff `value` is some string other than `""`,
 * otherwise `false`.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

/**
 * Returns `true` iff `str` is not `""` and only contains whitespace
 * characters.
 *
 * Implemented by matching against the RegEx `\s` character.
 */
export const isWhitespace = (str: string): boolean => /^\s+$/.test(str);

/**
 * Returns a copy of `str` with `padding` spaces inserted at the start of each
 * line in `str`.
 */
export function leftPadText(
  str: string,
  padding: number,
  opts: LeftPadTextOptions = {}
): string {
  const { newLine } = { ...k_leftPadTextDefaultOpts, ...opts };
  const prefix = " ".repeat(padding);
  return str
    .split(newLine!)
    .map((line) => (line !== "" ? prefix + line : line))
    .join(newLine!);
}
