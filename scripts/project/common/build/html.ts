import * as FS from "node:fs";

import { k_paths } from "@/scripts/common/paths";

import type { BuildContext } from "./context";

/**
 * Deploys an HTML source file referenced in the given `ctx`.
 *
 * @requires The process's working directory to be the package's root
 *  directory. Use `assertCwdIsPackageRootDir` from
 *  "@/scripts/common/packages" to assert this invariant before calling
 *  this function.
 *
 * @throws {Error} If `ctx.paths.sourceFile` cannot be read.
 * @throws {Error} If `ctx.paths.artifactFile` cannot be written to.
 */
export async function buildHtml(ctx: BuildContext) {
  FS.copyFileSync(ctx.paths.sourceFile, ctx.paths.artifactFile);
}
