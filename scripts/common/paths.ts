/**
 * Paths relative to the root project directory.
 */
export const k_paths = {
  srcDir: "src",
  appSrcDir: "src/unnamed_project",
  webSrcDir: "src/unnamed_project_web",

  assetsDir: "priv/assets",
  rootLayoutDir: "src/unnamed_project_web/layouts/root",

  buildDir: "_build",
  intermediateBuildDir: "_build/_intermediate",
  distDir: "_dist",
  appGenSrcDir: "src/unnamed_project/_gen",
  webGenSrcDir: "src/unnamed_project_web/gen",

  configDir: "config",
  configDirs: {
    project: "config/project",
  },
  configFiles: {
    project: {
      watch: "config/project/watch.config.json",
    },
  },
  configSchemaFiles: {
    project: {
      watch: "config/project/_schemas/watch.config.schema.json",
    },
  },
};

/**
 * Name of the directory containing default config files.
 */
export const k_configDefaultsDirName = "_defaults";

/**
 * Name of the directory containing schemas for config files.
 */
export const k_configSchemasDirName = "_schemas";
