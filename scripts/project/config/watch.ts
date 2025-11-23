import type { DefinedError as AjvDefinedError } from "ajv";
import { Type } from "typebox";
import { basename } from "node:path";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import { ajv, ajvErrorToMessage } from "@/scripts/common/json_schemas";
import { Logger } from "@/scripts/common/logging";
import { findEnclosingPackageDirRelToScriptLocation } from "@/scripts/common/packages";
import { k_paths } from "@/scripts/common/paths";

const logger = new Logger({
  app: k_appName,
  file: basename(__filename, k_scriptExtension),
});

export const k_watchConfigSchema = Type.Object(
  {
    $schema: Type.Optional(Type.String()),

    ctagsSubProcessTimeoutMs: Type.Integer({
      minimum: 0,
      default: 10000,
      title: "Ctags sub-process timeout (in milliseconds)",
      description:
        "Maximum time for ctags regeneration to complete before it is aborted. Consider increasing this value if ctags regeneration takes longer on your machine.",
    }),
  },
  { additionalProperties: false }
);

export type WatchConfig = Type.Static<typeof k_watchConfigSchema>;

/**
 * Loads the project's watch config file (referenced in
 * "@/scripts/common/paths") and returns it as a `WatchConfig` object.
 *
 * @throws {Error} If the config file cannot be read.
 * @throws {Error} If the config file's contents fail validation.
 *  Errors due to schema violations will be logged to stderr.
 */
export function loadWatchConfig(): WatchConfig {
  const packageDirRelPath = findEnclosingPackageDirRelToScriptLocation();
  const configFilePath = `${packageDirRelPath}/${k_paths.configFiles.project.watch}`;
  const config = require(configFilePath);
  const validate = ajv.compile(k_watchConfigSchema);

  if (!validate(config)) {
    const errors = validate.errors as AjvDefinedError[];
    for (const error of errors) {
      const errorMsg = ajvErrorToMessage(error);
      logger.error(`Watch config ${errorMsg}.`, error);
    }
    throw new Error(`Validation errors.`);
  }

  delete (config as WatchConfig).$schema;
  return config as WatchConfig;
}
