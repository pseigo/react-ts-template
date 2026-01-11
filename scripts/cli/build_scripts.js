import * as esbuild from "esbuild";

const k_scriptsDirPath = "scripts/cli";

const k_entryPoints = [`${k_scriptsDirPath}/sandbox.ts`];

/**
 * Options for esbuild's build APIs like `build/1`, `context/1`, etc.
 *
 * @type {import("esbuild").BuildOptions}
 *
 * @see https://esbuild.github.io/api/#build
 */
const k_buildContextOptions = {
  tsconfig: "config/ts/targets/scripts/tsconfig.cli.json",
  entryPoints: k_entryPoints,
  bundle: true,
  outdir: "_build/dev/scripts/cli",
  format: "cjs",
  outExtension: { ".js": ".cjs" },
  sourcemap: true,
  target: "es2022",
  platform: "node",
  external: ["esbuild", "prettier"],
  legalComments: "eof",
};

async function buildScripts() {
  await esbuild.build(k_buildContextOptions);
}

(async () => {
  await buildScripts();
})();
