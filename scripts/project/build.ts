import * as esbuild from "esbuild";
import FS from "node:fs";
import { basename } from "node:path";

import { Logger } from "@/scripts/common/logging";
import { k_paths } from "@/scripts/common/paths";

import { k_commonBuildTargetContexts } from "./common/build";
import { buildHtml } from "./common/build/html";
import { buildCss } from "./common/build/css";
import { buildTailwindConfig } from "./common/build/tailwind";
import { buildJavaScript } from "./common/build/javascript";

const k_globalCssSourceFilePath = `${k_paths.rootLayoutDir}/global.css`;
const k_globalCssArtifactFilePath = `${k_paths.distDir}/global.css`;

const k_appName = "unnamed_project";
const logger = new Logger({
  app: k_appName,
  file: basename(__filename, ".cjs"),
});

async function initDistDir() {
  FS.mkdirSync(k_paths.distDir, { recursive: true, mode: 0o755 });
}

async function deployStaticAssets() {
  FS.cpSync(k_paths.assetsDir, `${k_paths.distDir}/assets/`, {
    recursive: true,
  });
}

async function build() {
  //console.log("args:");
  //console.log(process.argv);

  logger.info("Initializing 'dist' directory...");
  await initDistDir();

  logger.info("Building TailwindCSS config for JS...");
  await buildTailwindConfig(k_commonBuildTargetContexts.tailwindConfig); // must run before JS step

  logger.info("Building JavaScript...");
  await buildJavaScript();

  logger.info("Building CSS...");
  await buildCss(k_commonBuildTargetContexts.globalCss);

  logger.info("Deploying HTML pages...");
  await buildHtml(k_commonBuildTargetContexts.rootLayoutHtml);

  logger.info("Deploying static assets...");
  await deployStaticAssets();

  //logger.info("Building ctags...");
  //await rebuildCtags(ctx);

  logger.info("Done.");
}

(async () => {
  await build();
})();
