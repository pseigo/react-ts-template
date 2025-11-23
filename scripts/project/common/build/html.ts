import * as FS from "node:fs";

import { k_paths } from "@/scripts/common/paths";
import { isNonEmptyString } from "@/scripts/common/strings";

import { type BuildContext, missingPropertyErrorMessage } from "./context";

/**
 * Deploys an HTML source file referenced in the given `ctx`.
 *
 * @requires `ctx.paths.sourceFile`
 * @throws {Error} If `ctx.paths.sourceFile` is not provided.
 * @throws {Error} If `ctx.paths.sourceFile` cannot be read.
 *
 * @requires `ctx.paths.artifactFile`
 * @throws {Error} If `ctx.paths.artifactFile` is not provided.
 * @throws {Error} If `ctx.paths.artifactFile` cannot be written to.
 *
 * @requires The process's working directory to be the package's root
 *  directory. Use `assertCwdIsPackageRootDir` from
 *  "@/scripts/common/packages" to assert this invariant before calling
 *  this function.
 */
export async function buildHtml(ctx: BuildContext) {
  if (!isNonEmptyString(ctx.paths.sourceFile)) {
    throw new Error(missingPropertyErrorMessage("ctx.paths.sourceFile"));
  }
  if (!isNonEmptyString(ctx.paths.artifactFile)) {
    throw new Error(missingPropertyErrorMessage("ctx.paths.artifactFile"));
  }

  FS.copyFileSync(ctx.paths.sourceFile, ctx.paths.artifactFile);
}
