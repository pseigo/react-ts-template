import type { BuildOptions } from "esbuild";

import { k_paths } from "./paths.js";

const entryPoints = [
  `${k_paths.srcDir}/app.tsx`,
  `${k_paths.srcDir}/workers/tasks/worker.ts`
];

/**
 * Options for esbuild's build APIs like `build/1`, `context/1`, etc.
 *
 * @see https://esbuild.github.io/api/#build
 */
export const k_buildContextOptions: BuildOptions = {
  tsconfig: "config/ts/targets/tsconfig.app.json",
  entryPoints: entryPoints,
  bundle: true,
  outdir: "dist",
  format: "esm",
  target: "es2020",
  platform: "browser",
  jsx: "automatic",
  legalComments: "eof",
};
