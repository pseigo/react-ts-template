import fs from "node:fs";
import { exit } from "node:process";

import { isStringArray } from "tanaris/arrays";
import { isString } from "tanaris/strings";

const k_logPrefix = "[unnamed-project][scripts/project/clean]";

clean();

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
    console.error(
      `${k_logPrefix} Internal error: Paths list is not a string array.`
    );
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
      console.warn(
        `${k_logPrefix} Don't have WRITE permission for path '${path}'. Skipping.`
      );
      return false;
    }

    // (c) Path is not a symbolic link?
    const stats = fs.lstatSync(path);

    if (stats.isSymbolicLink()) {
      console.error(
        `${k_logPrefix} Path '${path}' is a symbolic link! Skipping in case deletion causes unintentional damage...`
      );
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
    console.log(`${k_logPrefix} Deleted '${path}'.`);
  }
}
