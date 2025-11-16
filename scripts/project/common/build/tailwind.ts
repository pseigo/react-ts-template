import * as FS from "node:fs";
import resolveTailwindConfig from "tailwindcss/resolveConfig";

import { findEnclosingPackageDir } from "@/scripts/common/packages";
import { k_paths } from "@/scripts/common/paths";

import type { BuildContext } from "./context";

/**
 * Creates a JSON reprenstation of a TailwindCSS configuration from the config
 * file referenced in the given `ctx.`
 *
 * @requires The process's working directory to be the package's root
 *  directory. Use `assertCwdIsPackageRootDir` from
 *  "@/scripts/common/packages" to assert this invariant before calling
 *  this function.
 *
 * @throws {Error} If `ctx.paths.artifactDir` is not provided.
 * @throws {Error} If `ctx.paths.artifactDir` does not exist and cannot be created.
 * @throws {Error} If `ctx.paths.sourceFile` cannot be read.
 * @throws {Error} If `ctx.paths.artifactFile` cannot be written to.
 * @throws {Error} If TailwindCSS config cannot be parsed.
 */
export async function buildTailwindConfig(ctx: BuildContext) {
  if (ctx.paths.artifactDir == null || ctx.paths.artifactDir === "") {
    throw new Error("missing required 'ctx.paths.artifactDir'");
  }

  const config = loadConfig(ctx);
  const theme = config["theme"];
  const rawThemeStr = JSON.stringify(theme);

  try {
    FS.mkdirSync(ctx.paths.artifactDir, { recursive: true });
  } catch (error: unknown) {
    const reason = error instanceof Error ? ` - ${error.message}` : "";
    const msg = `failed to create Tailwind gen dir${reason}`;
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
  const scriptDirPath = __dirname; // requires CJS; ESM uses `import.meta.url`
  const maybePackagePaths = findEnclosingPackageDir(scriptDirPath);
  if (maybePackagePaths == null) {
    throw new Error(
      "failed to find an enclosing Node package relative to this script"
    );
  }
  const { packageDirRelPath } = maybePackagePaths;

  const configFilePath = `${packageDirRelPath}/${ctx.paths.sourceFile}`;
  const unresolvedConfig = require(configFilePath);
  return resolveTailwindConfig(unresolvedConfig);
}
