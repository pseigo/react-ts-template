/*
 * react-ts-template/scripts/project/rename/glob.ts
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

import type { GlobOptionsWithoutFileTypes } from "node:fs";
import FS from "node:fs/promises";
import { basename, join as joinPath } from "node:path";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import { Logger, LogLevel } from "@/scripts/common/logging";

const logger = new Logger({
  app: k_appName,
  file: basename(__filename, k_scriptExtension),
  //level: LogLevel.DEBUG,
});

const k_globExcludePaths: string[] = [
  "assets/fonts",
  "assets/images",
  "README.md",

  // Rename script contains lots of "unnamed_project", etc. occurrences, but
  // none of them (as of writing this) should or need to be updated for project
  // renames.
  "scripts/project/rename.ts",
  "scripts/project/rename/**/*",
];

/**
 * Returns paths to all files and directories that should be scanned for
 * project renames, in non-ascending order so leaf entries appear before
 * ancestors.
 *
 * @requires The process's working directory to be the package's root
 *  directory. Use `assertCwdIsPackageRootDir` from
 *  "@/scripts/common/packages" to assert this invariant before calling
 *  this function.
 */
export async function selectFiles(): Promise<string[]> {
  const gitIgnorePaths: string[] = await readGitIgnorePaths();
  const excludePaths: string[] = gitIgnorePaths.concat(k_globExcludePaths);

  const opts: GlobOptionsWithoutFileTypes = {
    withFileTypes: false,
    exclude: excludePaths,
  };
  const glob = "**/*";
  const matchesIter = await FS.glob(glob, opts);
  const unsortedMatches = await collect(matchesIter);

  const collator = new Intl.Collator();
  const matches = unsortedMatches.sort((left, right) =>
    // Sort descending so renames apply to leaf entries before ancestors.
    collator.compare(right, left)
  );
  //matches.sort((left, right) => right.localeCompare(left));

  return matches;
}

/**
 * Returns paths listed in the project's `.gitignore` file, or `[]` if it
 * doesn't exist.
 *
 * @requires cwd is package root.
 *
 * @throws {Error} If `.gitignore` exists but process does not have permission
 *  to read it.
 */
async function readGitIgnorePaths(): Promise<string[]> {
  const lines = await readGitIgnore();
  return lines.map((l) => joinPath(".", l)); // Normalize for FS.
}

/**
 * Returns non-comment lines of the project's `.gitignore` file, or `[]` if it
 * doesn't exist.
 *
 * @requires cwd is package root.
 *
 * @throws {Error} If `.gitignore` exists but process does not have permission
 *  to read it.
 */
async function readGitIgnore(): Promise<string[]> {
  const filePath = ".gitignore";

  const fileExists = await resolves(() =>
    FS.access(filePath, FS.constants.F_OK)
  );
  const fileReadable = await resolves(() =>
    FS.access(filePath, FS.constants.F_OK | FS.constants.R_OK)
  );

  if (fileExists && !fileReadable) {
    throw new Error(`Missing read permission for '${filePath}'.`);
  }

  try {
    const contents = await FS.readFile(filePath, { encoding: "utf-8" });
    return contents
      .split("\n")
      .filter((s) => s !== "" && !s.trimStart().startsWith("#"));
  } catch (error: unknown) {
    return [];
  }
}

// TODO: extract `resolves` to tanaris/promises
/**
 * Returns `true` if the promise returned by `fn` resolves, otherwise `false`
 * if it rejects.
 */
async function resolves(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return true;
  } catch (error: unknown) {
    return false;
  }
  // TODO: Consider adding an optional `timeoutMs` parameter and use `Promise.race` if there's a use case for it.
}

// TODO: (maybe) extract `collect` to tanaris/iterators
async function collect<T>(iter: AsyncIterator<T>): Promise<T[]> {
  const values: T[] = [];
  let result = await iter.next();
  while (!result.done) {
    values.push(result.value);
    result = await iter.next();
  }
  return values;
}
