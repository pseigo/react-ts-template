import * as esbuild from "esbuild";
import FS from "node:fs";
import { basename } from "node:path";
import * as ChildProcess from "node:child_process";
import { type FSWatcher } from "node:fs";

import { Logger } from "@/scripts/common/logging";
import { k_paths } from "@/scripts/common/paths";

import { k_commonBuildTargetContexts } from "./common/build";
import { buildHtml } from "./common/build/html";
import { buildCss } from "./common/build/css";
import { buildTailwindConfig } from "./common/build/tailwind";
import { k_buildContextOptions } from "./common/esbuild";

const k_ctagsGenScriptPath = "scripts/project/ctags/gen.sh";

const k_appName = "unnamed_project"; // TODO: move to `common.constants.ts` OR fetch from package.json's "name" property
const logger = new Logger({
  app: k_appName,
  file: basename(__filename, ".cjs"),
});

type WatchTarget = "html" | "css" | "tailwind" | "ctags";

interface WatchContext {
  target: WatchTarget;
  watcher: FSWatcher;
  paths: {
    /** Path to the original source code file. */
    sourceFile: string;

    /** Where to write the compiled artifact file. */
    artifactFile: string;
  };
}

const watchContexts: Record<WatchTarget, WatchContext | null> = {
  html: null,
  css: null,
  tailwind: null,
  ctags: null,
};

// ~~~ Entry point ~~~

watch();

async function watch() {
  await watchHtml();
  await watchCss();
  await watchTailwind();
  await watchJs();
  await watchCtags();
}

// ~~~ HTML ~~~

async function watchHtml() {
  if (watchContexts.html != null) {
    watchContexts.html.watcher.close();
  }

  const watcher = FS.watch(
    k_commonBuildTargetContexts.rootLayoutHtml.paths.sourceFile,
    { encoding: "utf8" },
    (...args) => listener("html", ...args)
  );
  watchContexts.html = {
    target: "html",
    paths: k_commonBuildTargetContexts.rootLayoutHtml.paths,
    watcher: watcher,
  };
  logger.info(
    `watching '${k_commonBuildTargetContexts.rootLayoutHtml.paths.sourceFile}'`
  );
}

// ~~~ CSS ~~~

async function watchCss() {
  if (watchContexts.css != null) {
    watchContexts.css.watcher.close();
  }

  const watcher = FS.watch(
    k_commonBuildTargetContexts.globalCss.paths.sourceFile,
    { encoding: "utf8" },
    (...args) => listener("css", ...args)
  );
  watchContexts.css = {
    target: "css",
    paths: k_commonBuildTargetContexts.globalCss.paths,
    watcher: watcher,
  };
  logger.info(
    `watching '${k_commonBuildTargetContexts.globalCss.paths.sourceFile}'`
  );
}

// ~~~ Tailwind ~~~

async function watchTailwind() {
  if (watchContexts.tailwind != null) {
    watchContexts.tailwind.watcher.close();
  }

  const watcher = FS.watch(
    k_commonBuildTargetContexts.tailwindConfig.paths.sourceFile,
    { encoding: "utf8" },
    (...args) => listener("tailwind", ...args)
  );
  watchContexts.tailwind = {
    target: "tailwind",
    paths: k_commonBuildTargetContexts.tailwindConfig.paths,
    watcher: watcher,
  };
  logger.info(
    `watching '${k_commonBuildTargetContexts.tailwindConfig.paths.sourceFile}'`
  );
}

// ~~~ JS ~~~

async function watchJs() {
  const context = await esbuild.context(k_buildContextOptions);
  await context.watch();
}

// ~~~ ctags ~~~

async function watchCtags(): Promise<void> {
  if (watchContexts.ctags != null) {
    watchContexts.ctags.watcher.close();
  }

  if (process.platform === "win32") {
    logger.info("ctags generation not yet supported on Windows.");
    return;
  }

  if (!FS.existsSync(k_ctagsGenScriptPath)) {
    logger.warning("failed to find ctags generation script.");
    return;
  }

  const watcher = FS.watch(
    k_paths.srcDir,
    {
      encoding: "utf8",
      recursive: true,
    },
    (...args) => listener("ctags", ...args)
  );
  watchContexts.ctags = {
    target: "ctags",
    paths: k_commonBuildTargetContexts.ctags.paths,
    watcher: watcher,
  };
  logger.info(
    `watching '${k_commonBuildTargetContexts.ctags.paths.sourceDir}' for rebuilding ctags`
  );
}

const k_ctagsBuildCooloffMs = 1_000;

class CtagsState {
  readonly #subProcessCommand = `"${k_ctagsGenScriptPath}" --project`;
  readonly #subProcessTimeoutMs = 2_000;

  #process: ChildProcess.ChildProcess | null = null;
  #isRebuildQueued: boolean = false;
  #earliestNextRebuildTimeMs: number = 0;

  isBuilding(): boolean {
    return this.#process != null;
  }
  isRebuildQueued(): boolean {
    return this.#isRebuildQueued;
  }

  /**
   * Stores and hooks into the given `process` through "exit" and "error" handlers.
   *
   * When the `process` terminates, starts a "tags" file rebuild iff a rebuild
   * was queued with {@link queueRebuild} _before_ the `process` terminated.
   */
  setProcess(process: ChildProcess.ChildProcess): void {
    if (this.#process != null) {
      // TODO: clean up if process exists
      this.#clearProcess();
      throw new Error(
        "cannot set process because a process reference still exists"
      );
    }
    this.#process = process;
    process
      .once("exit", (code: number | null, signal: NodeJS.Signals | null) => {
        logger.info("subprocess event: exit", code, signal);
        const hasError = code !== 0;
        if (hasError) {
          logger.error(
            `ctags generation exited with error code; code=${code}, signal=${signal}`
          );
        } else {
          logger.info("Rebuilt ctags 'tags' file.");
        }
        // TODO: any other process cleanup needed here?
        this.#process = null;
        if (this.#isRebuildQueued) {
          this.#startRebuild();
        }
      })
      .once("error", (error: Error) => {
        logger.error("ctags generation failed (got 'error' event)", error);
        // TODO: any other process cleanup needed here?
        this.#process = null;
        if (this.#isRebuildQueued) {
          this.#startRebuild();
        }
      });
  }

  /**
   * If a child process is currently stored, sends a terminate signal and
   * performs cleanup.
   *
   * When this function returns, `this.#process` will be `null` and it will be
   * safe for client code to immediately call functions like {@link setProcess}
   * or `#startRebuild`.
   */
  #clearProcess(): void {
    // TODO: stub
  }

  /**
   *
   */
  queueRebuild(cooloff: boolean = false) {
    if (this.#isRebuildQueued) {
      logger.debug("debounced - A ctags rebuild is already queued.");
      return;
    }

    this.#isRebuildQueued = true;
    if (cooloff) {
      this.#earliestNextRebuildTimeMs =
        globalThis.performance.now() + k_ctagsBuildCooloffMs;
    }

    if (!this.isBuilding()) {
      this.#startRebuild();
    }
  }

  /**
   * Starts a child process to rebuild the "tags" file as soon as the current
   * cooloff period ends, or immediately if there is no active cooloff period.
   *
   * @requires `this.#process` is null.
   * @throws {Error} if `this.#process` is non-null.
   */
  #startRebuild() {
    if (this == null) {
      throw new Error("THIS IS NULL AHHHHHHHHHHHHHHHHHH"); // TODO remove
    }
    if (this.#process != null) {
      throw new Error(
        "cannot start rebuild because a process reference still exists"
      );
    }

    const nowMs = globalThis.performance.now();
    const remainingCooloffMs = this.#earliestNextRebuildTimeMs - nowMs;
    if (remainingCooloffMs > 0) {
      setTimeout(this.#startRebuild, remainingCooloffMs); // TODO: need to bind or no?
      return;
    }

    this.#isRebuildQueued = false;
    this.#earliestNextRebuildTimeMs = 0;

    const opts: ChildProcess.CommonOptions = {
      timeout: this.#subProcessTimeoutMs,
    };
    const process: ChildProcess.ChildProcess = ChildProcess.exec(
      this.#subProcessCommand,
      opts
    );
    this.setProcess(process);
  }
}

const ctagsState = new CtagsState();

async function rebuildCtags(ctx: WatchContext) {
  // If "tags" file generation is already in progress, queue a rebuild for when
  // it finishes and delay by a short time in case we're experiencing many file
  // updates.
  if (ctagsState.isBuilding()) {
    ctagsState.queueRebuild(true);
    return;
  }

  // Start generating new "tags" file.
  logger.info("Start generating new 'tags' file.");
  ctagsState.queueRebuild(false);
}

// ~~~ Generic handlers and helpers ~~~

async function listener(
  target: WatchTarget,
  eventType: string,
  filename: string | Buffer | null
) {
  logger.info(`got '${eventType}' for '${target}'`);
  const ctx = watchContexts[target];
  if (ctx == null) {
    logger.warning(
      `'${target}' watch target's context is not initialized. Dropping "${eventType}" event.`
    );
    return;
  }

  switch (eventType) {
    case "change":
      await rebuild(ctx);
      break;

    case "rename":
      await rewatch(ctx);
      await rebuild(ctx);
      break;

    default:
      logger.warning(
        `unhandled event of type "${eventType}" for file "${filename}'"`
      );
  }
}

async function rewatch(ctx: WatchContext) {
  ctx.watcher.close();

  try {
    const elapsedMs = await waitForFileToExist(ctx);
  } catch (timeoutMs) {
    logger.error(
      `file '${ctx.paths.sourceFile}' disappeared for longer than ${timeoutMs}ms. Stopped watching.`
    );
    return;
  }

  switch (ctx.target) {
    case "html":
      watchHtml();
      break;

    case "css":
      watchCss();
      break;

    case "tailwind":
      watchTailwind();
      break;

    case "ctags":
      watchCtags();
      break;
  }
}

function waitForFileToExist(ctx: WatchContext): Promise<number> {
  const timeoutMs = 5_000;
  let intervalMs = 2; // must be greater than 1 for exponential backoff to work
  const startedAtMs = performance.now();

  return new Promise<number>((resolve, reject) => {
    const check = () => {
      FS.stat(ctx.paths.sourceFile, (err, _stats) => {
        const elapsedMs = performance.now() - startedAtMs;
        if (elapsedMs > timeoutMs) {
          return reject(timeoutMs);
        }

        if (err == null) {
          return resolve(elapsedMs);
        }

        intervalMs *= intervalMs; // exponential backoff
        setTimeout(check, intervalMs);
      });
    };

    check();
  });
}

async function rebuild(ctx: WatchContext) {
  switch (ctx.target) {
    case "html":
      await buildHtml(k_commonBuildTargetContexts.rootLayoutHtml);
      logger.info(`rebuilt '${ctx.paths.sourceFile}'`);
      break;

    case "css":
      await buildCss(k_commonBuildTargetContexts.globalCss);
      logger.info(`rebuilt '${ctx.paths.sourceFile}'`);
      break;

    case "tailwind":
      await buildTailwindConfig(k_commonBuildTargetContexts.tailwindConfig);
      logger.info(`rebuilt '${ctx.paths.sourceFile}'`);
      break;

    case "ctags":
      await rebuildCtags(ctx);
      logger.info("started rebuilding ctags");
      break;
  }
}
