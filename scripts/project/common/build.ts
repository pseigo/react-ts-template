import { k_paths } from "@/scripts/common/paths";

import type { BuildContext } from "./build/context";

export type CommonBuildTarget =
  | "rootLayoutHtml"
  | "globalCss"
  | "tailwindConfig"
  | "ctags"
  | "projectWatchConfig";

export const k_commonBuildTargetContexts: Record<
  CommonBuildTarget,
  BuildContext
> = {
  rootLayoutHtml: {
    paths: {
      sourceFile: `${k_paths.rootLayoutDir}/index.html`,
      artifactFile: `${k_paths.distDir}/index.html`,
    },
  },
  globalCss: {
    paths: {
      sourceFile: `${k_paths.rootLayoutDir}/global.css`,
      artifactFile: `${k_paths.distDir}/global.css`,
    },
  },
  tailwindConfig: {
    paths: {
      sourceFile: `${k_paths.configDir}/tailwind.config.cjs`,
      artifactDir: `${k_paths.srcGenDir}/tailwind`,
      artifactFile: `${k_paths.srcGenDir}/tailwind/compiled_theme.json`,
    },
  },
  ctags: {
    paths: {
      sourceDir: k_paths.srcDir,
      artifactFile: "tags",
    },
  },
  projectWatchConfig: {
    paths: {
      sourceFile: `${k_paths.configDir}/project/watch.config.json`,
      artifactFile: `${k_paths.configDir}/project/_schemas/watch.config.schema.json`,
    },
  },
};
