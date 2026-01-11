import * as React from "react";
import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Switch } from "wouter";

import { Route } from "@/unnamed_project_web/common/router/route";

import { NotFoundErrorPage } from "@/unnamed_project_web/pages/errors/not_found";
import { LandingPage } from "@/unnamed_project_web/pages/landing";

function App() {
  return (
    // prettier-ignore
    <Switch>
      <Route path="/"><LandingPage /></Route>
      <Route><NotFoundErrorPage /></Route>
    </Switch>
  );
}

/**
 * @requires An element with `id="app"` to exist in the global `document`.
 * @throws {Error} if no element with `id="app"` exists in the global `document`.
 */
function init() {
  const rootElement = document.getElementById("app");
  if (rootElement == null) {
    throw new Error("failed to initialize app: root element not found in document");
  }
  const root: Root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

init();
