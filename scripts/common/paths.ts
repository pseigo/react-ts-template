/**
 * Paths relative to the root project directory.
 */
export const k_paths = {
  assetsDir: "assets",
  distDir: "dist",
  rootLayoutDir: "src/unnamed_project/layouts/root",
  srcDir: "src/unnamed_project",
  srcGenDir: "src/unnamed_project/gen",
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
