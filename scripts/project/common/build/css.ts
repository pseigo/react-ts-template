import * as FS from "node:fs";
import postcss, {
  type Processor as PostCssProcessor,
  type Result as PostCssResult,
} from "postcss";
import postcssLoadConfig, {
  type ConfigContext as PostCssLoadConfigContext,
} from "postcss-load-config";

import { k_paths } from "@/scripts/common/paths";
import { isNonEmptyString } from "@/scripts/common/strings";

import { type BuildContext, missingPropertyErrorMessage } from "./context";

/**
 * Builds a CSS source file referenced in the given `ctx`.
 *
 * @requires `ctx.paths.sourceFile`
 * @throws {Error} If `ctx.paths.sourceFile` is not provided.
 * @throws {Error} If `ctx.paths.sourceFile` cannot be read.
 * @throws {Error} If PostCSS cannot process `ctx.paths.sourceFile`'s contents.
 *
 * @requires `ctx.paths.artifactFile`
 * @throws {Error} If `ctx.paths.artifactFile` is not provided.
 * @throws {Error} If `ctx.paths.artifactFile` cannot be written to.
 *
 * @throws {Error} If PostCSS config cannot be found or parsed.
 *
 * @requires The process's working directory to be the package's root
 *  directory. Use `assertCwdIsPackageRootDir` from
 *  "@/scripts/common/packages" to assert this invariant before calling
 *  this function.
 */
export async function buildCss(ctx: BuildContext) {
  if (!isNonEmptyString(ctx.paths.artifactFile)) {
    throw new Error(missingPropertyErrorMessage("ctx.paths.artifactFile"));
  }

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
  if (!isNonEmptyString(ctx.paths.sourceFile)) {
    throw new Error(missingPropertyErrorMessage("ctx.paths.sourceFile"));
  }
  if (!isNonEmptyString(ctx.paths.artifactFile)) {
    throw new Error(missingPropertyErrorMessage("ctx.paths.artifactFile"));
  }

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
