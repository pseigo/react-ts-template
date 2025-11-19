import FS from "node:fs";
import Tsj from "ts-json-schema-generator";

import { findEnclosingPackageDir } from "@/scripts/common/packages";
import { k_paths } from "@/scripts/common/paths";

import type { BuildContext } from "./context";

const k_tsconfigFilePath = `${k_paths.configDir}/ts/targets/tsconfig.scripts_config_schemas.json`;

export async function generateConfigSchema(ctx: BuildContext) {
  const packageDirRelPathFromCwd = getPackageDirRelPathFromCwd();
  const packageDirRelPathFromScriptLocation = getPackageDirRelPathFromScriptLocation();

  const tsjConfig: Tsj.Config = {
    path: `${packageDirRelPathFromCwd}/${ctx.paths.sourceFile}`,
    tsconfig: `${packageDirRelPathFromCwd}/${k_tsconfigFilePath}`,
    type: "*"
  };

  const schema = Tsj.createGenerator(tsjConfig);
  //const schema = Tsj.createGenerator(tsjConfig).createSchema(tsjConfig.type);
  //const schemaStr = JSON.stringify(schema, null, 2);
  console.info("here's the schema:");
  //console.info("here's the schema:", schemaStr);
}

function getPackageDirRelPathFromCwd(): string {
  const cwd = process.cwd();
  const maybePackagePaths = findEnclosingPackageDir(cwd);
  if (maybePackagePaths == null) {
    throw new Error(
      "failed to find an enclosing Node package relative to the current working directory"
    );
  }
  return maybePackagePaths.packageDirRelPath;
}

function getPackageDirRelPathFromScriptLocation(): string {
  const scriptDirPath = __dirname;
  const maybePackagePaths = findEnclosingPackageDir(scriptDirPath);
  if (maybePackagePaths == null) {
    throw new Error(
      "failed to find an enclosing Node package relative to this script"
    );
  }
  return maybePackagePaths.packageDirRelPath;
}
