import * as esbuild from "esbuild";
import FS from "node:fs";
import { basename } from "node:path";

import { Logger } from "@/scripts/common/logging";
import { assertCwdIsPackageRootDir } from "@/scripts/common/packages";
import { k_paths } from "@/scripts/common/paths";

import { k_commonBuildTargetContexts } from "./common/build";
import { initOutputDirs } from "./common/build/init";
import { buildHtml } from "./common/build/html";
import { buildCss } from "./common/build/css";
import { buildTailwindConfig } from "./common/build/tailwind";
import { buildJavaScript } from "./common/build/javascript";
import { ensureLocalConfigExists } from "./common/build/config";
import { buildJsonSchema } from "./common/build/json_schema";
import { k_watchConfigSchema } from "./config/watch";

const k_appName = "unnamed_project";
const logger = new Logger({
  app: k_appName,
  file: basename(__filename, ".cjs"),
});

async function deployStaticAssets() {
  FS.cpSync(k_paths.assetsDir, `${k_paths.distDir}/assets/`, {
    recursive: true,
  });
}

/**
 * @requires The process's working directory to be the package's root
 *  directory.
 * @throws {Error} If the process's working directory is not the package's root
 *  directory.
 */
async function build() {
  assertCwdIsPackageRootDir(); // invariant required by all helpers

  logger.info("Initializing output directories...");
  await initOutputDirs();

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

  // TODO: either call ctags/gen.sh from this script so that we can conditionally _not_ do that in case of Windows hosts (for now), or... we just include the `ctags:regen-project` package script with the `build` package script.
  //logger.info("Building ctags...");
  //await rebuildCtags(ctx);

  logger.info("Generating JSON config schemas for IDEs...");
  await ensureLocalConfigExists(
    k_commonBuildTargetContexts.projectWatchConfig,
    { logger: logger }
  );
  await buildJsonSchema(
    k_watchConfigSchema,
    k_commonBuildTargetContexts.projectWatchConfig
  );

  logger.info("Done.");
}

(async () => {
  await build();
})();
