import type { Express } from "express";
import express from "express";
import fs from "node:fs";
import type { Server } from "node:http";
import path, { basename } from "node:path";
import WebSocket, { WebSocketServer } from "ws";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import { Logger, LogLevel } from "@/scripts/common/logging";
import { k_paths } from "@/scripts/common/paths";

import * as Telemetry from "../telemetry";

const logger = new Logger({
  app: k_appName,
  file: basename(__filename, k_scriptExtension),
  //level: LogLevel.DEBUG,
});

const liveReloadScript = `
<script>
  const ws = new WebSocket("ws://" + location.host);
  ws.onmessage = () => location.reload();
</script>
`;

// Hardcoded option.
const useLiveReload: boolean = false;

export function useRouter(server: Server, app: Express) {
  const wss = new WebSocketServer({ server });

  app.use((req, res, next) => {
    const requestedResource = "/index.html"; // client-side routing

    const filePath = path.join(k_paths.distDir, requestedResource);

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return next();
      }

      const injectedResponse = data.replace(
        /<\/body>/,
        `${liveReloadScript}</body>`
      );

      res.setHeader("Content-Type", "text/html");

      Telemetry.routerDispatch(req);
      res.send(injectedResponse);
    });
  });

  if (useLiveReload) {
    // TODO: Only watch relevant files. Something's triggering this with vscode open...

    // Watch for artifact file changes.
    fs.watch(k_paths.distDir, { recursive: true }, (eventType, filename) => {
      if (filename) {
        if (
          ![".ts", ".js", ".tsx", ".jsx", ".html", ".css"].some((ext) =>
            filename.endsWith(ext)
          )
        ) {
          return;
        }

        logger.info(`File changed: '${filename}' ('${eventType}')`);

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send("reload");
          }
        });
      }
    });
  }
}
