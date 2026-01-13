/*
 * react-ts-template/scripts/project/clean.ts
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

import fs from "node:fs";
import { basename } from "node:path";
import { exit } from "node:process";
import { styleText } from "node:util";
import { isStringArray } from "tanaris/arrays";
import { isString } from "tanaris/strings";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import { Logger, LogLevel } from "@/scripts/common/logging";

const logger = new Logger({
  app: k_appName,
  file: basename(__filename, k_scriptExtension),
  //level: LogLevel.DEBUG,
});

clean(); // <~~ Entry point

function clean() {
  const pathsToDelete: string[] = filterInvalidPaths([
    "tags",
    "_build/dev",
    "_build/config",
    "_build/dist.zip",
    "_dist",
  ]);
  cleanPaths(pathsToDelete);
}

/**
 * Returns a copy of `paths` without any that (a) don't exist, (b) the user
 * lacks write permissions for, or (c) are symbolic links.
 */
function filterInvalidPaths(paths: string[]): string[] {
  if (!isStringArray(paths)) {
    logger.error("Internal error: Paths list is not a string array.");
    exit(1);
  }

  return paths.filter((path) => {
    // (a) Path is visible?
    try {
      fs.accessSync(path, fs.constants.F_OK);
    } catch {
      return false;
    }

    // (b) Path is writable?
    try {
      fs.accessSync(path, fs.constants.F_OK | fs.constants.W_OK);
    } catch {
      logger.warning(
        `Don't have WRITE permission for path '${path}'. Skipping.`
      );
      return false;
    }

    // (c) Path is not a symbolic link?
    const stats = fs.lstatSync(path);

    if (stats.isSymbolicLink()) {
      logger.error(`Path '${path}' is a symbolic link! Skipping cautiously...`);
      return false;
    }

    return true;
  });
}

/**
 * Recursively deletes all paths in `paths`.
 */
function cleanPaths(paths: string[]) {
  for (const path of paths) {
    fs.rmSync(path, { recursive: true, force: true });
    logger.info(styleText("grey", `=> Deleted '${path}'.`));
  }
}
