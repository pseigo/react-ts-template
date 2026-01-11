/*
 * react-ts-template/scripts/project/rename/options.ts
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
import {
  parseArgs,
  ParseArgsOptionDescriptor,
  type ParseArgsOptionsConfig,
} from "node:util";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import { isErrorWithMessage } from "@/scripts/common/errors";
import { type Logger } from "@/scripts/common/logging";
import { isNonEmptyString } from "@/scripts/common/strings";
import { NameCase } from "./cases";

interface CommonOpts {
  logger: Logger;
}

/**
 * Unique string key identifying a command-line option.
 */
export enum OptionName {
  HELP = "help",

  OLD_NAME_SNAKE = "old-snake",
  OLD_NAME_KEBAB = "old-kebab",
  OLD_NAME_PASCAL = "old-pascal",
  OLD_NAME_TITLE = "old-title",

  NEW_NAME_SNAKE = "new-snake",
  NEW_NAME_KEBAB = "new-kebab",
  NEW_NAME_PASCAL = "new-pascal",
  NEW_NAME_TITLE = "new-title",

  SKIP_DIRTY_CHECK = "skip-dirty-check",
  SKIP_REVIEW = "skip-review",

  NO_PAGER = "no-pager",
  NO_GIT = "no-git",
}

export const k_shortOption: Record<
  | OptionName.HELP
  | OptionName.SKIP_DIRTY_CHECK
  | OptionName.SKIP_REVIEW
  | OptionName.NO_PAGER
  | OptionName.NO_GIT,
  string
> = {
  [OptionName.HELP]: "h",
  [OptionName.SKIP_DIRTY_CHECK]: "D",
  [OptionName.SKIP_REVIEW]: "R",
  [OptionName.NO_PAGER]: "P",
  [OptionName.NO_GIT]: "G",
};

const k_defaultOldNames = {
  snake: requireWellFormedSnakeCaseOrNull("unnamed_project")!,
  kebab: requireWellFormedKebabCaseOrNull("unnamed-project")!,
  pascal: requireWellFormedPascalCaseOrNull("UnnamedProject")!,
  title: requireWellFormedTitleCaseOrNull("Unnamed Project")!,
};

export const k_parseArgsOptions: Record<OptionName, ParseArgsOptionDescriptor> =
  {
    [OptionName.HELP]: {
      short: k_shortOption[OptionName.HELP],
      type: "boolean",
    },

    [OptionName.OLD_NAME_SNAKE]: {
      type: "string",
    },
    [OptionName.OLD_NAME_KEBAB]: {
      type: "string",
    },
    [OptionName.OLD_NAME_PASCAL]: {
      type: "string",
    },
    [OptionName.OLD_NAME_TITLE]: {
      type: "string",
    },

    [OptionName.NEW_NAME_SNAKE]: {
      type: "string",
    },
    [OptionName.NEW_NAME_KEBAB]: {
      type: "string",
    },
    [OptionName.NEW_NAME_PASCAL]: {
      type: "string",
    },
    [OptionName.NEW_NAME_TITLE]: {
      type: "string",
    },

    [OptionName.SKIP_DIRTY_CHECK]: {
      short: k_shortOption[OptionName.SKIP_DIRTY_CHECK],
      type: "boolean",
    },
    [OptionName.SKIP_REVIEW]: {
      short: k_shortOption[OptionName.SKIP_REVIEW],
      type: "boolean",
    },

    [OptionName.NO_PAGER]: {
      short: k_shortOption[OptionName.NO_PAGER],
      type: "boolean",
    },
    [OptionName.NO_GIT]: {
      short: k_shortOption[OptionName.NO_GIT],
      type: "boolean",
    },
  };

type ParseArgsResults = ReturnType<typeof parseArgs>["values"];
type ParseArgsResultPropertyValue = ParseArgsResults[string];

/**
 * Shared options interface for all rename script code.
 */
export interface RenameOptions {
  showHelp: boolean;

  oldNameSnake: string;
  oldNameKebab: string;
  oldNamePascal: string;
  oldNameTitle: string;

  newNameSnake: string;
  newNameKebab: string;
  newNamePascal: string;
  newNameTitle: string;

  skipDirtyCheck: boolean;
  skipReview: boolean;

  noPager: boolean;
  noGit: boolean;
}

export function parseRenameArgs(
  rawArgs: string[],
  opts: CommonOpts
): RenameOptions {
  let parsed: ReturnType<typeof parseArgs> | null = null;
  try {
    parsed = parseArgs({ args: rawArgs, options: k_parseArgsOptions });
  } catch (error: unknown) {
    if (isErrorWithMessage(error, TypeError)) {
      opts.logger.error(`Argument error: ${error.message}`);
    } else {
      opts.logger.error("Argument error.");
    }
    throw new Error("Argument error.", { cause: error });
  }

  const args = parsed.values;

  //for (const [option, value] of Object.entries(args)) {
  //  //logger.info(`option='${option}', value=${value}`);
  //}

  return {
    showHelp: args[OptionName.HELP] === true,
    ...resolveOldNames(args),
    ...resolveNewNames(args),
    skipDirtyCheck: args[OptionName.SKIP_DIRTY_CHECK] === true,
    skipReview: args[OptionName.SKIP_REVIEW] === true,
    noPager: args[OptionName.NO_PAGER] === true,
    noGit: args[OptionName.NO_GIT] === true,
  };
}

/**
 * Returns well-formed project names for snake, kebab, pascal, and title case.
 *
 * @throws {Error} If any name in `args` is not the correct type
 *  (`string` or `undefined`).
 *
 * @throws {Error} If snake and kebab are both missing from `args`.
 * @throws {Error} If pascal and title are both missing from `args`.
 *
 * @throws {Error} If any provided name in `args` is not well-formed;
 *  e.g., "bad_Snake_" as opposed to "good_snake_case", or
 *  "badPascal" as opposed to "GoodPascal".
 */
function resolveOldNames(args: ParseArgsResults): {
  oldNameSnake: string;
  oldNameKebab: string;
  oldNamePascal: string;
  oldNameTitle: string;
} {
  const allMissing: boolean = [
    OptionName.OLD_NAME_SNAKE,
    OptionName.OLD_NAME_KEBAB,
    OptionName.OLD_NAME_PASCAL,
    OptionName.OLD_NAME_TITLE,
  ]
    .map((option) => args[option]) // try fetch from `args`
    .every((value: ParseArgsResultPropertyValue) => value === undefined);

  if (allMissing) {
    return {
      oldNameSnake: k_defaultOldNames.snake,
      oldNameKebab: k_defaultOldNames.kebab,
      oldNamePascal: k_defaultOldNames.pascal,
      oldNameTitle: k_defaultOldNames.title,
    };
  }

  const [snake, kebab, pascal, title] = requireWellFormedProjectNames(
    args[OptionName.OLD_NAME_SNAKE],
    args[OptionName.OLD_NAME_KEBAB],
    args[OptionName.OLD_NAME_PASCAL],
    args[OptionName.OLD_NAME_TITLE]
  );

  return {
    oldNameSnake: snake,
    oldNameKebab: kebab,
    oldNamePascal: pascal,
    oldNameTitle: title,
  };
}

/**
 * @see {@link resolveOldNames}
 */
function resolveNewNames(args: ParseArgsResults): {
  newNameSnake: string;
  newNameKebab: string;
  newNamePascal: string;
  newNameTitle: string;
} {
  const [snake, kebab, pascal, title] = requireWellFormedProjectNames(
    args[OptionName.NEW_NAME_SNAKE],
    args[OptionName.NEW_NAME_KEBAB],
    args[OptionName.NEW_NAME_PASCAL],
    args[OptionName.NEW_NAME_TITLE]
  );

  return {
    newNameSnake: snake,
    newNameKebab: kebab,
    newNamePascal: pascal,
    newNameTitle: title,
  };
}

function requireWellFormedProjectNames(
  rawSnake: ParseArgsResultPropertyValue,
  rawKebab: ParseArgsResultPropertyValue,
  rawPascal: ParseArgsResultPropertyValue,
  rawTitle: ParseArgsResultPropertyValue
): [string, string, string, string] {
  const validTypedRawSnake = requireValidProjectNameType(rawSnake);
  const validTypedRawKebab = requireValidProjectNameType(rawKebab);
  const validTypedRawPascal = requireValidProjectNameType(rawPascal);
  const validTypedRawTitle = requireValidProjectNameType(rawTitle);

  const maybeSnake = requireWellFormedSnakeCaseOrNull(validTypedRawSnake);
  const maybeKebab = requireWellFormedKebabCaseOrNull(validTypedRawKebab);
  const maybePascal = requireWellFormedPascalCaseOrNull(validTypedRawPascal);
  const maybeTitle = requireWellFormedTitleCaseOrNull(validTypedRawTitle);

  const [snake, kebab] = resolveSnakeAndKebab(maybeSnake, maybeKebab);
  const [pascal, title] = resolvePascalAndTitle(maybePascal, maybeTitle);

  return [snake, kebab, pascal, title];
}

function requireValidProjectNameType(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }
  if (value === undefined) {
    return null;
  }
  throw new Error(`A project name is of the wrong type. Got: \`${value}\`.`);
}

// TODO: Write unit tests for these case-checking patterns.
function requireWellFormedSnakeCaseOrNull(str: string | null): string | null {
  if (str === null) {
    return null;
  }
  if (/^[a-z]+(?:_[a-z]+)*$/.test(str)) {
    return str;
  }
  throw new Error(`A project name does not match Snake case. Got: "${str}".`);
}

function requireWellFormedKebabCaseOrNull(str: string | null): string | null {
  if (str === null) {
    return null;
  }
  if (/^[a-z]+(?:-[a-z]+)*$/.test(str)) {
    return str;
  }
  throw new Error(`A project name does not match Kebab case. Got: "${str}".`);
}

function requireWellFormedPascalCaseOrNull(str: string | null): string | null {
  if (str === null) {
    return null;
  }
  if (/^([A-Z][a-z]*)+$/.test(str)) {
    return str;
  }
  throw new Error(`A project name does not match Pascal case. Got: "${str}".`);
}

function requireWellFormedTitleCaseOrNull(str: string | null): string | null {
  if (str === null) {
    return null;
  }
  if (/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(str)) {
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
function resolveSnakeAndKebab(
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
function resolvePascalAndTitle(
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
const snakeToKebab = (snake: string): string => snake.replaceAll("_", "-");

/**
 * Returns `kebab` as a snake-case string (lowercase with words separated by
 * underscores).
 *
 * @requires `kebab` is a kebab-case string (lowercase with words separated by
 *  hyphens).
 *
 * @example kebabToSnake("unnamed-project"); //=> "unnamed_project"
 */
const kebabToSnake = (kebab: string): string => kebab.replaceAll("-", "_");

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
const pascalToTitle = (pascal: string): string =>
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
const titleToPascal = (title: string): string => title.replaceAll(" ", "");
