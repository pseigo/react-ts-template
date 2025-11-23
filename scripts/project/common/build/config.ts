import FS from "node:fs";
import Path from "node:path";
import { styleText } from "node:util";

import type { Logger } from "@/scripts/common/logging";
import { k_configDefaultsDirName } from "@/scripts/common/paths";
import { isNonEmptyString } from "@/scripts/common/strings";

import { type BuildContext, missingPropertyErrorMessage } from "./context";

/**
 * Ensures the local config file referenced in the given `ctx` exists.
 *
 * Otherwise, searches for a config file with the same name in the 'defaults'
 * dir (see "@/scripts/common/paths") within the desired local config file's
 * directory, and initializes the local config file by copying from the
 * defaults dir.
 *
 * @throws {Error} If a local config file does not exist and a default cannot
 *  be found.
 *
 * @requires `ctx.paths.sourceFile`
 * @throws {Error} If `ctx.paths.sourceFile` is not provided.
 * @throws {Error} If `ctx.paths.sourceFile` cannot be written to.
 *
 * @throws {Error} If `ctx.paths.sourceFile` does not exist and
 *  no default config could be found.
 *
 * @requires The process's working directory to be the package's root
 *  directory. Use `assertCwdIsPackageRootDir` from
 *  "@/scripts/common/packages" to assert this invariant before calling
 *  this function.
 */
export async function ensureLocalConfigExists(
  ctx: BuildContext,
  opts: { logger: Logger }
) {
  if (!isNonEmptyString(ctx.paths.sourceFile)) {
    throw new Error(missingPropertyErrorMessage("ctx.paths.sourceFile"));
  }

  // Return if local config already exists.
  if (fileExists(ctx.paths.sourceFile)) {
    return;
  }

  // Find default config.
  const projectConfigDirPath = Path.dirname(ctx.paths.sourceFile);
  const defaultsDirPath = Path.join(
    projectConfigDirPath,
    k_configDefaultsDirName
  );

  if (!dirExists(defaultsDirPath)) {
    throw new Error(
      `Cannot create local config because failed to find '${k_configDefaultsDirName}' directory '${projectConfigDirPath}'.`
    );
  }

  const configFileName = Path.basename(ctx.paths.sourceFile);
  const defaultConfigFilePath = Path.join(defaultsDirPath, configFileName);

  if (!fileExists(defaultConfigFilePath)) {
    throw new Error(
      `Cannot create local config because failed to find default config for '${configFileName}' in '${defaultsDirPath}'.`
    );
  }

  // Create new local config from defaults.
  FS.copyFileSync(
    defaultConfigFilePath,
    ctx.paths.sourceFile,
    FS.constants.COPYFILE_EXCL
  );

  // Fix schema path.
  const originalConfig = FS.readFileSync(ctx.paths.sourceFile, {
    encoding: "utf8",
  });
  const config = originalConfig.replace(`"$schema": "../`, `"$schema": "./`);

  FS.writeFileSync(ctx.paths.sourceFile, config, {
    mode: 0o644, // rw-r--r--
  });

  opts.logger.info(
    styleText("grey", `=> Created '${ctx.paths.sourceFile}' from defaults.`)
  );
}

function fileExists(filePath: string): boolean {
  try {
    FS.accessSync(filePath, FS.constants.F_OK | FS.constants.R_OK);

    const stats: FS.Stats = FS.statSync(filePath, {
      throwIfNoEntry: true,
    });

    if (!stats.isFile()) {
      throw new Error();
    }

    return true;
  } catch (error: unknown) {
    return false;
  }
}

function dirExists(filePath: string): boolean {
  try {
    FS.accessSync(filePath, FS.constants.F_OK | FS.constants.R_OK);

    const stats: FS.Stats = FS.statSync(filePath, {
      throwIfNoEntry: true,
    });

    if (!stats.isDirectory()) {
      throw new Error();
    }

    return true;
  } catch (error: unknown) {
    return false;
  }
}
