import * as esbuild from "esbuild";

const k_scriptsDirPath = "scripts/project";

const k_entryPoints = [
  `${k_scriptsDirPath}/build.ts`,
  `${k_scriptsDirPath}/clean.ts`,
  `${k_scriptsDirPath}/dev_server.ts`,
  `${k_scriptsDirPath}/watch.ts`,
];

/**
 * Options for esbuild's build APIs like `build/1`, `context/1`, etc.
 *
 * @type {import("esbuild").BuildOptions}
 *
 * @see https://esbuild.github.io/api/#build
 */
const k_buildContextOptions = {
  tsconfig: "config/ts/targets/tsconfig.scripts.json",
  entryPoints: k_entryPoints,
  bundle: true,
  outdir: "build-dev/scripts/project",
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
