import * as esbuild from "esbuild";

import { k_buildContextOptions } from "../esbuild.js";
import { assertCwdIsPackageRootDir } from "../packages";

/**
 * Builds JavaScript entrypoints with ESBuild based on the `BuildOptions`
 * defined in "../esbuild.js".
 */
export async function buildJavaScript() {
  assertCwdIsPackageRootDir();

  await esbuild.build(k_buildContextOptions);
}
