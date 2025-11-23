import { build, type BuildOptions } from "esbuild";

import { k_paths } from "@/scripts/common/paths";

const k_entryPoints: string[] = [
  `${k_paths.srcDir}/app.tsx`,
  `${k_paths.srcDir}/workers/tasks/worker.ts`,
];

/**
 * Options for esbuild's build APIs like `build/1`, `context/1`, etc.
 *
 * @see https://esbuild.github.io/api/#build
 */
export const k_buildContextOptions: BuildOptions = {
  tsconfig: "config/ts/targets/tsconfig.app.json",
  entryPoints: k_entryPoints,
  bundle: true,
  outdir: "dist",
  format: "esm",
  target: "es2020",
  platform: "browser",
  jsx: "automatic",
  legalComments: "eof",
};

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
  await build(k_buildContextOptions);
}
