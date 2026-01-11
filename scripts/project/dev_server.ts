import express from "express";
import http from "node:http";
import { basename } from "node:path";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import { Logger, LogLevel } from "@/scripts/common/logging";

import { useStatic } from "./dev_server/middleware/static";
import { useRouter } from "./dev_server/middleware/router";

const logger = new Logger({
  app: k_appName,
  file: basename(__filename, k_scriptExtension),
  //level: LogLevel.DEBUG,
});

const k_host = "127.0.0.1"; // private to this machine
//const k_host = "0.0.0.0"; // open to local network
const k_port = 7878;

const app = express();
const server = http.createServer(app);

useStatic(app);
useRouter(server, app);

server.listen(k_port, k_host, () => {
  logger.info(`Serving HTTP at http://${k_host}:${k_port}`);
});
