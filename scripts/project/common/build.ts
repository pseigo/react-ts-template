import { k_paths } from "@/scripts/common/paths";

import { BuildContext } from "./build/context";
import { buildCss } from "./build/css";

const k_logPrefix = "[unnamed_project][scripts/watch_build_html.js]";

const k_indexHtmlSourceFilePath = `${k_paths.rootLayoutDir}/index.html`;
const k_indexHtmlArtifactFilePath = `${k_paths.distDir}/index.html`;

const k_globalCssSourceFilePath = `${k_paths.rootLayoutDir}/global.css`;
const k_globalCssArtifactFilePath = `${k_paths.distDir}/global.css`;

const k_tailwindConfigFilePath = `${k_paths.configDir}/tailwind.config.cjs`;
const k_tailwindArtifactDirPath = `${k_paths.srcGenDir}/tailwind`;
const k_tailwindArtifactFilePath = `${k_tailwindArtifactDirPath}/compiled_theme.json`;

const k_ctagsGenScriptPath = "scripts/project/ctags/gen.sh";

export type CommonBuildTarget =
  | "rootLayoutHtml"
  | "globalCss"
  | "tailwindConfig"
  | "ctags";

export const k_commonBuildTargetContexts: Record<
  CommonBuildTarget,
  BuildContext
> = {
  rootLayoutHtml: {
    paths: {
      sourceFile: k_indexHtmlSourceFilePath,
      artifactFile: k_indexHtmlArtifactFilePath,
    },
  },
  globalCss: {
    paths: {
      sourceFile: k_globalCssSourceFilePath,
      artifactFile: k_globalCssArtifactFilePath,
    },
  },
  tailwindConfig: {
    paths: {
      sourceFile: k_tailwindConfigFilePath,
      artifactFile: k_tailwindArtifactFilePath,
      artifactDir: k_tailwindArtifactDirPath,
    },
  },
  ctags: {
    paths: {
      sourceFile: "", // TODO: make this optional for all?
      sourceDir: k_paths.srcDir,
      artifactFile: "tags",
    },
  },
};
