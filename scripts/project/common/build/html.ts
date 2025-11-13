import * as FS from "node:fs";
import { k_paths } from "../paths";

import type { BuildContext } from "./context";
import { assertCwdIsPackageRootDir } from "../packages";

/**
 * Deploys an HTML source file referenced in the given `ctx`.
 *
 * @throws {Error} If `ctx.paths.sourceFile` cannot be read.
 * @throws {Error} If `ctx.paths.artifactFile` cannot be written to.
 */
export async function buildHtml(ctx: BuildContext) {
  assertCwdIsPackageRootDir();

  FS.copyFileSync(ctx.paths.sourceFile, ctx.paths.artifactFile);
}
