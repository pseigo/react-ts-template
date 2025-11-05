import * as esbuild from "esbuild";
import fs from "node:fs";
import postcss, {
  type Processor as PostCssProcessor,
  type Result as PostCssResult,
}  from "postcss";
//import postcssLoadConfig, from "postcss-load-config";
import postcssLoadConfig, { type ConfigContext as PostCssLoadConfigContext } from "postcss-load-config";

import { k_buildContextOptions } from "./common/esbuild.js";
import { k_paths } from "./common/paths.js";

// TODO: consolidate common logic in `build` and `watch` scripts.

type Foo = PostCssLoadConfigContext;
async function initDistDir() {
  fs.mkdirSync(k_paths.distDir, { recursive: true, mode: 0o755 });
}

async function buildTailwind() {
  // TODO: stub
}

async function buildJavaScript() {
  await esbuild.build(k_buildContextOptions);
}

const globalCssSourceFilePath = `${k_paths.rootLayoutDir}/global.css`;
const globalCssArtifactFilePath = `${k_paths.distDir}/global.css`;

async function buildCss() {
  const globalCssSource = fs.readFileSync(globalCssSourceFilePath, {
    encoding: "utf8",
    flag: "r",
  });

  //const postcssLoadConfigContext: PostCssLoadConfigContext = { map: "inline" };
  const postcssLoadConfigContext: PostCssLoadConfigContext = {};
  const postcssConfig = await postcssLoadConfig(postcssLoadConfigContext, "./config");

  const postcssPlugins = postcssConfig.plugins;
  const postcssProcessOptions = {
    ...postcssConfig.options,
    from: globalCssSourceFilePath,
    to: globalCssArtifactFilePath,
  };

  /** @type {import("postcss").Processor} */
  const postcssProcessor: PostCssProcessor = await postcss(postcssPlugins);

  /** @type {import("postcss").Result} */
  const globalCssArtifact: PostCssResult = await postcssProcessor.process(
    globalCssSource,
    postcssProcessOptions
  );

  fs.writeFileSync(globalCssArtifactFilePath, globalCssArtifact.css, {
    encoding: "utf8",
    flag: "w",
    mode: 0o644,
  });
}

async function buildHtml() {
  fs.cpSync(`${k_paths.rootLayoutDir}/index.html`, `${k_paths.distDir}/index.html`);
}

async function deployStaticAssets() {
  fs.cpSync(k_paths.assetsDir, `${k_paths.distDir}/assets/`, {
    recursive: true,
  });
}

async function build() {
  console.log("args:");
  console.log(process.argv);
  await initDistDir();
  await buildTailwind();
  // TODO: add build ctags
  await buildJavaScript();
  await buildCss();
  await buildHtml();
  await deployStaticAssets();
}

await build();
