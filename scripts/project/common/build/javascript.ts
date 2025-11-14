import * as esbuild from "esbuild";

import { k_buildContextOptions } from "../esbuild.js";

/**
 * Builds JavaScript entrypoints with ESBuild based on the `BuildOptions`
 * defined in "../esbuild.js".
 *
 * @requires The process's working directory to be the package's root
 *  directory. Use `assertCwdIsPackageRootDir` from
 *  "@/scripts/common/packages" to assert this invariant before calling
 *  this function.
 */
export async function buildJavaScript() {
  await esbuild.build(k_buildContextOptions);
}
