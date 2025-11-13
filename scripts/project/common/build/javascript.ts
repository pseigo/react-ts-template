import * as esbuild from "esbuild";

import { assertCwdIsPackageRootDir } from "@/scripts/common/packages";

import { k_buildContextOptions } from "../esbuild.js";

/**
 * Builds JavaScript entrypoints with ESBuild based on the `BuildOptions`
 * defined in "../esbuild.js".
 */
export async function buildJavaScript() {
  assertCwdIsPackageRootDir();

  await esbuild.build(k_buildContextOptions);
}
