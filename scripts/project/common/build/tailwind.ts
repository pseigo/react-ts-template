import * as FS from "node:fs";
import resolveTailwindConfig from "tailwindcss/resolveConfig";

import { findEnclosingPackageDirRelToScriptLocation } from "@/scripts/common/packages";
import { k_paths } from "@/scripts/common/paths";
import { isNonEmptyString } from "@/scripts/common/strings";

import { type BuildContext, missingPropertyErrorMessage } from "./context";

/**
 * Creates a JSON reprenstation of a TailwindCSS configuration from the config
 * file referenced in the given `ctx.`
 *
 * @requires `ctx.paths.sourceFile`
 * @throws {Error} If `ctx.paths.sourceFile` is not provided.
 * @throws {Error} If `ctx.paths.sourceFile` cannot be read.

 * @requires `ctx.paths.artifactDir`
 * @throws {Error} If `ctx.paths.artifactDir` is not provided.
 * @throws {Error} If `ctx.paths.artifactDir` does not exist and cannot be created.
 *
 * @requires `ctx.paths.artifactFile`
 * @throws {Error} If `ctx.paths.artifactFile` is not provided.
 * @throws {Error} If `ctx.paths.artifactFile` cannot be written to.
 *
 * @throws {Error} If TailwindCSS config cannot be parsed.
 *
 * @requires The process's working directory to be the package's root
 *  directory. Use `assertCwdIsPackageRootDir` from
 *  "@/scripts/common/packages" to assert this invariant before calling
 *  this function.
 */
export async function buildTailwindConfig(ctx: BuildContext) {
  if (!isNonEmptyString(ctx.paths.sourceFile)) {
    throw new Error(missingPropertyErrorMessage("ctx.paths.sourceFile"));
  }
  if (!isNonEmptyString(ctx.paths.artifactDir)) {
    throw new Error(missingPropertyErrorMessage("ctx.paths.artifactDir"));
  }
  if (!isNonEmptyString(ctx.paths.artifactFile)) {
    throw new Error(missingPropertyErrorMessage("ctx.paths.artifactFile"));
  }

  const config = loadConfig(ctx);
  const theme = config["theme"];
  const rawThemeStr = JSON.stringify(theme);

  try {
    FS.mkdirSync(ctx.paths.artifactDir, { recursive: true });
  } catch (error: unknown) {
    const reason =
      error instanceof Error && error.message !== ""
        ? `. Reason: ${error.message}`
        : ".";
    const msg = `Failed to create Tailwind gen dir${reason}`;
    throw new Error(msg, { cause: error });
  }

  FS.writeFileSync(ctx.paths.artifactFile, rawThemeStr, {
    encoding: "utf8",
    mode: 0o644, // rw-r--r--
    flag: "w",
  });
}

function loadConfig(
  ctx: BuildContext
): ReturnType<typeof resolveTailwindConfig> {
  const packageDirRelPath = findEnclosingPackageDirRelToScriptLocation();
  const configFilePath = `${packageDirRelPath}/${ctx.paths.sourceFile}`;
  const unresolvedConfig = require(configFilePath);
  return resolveTailwindConfig(unresolvedConfig);
}
