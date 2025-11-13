import * as FS from "node:fs";

import { assertCwdIsPackageRootDir } from "@/scripts/common/packages";
import { k_paths } from "@/scripts/common/paths";

import type { BuildContext } from "./context";

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
