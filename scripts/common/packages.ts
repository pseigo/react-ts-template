import FS from "node:fs";
import Path from "node:path";

import { intersperse } from "tanaris/arrays";
import { isString } from "tanaris/strings";
import { exclusiveRange } from "tanaris/ranges";

export interface EnclosingPackageDirPaths {
  packageDirPath: string;
  packageDirRelPath: string;
}

/**
 * Recursively searches **up** the filesystem from the current working
 * directory (`process.cwd()`) until a `package.json` file is found, then
 * returns the relative path to the directory containing that `package.json`.
 *
 * @throws {Error} If no `package.json` could be found relative to the current
 *  working directory.
 */
export function findEnclosingPackageDirRelToCwd(): string {
  const cwd = process.cwd();
  const maybePackagePaths = findEnclosingPackageDir(cwd);
  if (maybePackagePaths == null) {
    throw new Error(
      "Failed to find an enclosing Node package relative to the current working directory."
    );
  }
  return maybePackagePaths.packageDirRelPath;
}

/**
 * Recursively searches **up** the filesystem from the script's location
 * (`__dirname`) until a `package.json` file is found, then returns the
 * relative path to the directory containing that `package.json`.
 *
 * @throws {Error} If no `package.json` could be found relative to the script's
 *  location.
 */
export function findEnclosingPackageDirRelToScriptLocation(): string {
  const scriptDirPath = __dirname; // requires CJS; ESM uses `import.meta.url`
  const maybePackagePaths = findEnclosingPackageDir(scriptDirPath);
  if (maybePackagePaths == null) {
    throw new Error(
      "Failed to find an enclosing Node package relative to this script."
    );
  }
  return maybePackagePaths.packageDirRelPath;
}

/**
 * Recursively searches **up** the filesystem from the starting `dir` until a
 * `package.json` file is found, then returns the absolute and relative paths
 * to the directory containing that `package.json`.
 *
 * Returns `null` if no `package.json` could be found.
 */
export function findEnclosingPackageDir(
  dir: string
): EnclosingPackageDirPaths | null {
  return doFindEnclosingPackageDir(dir, 0);
}

function doFindEnclosingPackageDir(
  dir: string,
  distance: number
): EnclosingPackageDirPaths | null {
  try {
    const packageFilePath = Path.join(dir, "package.json");

    FS.accessSync(packageFilePath, FS.constants.F_OK | FS.constants.R_OK);
    const stats: FS.Stats = FS.statSync(packageFilePath, {
      throwIfNoEntry: true,
    });
    if (!stats.isFile()) {
      throw new Error();
    }
    // ok: a "package.json" file exists in `dir`

    const relPath = buildRelPath(distance);
    return { packageDirPath: dir, packageDirRelPath: relPath };
  } catch (error: unknown) {
    // no access; fallthrough
  }

  const { root } = Path.parse(dir);
  if (dir === root || distance > 99) {
    return null; // not found
  }

  return doFindEnclosingPackageDir(Path.join(dir, ".."), distance + 1);
}

/**
 * @requires `distance >= 0`
 */
function buildRelPath(distance: number): string {
  if (distance === 0) {
    return ".";
  }

  return intersperse(
    exclusiveRange(0, distance)
      .map((_) => "..")
      .toArray(),
    "/"
  ).reduce((acc, e) => acc + e);
}

/**
 * Asserts that this process's current working directory (cwd) is the package's
 * root directory, i.e., the cwd contains a "package.json" file.
 *
 * If the check fails, throws an error with a helpful message including hints
 * for the user. Otherwise, no-op.
 *
 * This function is intended to be used before logic in any project script that
 * acts on the filesystem using paths relative to the package's root directory.
 * Establishing this invariant simplifies constructing paths without
 * sacrificing correctness.
 *
 * That said, it should be noted that the "package.json" file's contents are
 * NOT inspected.
 *
 * @throws {Error} If the process's cwd does not contain a "package.json" file.
 */
export function assertCwdIsPackageRootDir(): void {
  try {
    const packageFilePath = Path.join(process.cwd(), "package.json");
    FS.accessSync(packageFilePath, FS.constants.F_OK);
    const stats: FS.Stats = FS.statSync(packageFilePath, {
      throwIfNoEntry: true,
    });
    if (!stats.isFile()) {
      throw new Error();
    }
  } catch (error: unknown) {
    throw new Error(
      "Expected this process's current working directory to be the package root directory (no \"package.json\" file was found here). Please run this script through the appropriate 'npm run ...' command, or try again after changing to the package's root directory."
    );
  }
}
