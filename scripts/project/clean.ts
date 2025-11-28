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
  const pathsToDelete: string[] = filterInvalidPaths(["dist", "build-dev"]);
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
