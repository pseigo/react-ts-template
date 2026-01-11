import { basename } from "node:path";
import { type Request } from "express";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import { Logger, LogLevel } from "@/scripts/common/logging";

const logger = new Logger({
  app: k_appName,
  file: basename(__filename, k_scriptExtension),
  level: LogLevel.DEBUG,
});

export function staticDispatch(req: Request) {
  logger.info(`[${req.ip}] static: ${req.url}`);
}

export function routerDispatch(req: Request) {
  logger.info(`[${req.ip}] ${req.url}`);
}
