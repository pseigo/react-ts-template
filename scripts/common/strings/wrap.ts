/*
 * react-ts-template/scripts/common/strings/wrap.ts
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

import { basename } from "node:path";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import { Logger, LogLevel } from "@/scripts/common/logging";

import { k_locale } from "@/scripts/common/constants";
import { isNaturalNumber } from "@/scripts/common/numbers";

import { isWhitespace } from "../strings";

const logger = new Logger({
  app: k_appName,
  file: basename(__filename, k_scriptExtension),
  level: LogLevel.DEBUG,
});

export interface WrapTextOptions {
  /** Newline escape sequence. Defaults to "\n". */
  newLine?: string;

  /**
   * Number of spaces to left-indent each row. Defaults to 0.
   *
   * @requires A non-negative integer.
   */
  leftPadding?: number;
}
const k_wrapTextDefaultOpts: WrapTextOptions = {
  newLine: "\n",
  leftPadding: 0,
};

/**
 * Returns a copy of `str` with `newline`s inserted so that no row exceeds
 * `maxGraphemesPerLine` visible characters.
 *
 * @param maxGraphemesPerLine - Inclusive upper-bound for max number of visible
 *  characters per row.
 *
 * @requires `maxGraphemesPerLine` is a non-negative integer.
 * @throws {Error} If `maxGraphemesPerLine` or `opts.leftPadding` (if given) are not
 *  non-negative integers.
 *
 * @requires `maxGraphemesPerLine > opts.leftPadding`.
 * @throws {Error] If `maxGraphemesPerLine <= opts.leftPadding`.
 *
 * @example wrapText("ABCD", 2); //=> "AB\nCD"
 * @example wrapText("ABCD", 4, { options: leftPadding: 2 }); //=> "  AB\n  CD"
 */
export function wrapText(
  str: string,
  maxGraphemesPerLine: number,
  opts: WrapTextOptions = {}
): string {
  const { newLine, leftPadding } = { ...k_wrapTextDefaultOpts, ...opts };

  if (!isNaturalNumber(maxGraphemesPerLine)) {
    throw new Error(
      `'maxGraphemesPerLine' must be a non-negative integer. Got: ${maxGraphemesPerLine}`
    );
  }
  if (!isNaturalNumber(leftPadding)) {
    throw new Error(
      `'leftPadding' must be a non-negative integer. Got: ${maxGraphemesPerLine}`
    );
  }
  if (maxGraphemesPerLine <= leftPadding) {
    throw new Error(
      `'maxGraphemesPerLine' (${maxGraphemesPerLine}) must be greater than 'leftPadding' (${leftPadding}); no space to render text.`
    );
  }

  const linePrefix = " ".repeat(leftPadding);
  return doWrapText(str, 0, [], maxGraphemesPerLine, linePrefix, newLine!);
}

/**
 * @requires `maxGraphemesPerLine > linePrefix.length`.
 */
function doWrapText(
  str: string,
  start: number,
  acc: string[],
  maxGraphemesPerLine: number,
  linePrefix: string,
  newLine: string
): string {
  if (start >= str.length) {
    return acc.join(newLine);
  }

  const numRemainingCodeUnits: number = str.length - start;
  const end =
    start +
    Math.min(numRemainingCodeUnits, maxGraphemesPerLine - linePrefix.length);

  acc.push(str.slice(start, end));
  return doWrapText(str, end, acc, maxGraphemesPerLine, linePrefix, newLine);
}

/**
 * Like `wrapText`, but prioritizes readability.
 *
 * When a word would overflow a line, pushes it onto the next line if there is
 * space for it, otherwise breaks and hyphenates it while pushing the second
 * half to the next line.
 *
 * @param maxGraphemesPerLine - Inclusive upper-bound for max number of visible
 *  characters per row.
 *
 * @requires `maxGraphemesPerLine` is a non-negative integer.
 * @throws {Error} If `maxGraphemesPerLine` or `opts.leftPadding` (if given) are not
 *  non-negative integers.
 *
 * @requires `maxGraphemesPerLine - opts.leftPadding >= 2`
 *  for space to render text and break words across lines.
 * @throws {Error} If `maxGraphemesPerLine - leftPadding < 2`.
 *
 * @example wrapTextSmart("ABCD", 2); //=> "A-\nB-\nC-\nD"
 * @example wrapTextSmart("ABCD", 4, { options: leftPadding: 2 }); //=> "  A-\n  B-\n  C-\n  D"
 */
export function wrapTextSmart(
  str: string,
  maxGraphemesPerLine: number,
  opts: WrapTextOptions = {}
): string {
  const { newLine, leftPadding } = { ...k_wrapTextDefaultOpts, ...opts };

  if (!isNaturalNumber(maxGraphemesPerLine)) {
    throw new Error(
      `'maxGraphemesPerLine' must be a non-negative integer. Got: ${maxGraphemesPerLine}`
    );
  }
  if (!isNaturalNumber(leftPadding)) {
    throw new Error(
      `'leftPadding' must be a non-negative integer. Got: ${maxGraphemesPerLine}`
    );
  }
  if (maxGraphemesPerLine - leftPadding < 2) {
    throw new Error(
      `'maxGraphemesPerLine - leftPadding' (${maxGraphemesPerLine} - ${leftPadding} = ${maxGraphemesPerLine - leftPadding}) must be at least 2; insufficient space to render text and break words across lines.`
    );
  }

  return doWrapTextSmart(str, maxGraphemesPerLine, leftPadding, newLine!);
}

interface WrapState {
  line: string[];
  lineNumGraphemes: number;
  lines: string[][];
}

function doWrapTextSmart(
  text: string,
  maxGraphemesPerLine: number,
  leftPadding: number,
  newLine: string
): string {
  const wordSegmenter = new Intl.Segmenter(k_locale, { granularity: "word" });
  const graphemeSegmenter = new Intl.Segmenter(k_locale, {
    granularity: "grapheme",
  });
  const hyphen = "-";
  const hyphenNumGraphemes = hyphen.length; // Assume `hyphen` is ASCII.
  const linePrefix: string = " ".repeat(leftPadding);
  const linePrefixGraphemeLength: number = linePrefix.length; // Assume `linePrefix` is ASCII.

  const countGraphemes = (str: string): number =>
    [...graphemeSegmenter.segment(str)].length;

  const pushLine = (
    str: string,
    numGraphemes: number,
    state: WrapState
  ): void => {
    state.line.push(str);
    state.lineNumGraphemes += numGraphemes;
  };

  const flushLine = (state: WrapState): void => {
    state.line.push(newLine);
    state.lines.push(state.line);
    if (linePrefix === "") {
      state.line = [];
      state.lineNumGraphemes = 0;
    } else {
      state.line = [linePrefix];
      state.lineNumGraphemes = linePrefixGraphemeLength;
    }
  };

  const breakSegment = (
    s: Intl.SegmentData,
    numGraphemes: number,
    maxGraphemesPerLine: number,
    state: WrapState
  ): void => {
    if (numGraphemes === 0) {
      // Invisible characters.
      pushLine(s.segment, numGraphemes, state);
      flushLine(state);
      return;
    }
    if (isWhitespace(s.segment)) {
      // Discard segment.
      flushLine(state);
      return;
    }
    if (!s.isWordLike) {
      // Only know how to split word-likes.
      flushLine(state);
      pushLine(s.segment, numGraphemes, state);
      return;
    }
    if (numGraphemes <= hyphenNumGraphemes) {
      // No space to hyphenate.
      flushLine(state);
      pushLine(s.segment, numGraphemes, state);
      return;
    }
    if (numGraphemes <= maxGraphemesPerLine) {
      // Segment can fit on the next line without overflowing.
      flushLine(state);
      pushLine(s.segment, numGraphemes, state);
      return;
    }
    // Segment is:
    // - At least 2 graphemes.
    // - Not whitespace.
    // - Word-like.
    // - Too long to fit entirely on the next line.

    const numPreBreakGraphemes =
      maxGraphemesPerLine - hyphenNumGraphemes - state.lineNumGraphemes;

    const [front, back] = splitAtGraphemeIndex(
      s.segment,
      numPreBreakGraphemes,
      graphemeSegmenter
    );
    if (front !== "") {
      state.line.push(front);
      state.line.push(hyphen);
    }
    flushLine(state);
    if (back !== "") {
      state.line.push(back);
    }
  };

  const state: WrapState = {
    line: linePrefix === "" ? [] : [linePrefix],
    lineNumGraphemes: linePrefix === "" ? 0 : linePrefixGraphemeLength,
    lines: [],
  };

  for (const s of wordSegmenter.segment(text)) {
    const numGraphemes = countGraphemes(s.segment);
    const willOverflow =
      state.lineNumGraphemes + numGraphemes >= maxGraphemesPerLine;

    if (!willOverflow) {
      pushLine(s.segment, numGraphemes, state);
    } else {
      breakSegment(s, numGraphemes, maxGraphemesPerLine, state);
    }
  }

  if (state.line.length !== 0) {
    flushLine(state);
  }
  return state.lines.map((line: string[]) => line.join("")).join("");
}

// TODO: consider extracting `splitAtGraphemeIndex` to tanaris
/**
 * Splits `str` in two pieces at the given inclusive `index`.
 *
 * @requires `index` is a non-negative integer.
 * @throws {Error} If `index` is not a non-negative integer.
 *
 * @example splitAtGraphemeIndex("ABC", 0); //=> ["", "ABC"]
 * @example splitAtGraphemeIndex("ABC", 1); //=> ["A", "BC"]
 * @example splitAtGraphemeIndex("ABC", 2); //=> ["AB", "C"]
 * @example splitAtGraphemeIndex("ABC", 3); //=> ["ABC", ""]
 */
function splitAtGraphemeIndex(
  str: string,
  index: number,
  segmenter = new Intl.Segmenter(k_locale, { granularity: "grapheme" })
): [string, string] {
  if (!isNaturalNumber(index)) {
    throw Error(`'index' must be a non-negative integer (got: ${index}).`);
  }

  const front: string[] = [];
  const back: string[] = [];

  let i = 0;
  for (const s of segmenter.segment(str)) {
    if (i < index) {
      front.push(s.segment);
    } else {
      back.push(s.segment);
    }
    i++;
  }

  return [front.join(""), back.join("")];
}
