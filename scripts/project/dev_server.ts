import express from "express";
import fs from "node:fs";
import http from "node:http";
import path, { basename } from "node:path";
import WebSocket, { WebSocketServer } from "ws";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import { Logger, LogLevel } from "@/scripts/common/logging";
import { k_paths } from "@/scripts/common/paths";

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
const wss = new WebSocketServer({ server });

const liveReloadScript = `
<script>
  const ws = new WebSocket("ws://" + location.host);
  ws.onmessage = () => location.reload();
</script>
`;

app.use((req, res, next) => {
  const requestedResource = req.url === "/" ? "/index.html" : req.url;

  if (!requestedResource.endsWith(".html")) {
    return express.static(k_paths.distDir)(req, res, next);
  }

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
    res.send(injectedResponse);
  });
});

// Watch for artifact file changes.
fs.watch(k_paths.distDir, { recursive: true }, (eventType, filename) => {
  if (filename) {
    logger.info(`File changed: '${filename}' ('${eventType}')`);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("reload");
      }
    });
  }
});

server.listen(k_port, k_host, () => {
  logger.info(`Serving HTTP at http://${k_host}:${k_port}`);
});
