import * as FS from "node:fs";
import postcss, {
  type Processor as PostCssProcessor,
  type Result as PostCssResult,
} from "postcss";
import postcssLoadConfig, {
  type ConfigContext as PostCssLoadConfigContext,
} from "postcss-load-config";

import { assertCwdIsPackageRootDir } from "../packages";
import { k_paths } from "../paths";

import type { BuildContext } from "./context";

/**
 * Builds a CSS source file referenced in the given `ctx`.
 *
 * @throws {Error} If `ctx.paths.sourceFile` cannot be read.
 * @throws {Error} If `ctx.paths.artifactFile` cannot be written to.
 * @throws {Error} If PostCSS config cannot be found or parsed.
 * @throws {Error} If PostCSS cannot process the CSS source file's contents.
 */
export async function buildCss(ctx: BuildContext) {
  assertCwdIsPackageRootDir();

  const processedCss = await processCss(ctx);

  // @throws {Error} If `ctx.paths.artifactFile` cannot be written to.
  FS.writeFileSync(ctx.paths.artifactFile, processedCss, {
    encoding: "utf8",
    flag: "w",
    mode: 0o644,
  });
}

/**
 * Processes a CSS source file referenced in the given `ctx` and
 * returns the result.
 */
async function processCss(ctx: BuildContext): Promise<string> {
  // @throws {Error} If `ctx.paths.sourceFile` cannot be read.
  const cssSource = FS.readFileSync(ctx.paths.sourceFile, {
    encoding: "utf8",
    flag: "r",
  });

  const postcssLoadConfigContext: PostCssLoadConfigContext = {};
  //const postcssLoadConfigContext: PostCssLoadConfigContext = { map: "inline" };

  // @throws {Error} If PostCSS config cannot be found or parsed.
  const postcssConfig = await postcssLoadConfig(
    postcssLoadConfigContext,
    k_paths.configDir
  );

  const postcssProcessOptions = {
    ...postcssConfig.options,
    from: ctx.paths.sourceFile,
    to: ctx.paths.artifactFile,
  };
  const postcssProcessor: PostCssProcessor = await postcss(
    postcssConfig.plugins
  );

  // @throws {Error} If PostCSS cannot process the CSS source file's contents.
  const processed: PostCssResult = await postcssProcessor.process(
    cssSource,
    postcssProcessOptions
  );

  return processed.css;
}
