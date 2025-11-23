import FS from "node:fs";
import Path from "node:path";

import { k_configSchemasDirName, k_paths } from "@/scripts/common/paths";

const k_newDirMode = 0o755; // rwxr-xr-x

/**
 * Creates output directories required for builds if they do not already exist.
 *
 * @requires The process's working directory to be the package's root
 *  directory. Use `assertCwdIsPackageRootDir` from
 *  "@/scripts/common/packages" to assert this invariant before calling
 *  this function.
 */
export async function initOutputDirs() {
  await initDistDir();
  await initProjectConfigSchemasDir();
}

async function initDistDir() {
  FS.mkdirSync(k_paths.distDir, { recursive: true, mode: k_newDirMode });
}

async function initProjectConfigSchemasDir() {
  const schemasDirPath = Path.join(
    k_paths.configDirs.project,
    k_configSchemasDirName
  );
  FS.mkdirSync(schemasDirPath, { recursive: true, mode: k_newDirMode });
}
