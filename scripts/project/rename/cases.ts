/*
 * react-ts-template/scripts/project/rename/cases.ts
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

import { isNonEmptyString } from "@/scripts/common/strings";

export const enum NameCase {
  SNAKE = 1 << 0,
  KEBAB = 1 << 1,
  PASCAL = 1 << 2,
  TITLE = 1 << 3,
}

export function nameCasesFromFlags(
  flags: number /* NameCaseFlags */
): NameCase[] {
  const allCases: NameCase[] = [
    NameCase.SNAKE,
    NameCase.KEBAB,
    NameCase.PASCAL,
    NameCase.TITLE,
  ];
  return allCases.reduce((acc: NameCase[], nameCase) => {
    if ((flags & nameCase) !== 0) {
      acc.push(nameCase);
    }
    return acc;
  }, []);
}

// TODO: Write unit tests for these case-checking patterns.
export function requireWellFormedSnakeCaseOrNull(str: string | null): string | null {
  if (str === null) {
    return null;
  }
  if (/^[a-z]+(?:_[a-z]+)*$/.test(str)) {
    return str;
  }
  throw new Error(`A project name does not match Snake case. Got: "${str}".`);
}

export function requireWellFormedKebabCaseOrNull(str: string | null): string | null {
  if (str === null) {
    return null;
  }
  if (/^[a-z]+(?:-[a-z]+)*$/.test(str)) {
    return str;
  }
  throw new Error(`A project name does not match Kebab case. Got: "${str}".`);
}

export function requireWellFormedPascalCaseOrNull(str: string | null): string | null {
  if (str === null) {
    return null;
  }
  if (/^([A-Z][a-z]*)+$/.test(str)) {
    return str;
  }
  throw new Error(`A project name does not match Pascal case. Got: "${str}".`);
}

// TODO: Allow punctuation in title case (e.g., apostrophe, en dash).
export function requireWellFormedTitleCaseOrNull(str: string | null): string | null {
  if (str === null) {
    return null;
  }
  if (/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(str)) {
    return str;
  }
  throw new Error(`A project name does not match Title case. Got: "${str}".`);
}

/**
 * @throws {Error} If `snake` and `kebab` are both `null` or `""`.
 *
 * @requires `snake` and `kebab` are well-formed.
 *
 * @returns `[snake, kebab]`
 */
export function resolveSnakeAndKebab(
  snake: string | null,
  kebab: string | null
): [string, string] {
  const haveSnake = isNonEmptyString(snake);
  const haveKebab = isNonEmptyString(kebab);
  if (haveSnake && haveKebab) {
    return [snake, kebab];
  }
  if (haveSnake && !haveKebab) {
    return [snake, snakeToKebab(snake)];
  }
  if (!haveSnake && haveKebab) {
    return [kebabToSnake(kebab), kebab];
  }
  throw new Error(
    `At least one of Snake or Kebab case must be provided for project names.`
  );
}

/**
 * @throws {Error} If `pascal` and `title` are both `null` or `""`.
 *
 * @requires `pascal` and `title` are well-formed.
 *
 * @returns `[pascal, title]`
 */
export function resolvePascalAndTitle(
  pascal: string | null,
  title: string | null
): [string, string] {
  const havePascal = isNonEmptyString(pascal);
  const haveTitle = isNonEmptyString(title);
  if (havePascal && haveTitle) {
    return [pascal, title];
  }
  if (havePascal && !haveTitle) {
    return [pascal, pascalToTitle(pascal)];
  }
  if (!havePascal && haveTitle) {
    return [titleToPascal(title), title];
  }
  throw new Error(
    `At least one of Pascal or Title case must be provided for project names.`
  );
}

/**
 * Returns `snake` as a kebab-case string (lowercase with words separated by
 * hyphens).
 *
 * @requires `snake` is a snake-case string (lowercase with words separated by
 *  underscores).
 *
 * @example snakeToKebab("unnamed_project"); //=> "unnamed-project"
 */
export const snakeToKebab = (snake: string): string => snake.replaceAll("_", "-");

/**
 * Returns `kebab` as a snake-case string (lowercase with words separated by
 * underscores).
 *
 * @requires `kebab` is a kebab-case string (lowercase with words separated by
 *  hyphens).
 *
 * @example kebabToSnake("unnamed-project"); //=> "unnamed_project"
 */
export const kebabToSnake = (kebab: string): string => kebab.replaceAll("-", "_");

/**
 * Returns `pascal` as a title-case string (each word capitalized and separated
 * by a space).
 *
 * @requires `pascal` is a pascal-case string (each word capitalized with no
 *  separator).
 *
 * @example pascalToTitle("UnnamedProject"); //=> "Unnamed Project"
 * @example pascalToTitle("SqlUtilsPackage"); //=> "Sql Utils Package"
 * @example pascalToTitle("SQLUtilsPackage"); //=> "S Q L Utils Package"
 */
export const pascalToTitle = (pascal: string): string =>
  // `?<!^` means "look behind that the current position is not the start".
  pascal.replaceAll(/(?<!^)([A-Z])/g, " $1");

/**
 * Returns `title` as a pascal-case string (each word capitalized with no
 * separator).
 *
 * @requires `title` is a title-case string (each word capitalized and
 *  separated by a space).
 *
 * @example titleToPascal("Unnamed Project"); //=> "UnnamedProject"
 * @example titleToPascal("Sql Utils Package"); //=> "SqlUtilsPackage"
 * @example titleToPascal("SQL Utils Package"); //=> "SQLUtilsPackage"
 */
export const titleToPascal = (title: string): string => title.replaceAll(" ", "");
