import type { Express } from "express";
import express from "express";

import { k_paths } from "@/scripts/common/paths";

import * as Telemetry from "../telemetry";

const k_staticPaths = [
  // TODO: move to `_dist/assets`?
  "app.js",
  "global.css",

  "fonts",
  "images",
  "public",
];

export function useStatic(app: Express) {
  app.use((req, res, next) => {
    if (k_staticPaths.some((p) => req.url.startsWith(`/${p}`))) {
      Telemetry.staticDispatch(req);
      return express.static(k_paths.distDir)(req, res, next);
    }
    next();
  });
}
