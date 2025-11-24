//mport Ajv, type { JTDSchemaType } from "ajv";
//import type { Schema as AjvSchema } from "ajv";
//import Ajv, { JTDDataType, type JTDSchemaType } from "ajv/dist/jtd";
import Ajv, { type DefinedError as AjvDefinedError, type JSONSchemaType } from "ajv";
//import ajvJsonSchemaDraft7MetaSchema from "ajv/dist/refs/json-schema-draft-07.json";
import * as esbuild from "esbuild";
import type { BuildOptions } from "esbuild";
import * as ChildProcess from "node:child_process";
import FS, { type FSWatcher } from "node:fs";
import { basename } from "node:path";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import { Logger, LogLevel } from "@/scripts/common/logging";
import { assertCwdIsPackageRootDir } from "@/scripts/common/packages";
import { k_paths } from "@/scripts/common/paths";
import { isNonEmptyString } from "@/scripts/common/strings";

import { k_commonBuildTargetContexts } from "./common/build";
import { errorMessageWithFallback } from "@/scripts/common/errors";
import { buildHtml } from "./common/build/html";
import { buildCss } from "./common/build/css";
import { buildTailwindConfig } from "./common/build/tailwind";
import { k_buildContextOptions } from "./common/build/javascript";
import { loadWatchConfig, WatchConfig } from "./config/watch";

const k_watchConfigFilePath = k_paths.configFiles.project.watch;
const k_watchConfigSchemaFilePath = `${k_paths.configDir}/project/_schemas/watch.config.schema.json`;

const k_subProcessTerminateSignal: NodeJS.Signals = "SIGTERM";

const k_ctagsSubProcessTimeoutMsConfigKey = "ctagsSubProcessTimeoutMs";
const k_ctagsGenScriptPath = "scripts/project/ctags/gen.sh";
const k_ctagsSubProcessCommand = `"${k_ctagsGenScriptPath}" --project`;
const k_ctagsBuildCooloffMs = 1_500;

const logger = new Logger({
  app: k_appName,
  file: basename(__filename, k_scriptExtension),
  level: LogLevel.DEBUG,
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

/** Shared global state. **/
const watchContexts: Record<WatchTarget, WatchContext | null> = {
  html: null,
  css: null,
  tailwind: null,
  ctags: null,
};

watch(); // <~~ Entry point

/**
 * @requires The process's working directory to be the package's root
 *  directory.
 * @throws {Error} If the process's working directory is not the package's root
 *  directory.
 */
async function watch() {
  assertCwdIsPackageRootDir();

  let config: WatchConfig | null = null;
  try {
    config = loadWatchConfig();
  } catch (error: unknown) {
    const reason = errorMessageWithFallback(error, "unknown");
    logger.error(
      `Failed to load '${k_watchConfigFilePath}'. Reason: ${reason}`,
      error
    );
    return;
  }
  logger.debug("Config:", config);

  await watchHtml();
  await watchCss();
  await watchTailwind();
  await watchJs();

  try {
    initCtags(config);
    await watchCtags();
  } catch (error: unknown) {
    const reason = errorMessageWithFallback(error, "unknown");
    logger.error(`Failed to start watching ctags. Reason: ${reason}`);
  }
}

// ~~~ HTML ~~~

async function watchHtml() {
  if (watchContexts.html != null) {
    watchContexts.html.watcher.close();
  }

  // prettier-ignore
  if (!isNonEmptyString(k_commonBuildTargetContexts.rootLayoutHtml.paths.sourceFile)) {
    logger.error("Failed to start HTML watcher because no source directory was set.");
    return;
  }
  // prettier-ignore
  if (!isNonEmptyString(k_commonBuildTargetContexts.rootLayoutHtml.paths.artifactFile)) {
    logger.error("Failed to start HTML because no artifact file was set.");
    return;
  }

  const watcher = FS.watch(
    k_commonBuildTargetContexts.rootLayoutHtml.paths.sourceFile,
    { encoding: "utf8" },
    (...args) => listener("html", ...args)
  );
  watchContexts.html = {
    target: "html",
    paths: {
      sourceFile: k_commonBuildTargetContexts.rootLayoutHtml.paths.sourceFile,
      artifactFile:
        k_commonBuildTargetContexts.rootLayoutHtml.paths.artifactFile,
    },
    watcher: watcher,
  };
  logger.debug(
    `Watching '${k_commonBuildTargetContexts.rootLayoutHtml.paths.sourceFile}'.`
  );
}

// ~~~ CSS ~~~

async function watchCss() {
  if (watchContexts.css != null) {
    watchContexts.css.watcher.close();
  }

  // prettier-ignore
  if (!isNonEmptyString(k_commonBuildTargetContexts.globalCss.paths.sourceFile)) {
    logger.error("Failed to start CSS watcher because no source directory was set.");
    return;
  }
  // prettier-ignore
  if (!isNonEmptyString(k_commonBuildTargetContexts.globalCss.paths.artifactFile)) {
    logger.error("Failed to start CSS watcher because no artifact file was set.");
    return;
  }

  const watcher = FS.watch(
    k_commonBuildTargetContexts.globalCss.paths.sourceFile,
    { encoding: "utf8" },
    (...args) => listener("css", ...args)
  );
  watchContexts.css = {
    target: "css",
    paths: {
      sourceFile: k_commonBuildTargetContexts.globalCss.paths.sourceFile,
      artifactFile: k_commonBuildTargetContexts.globalCss.paths.artifactFile,
    },
    watcher: watcher,
  };
  logger.debug(
    `Watching '${k_commonBuildTargetContexts.globalCss.paths.sourceFile}'.`
  );
}

// ~~~ Tailwind ~~~

async function watchTailwind() {
  if (watchContexts.tailwind != null) {
    watchContexts.tailwind.watcher.close();
  }

  // prettier-ignore
  if (!isNonEmptyString(k_commonBuildTargetContexts.tailwindConfig.paths.sourceFile)
  ) {
    logger.error("Failed to start TailwindCSS config watcher because no source directory was set.");
    return;
  }
  // prettier-ignore
  if (!isNonEmptyString(k_commonBuildTargetContexts.tailwindConfig.paths.artifactFile)) {
    logger.error("Failed to start TailwindCSS config watcher because no artifact file was set.");
    return;
  }

  const watcher = FS.watch(
    k_commonBuildTargetContexts.tailwindConfig.paths.sourceFile,
    { encoding: "utf8" },
    (...args) => listener("tailwind", ...args)
  );
  watchContexts.tailwind = {
    target: "tailwind",
    paths: {
      sourceFile: k_commonBuildTargetContexts.tailwindConfig.paths.sourceFile,
      artifactFile:
        k_commonBuildTargetContexts.tailwindConfig.paths.artifactFile,
    },
    watcher: watcher,
  };
  logger.debug(
    `Watching '${k_commonBuildTargetContexts.tailwindConfig.paths.sourceFile}'.`
  );
}

// ~~~ JS ~~~

async function watchJs() {
  const opts: BuildOptions = {
    ...k_buildContextOptions,
    logLevel: "info",
    color: false,
  };
  const context = await esbuild.context(opts);
  await context.watch();
  logger.debug("Watching app's JavaScript files.");
  logger.notice(
    'JavaScript file change messages begin with "[watch]"; these are printed by ESBuild.'
  );
}

// ~~~ ctags ~~~

let ctagsGenerator: CtagsGenerator | null;

/**
 * @throws {Error} If ctags watcher fails to initialize.
 *  Read the error's `message` property value for details.
 */
function initCtags(config: WatchConfig) {
  if (!Object.hasOwn(config, k_ctagsSubProcessTimeoutMsConfigKey)) {
    throw new Error(
      `Missing required '${k_ctagsSubProcessTimeoutMsConfigKey}' key in '${k_watchConfigFilePath}'.`
    );
  }
  const subProcessTimeoutMs: unknown =
    config[k_ctagsSubProcessTimeoutMsConfigKey];
  if (!isNaturalNumber(subProcessTimeoutMs)) {
    throw new Error(
      `Value for '${k_ctagsSubProcessTimeoutMsConfigKey}' key in '${k_watchConfigFilePath}' must be a non-negative integer.`
    );
  }

  ctagsGenerator = new CtagsGenerator(subProcessTimeoutMs);
}

function isNaturalNumber(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

async function watchCtags(): Promise<void> {
  if (watchContexts.ctags != null) {
    watchContexts.ctags.watcher.close();
  }

  if (process.platform === "win32") {
    logger.notice("Ctags generation is not yet supported on Windows.");
    return;
  }
  if (!FS.existsSync(k_ctagsGenScriptPath)) {
    logger.error("Failed to find ctags generation script.");
    return;
  }
  if (!isNonEmptyString(k_commonBuildTargetContexts.ctags.paths.sourceDir)) {
    logger.error(
      "Failed to start ctags watcher because no source directory was set."
    );
    return;
  }
  if (!isNonEmptyString(k_commonBuildTargetContexts.ctags.paths.artifactFile)) {
    logger.error(
      "Failed to start ctags watcher because no artifact file was set."
    );
    return;
  }
  // TODO: test for ctags command in path/env?

  const watcher = FS.watch(
    k_commonBuildTargetContexts.ctags.paths.sourceDir,
    {
      encoding: "utf8",
      recursive: true,
    },
    (...args) => listener("ctags", ...args)
  );
  watchContexts.ctags = {
    target: "ctags",
    paths: {
      sourceFile: k_commonBuildTargetContexts.ctags.paths.sourceDir,
      artifactFile: k_commonBuildTargetContexts.ctags.paths.artifactFile,
    },
    watcher: watcher,
  };
  logger.debug(
    `Watching '${watchContexts.ctags.paths.sourceFile}' for rebuilding ctags.`
  );
}

class CtagsGenerator {
  readonly #subProcessTimeoutMs: number;

  #process: ChildProcess.ChildProcess | null = null;
  #isRebuildQueued: boolean = false;
  #cooloffEndsAtMs: number | null = null;

  constructor(subProcessTimeoutMs: number) {
    this.#subProcessTimeoutMs = subProcessTimeoutMs;
  }

  isGenerating(): boolean {
    return this.#process != null;
  }

  /**
   * @param {object} opts
   * @param {boolean} opts.cooloff - If `false`, a rebuild will begin as soon
   *  as the current build completes. If `true`, the next rebuild will happen
   *  no sooner than the configured cooloff period
   *  (see: `k_ctagsBuildCooloffMs`); useful to mitigate thrashing in case many
   *  files update in a short time. Defaults to `false`.
   */
  queueRebuild(opts: { cooloff: boolean } = { cooloff: false }) {
    if (this.#isRebuildQueued) {
      logger.debug("Debounced - A ctags rebuild is already queued.");
      return;
    }

    this.#isRebuildQueued = true;
    if (opts.cooloff) {
      this.#startCooloff();
    }

    // If a process is running, its exit/error handler will start the rebuild.
    // Otherwise, we need to start it here.
    if (!this.isGenerating()) {
      this.#startRebuild();
    }
  }

  /**
   * Starts a child process to rebuild the "tags" file as soon as the current
   * cooloff period ends, or immediately if there is no active cooloff period.
   *
   * @requires `!this.isGenerating()`
   * @throws {Error} If `this.isGenerating()`.
   */
  #startRebuild() {
    if (this.isGenerating()) {
      throw new Error(
        "Cannot start ctags rebuild because a build is already in progress."
      );
    }

    const remainingCooloffMs = this.#remainingCooloffMs();
    if (remainingCooloffMs > 0) {
      logger.debug(
        `Postponing ctags rebuild due to cooloff (${remainingCooloffMs}ms remaining).`
      );
      setTimeout(this.#startRebuild.bind(this), remainingCooloffMs);
      return;
    }
    this.#clearCooloff();

    this.#isRebuildQueued = false;
    this.#startChildProcess();
  }

  #startChildProcess() {
    logger.debug("Regenerating ctags...");
    const opts: ChildProcess.ExecOptions = {
      timeout: this.#subProcessTimeoutMs,
      killSignal: k_subProcessTerminateSignal,
    };
    const process: ChildProcess.ChildProcess = ChildProcess.exec(
      k_ctagsSubProcessCommand,
      opts
    );
    this.setProcess(process);
  }

  #startCooloff() {
    this.#cooloffEndsAtMs =
      globalThis.performance.now() + k_ctagsBuildCooloffMs;
  }
  #clearCooloff() {
    this.#cooloffEndsAtMs = null;
  }
  #remainingCooloffMs(): number {
    if (this.#cooloffEndsAtMs == null) {
      return 0;
    }
    const nowMs = globalThis.performance.now();
    const remainingCooloffMs = this.#cooloffEndsAtMs - nowMs;
    return remainingCooloffMs > 0 ? Math.ceil(remainingCooloffMs) : 0;
  }

  /**
   * Stores and hooks into the given `process` through "exit" and "error" handlers.
   *
   * When the `process` terminates, starts a rebuild if one is queued.
   *
   * @requires `!this.isGenerating()`
   * @throws {Error} If `this.isGenerating()`.
   */
  setProcess(process: ChildProcess.ChildProcess): void {
    if (this.isGenerating()) {
      throw new Error(
        "Cannot set ctags process because a build is still in progress."
      );
    }
    this.#process = process;
    process
      .on("error", (error: Error) => {
        logger.error("Got 'error' event from ctags generation process.", error);

        this.#process = null;
        if (this.#isRebuildQueued) {
          this.#startRebuild();
        }
      })
      .once("exit", (code: number | null, signal: NodeJS.Signals | null) => {
        logger.debug("Ctags subprocess event: exit", code, signal);

        const wasTerminated =
          code == null && signal === k_subProcessTerminateSignal;
        const exitedWithError = code != null && code !== 0;

        if (wasTerminated) {
          // Assuming termination implies timeout.
          logger.error(
            `Ctags generation timed out after ${this.#subProcessTimeoutMs}ms. Consider increasing the value for '${k_ctagsSubProcessTimeoutMsConfigKey}' in '${k_watchConfigFilePath}'.`
          );
        } else if (exitedWithError) {
          logger.error(
            `Ctags generation process exited with error code (${code}).`
          );
        } else {
          logger.info('Rebuilt ctags "tags" file.');
        }

        this.#process = null;
        if (this.#isRebuildQueued) {
          this.#startRebuild();
        }
      });
  }
}

async function startCtagsRebuild(ctx: WatchContext) {
  if (ctagsGenerator == null) return;
  ctagsGenerator.queueRebuild({ cooloff: ctagsGenerator.isGenerating() });
}

// ~~~ Generic handlers and helpers ~~~

async function listener(
  target: WatchTarget,
  eventType: string,
  filename: string | Buffer | null
) {
  logger.debug(`Got '${eventType}' event for '${target}' target.`);
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
        `Unhandled event of type "${eventType}" for file "${filename}'"`
      );
  }
}

async function rewatch(ctx: WatchContext) {
  ctx.watcher.close();

  try {
    const _elapsedMs = await waitForFileToExist(ctx);
  } catch (timeoutMs) {
    logger.warning(
      `File '${ctx.paths.sourceFile}' disappeared for longer than ${timeoutMs}ms. Stopped watching.`
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
      logger.info(`Redeployed '${ctx.paths.sourceFile}'.`);
      break;

    case "css":
      await buildCss(k_commonBuildTargetContexts.globalCss);
      logger.info(`Rebuilt '${ctx.paths.sourceFile}'.`);
      break;

    case "tailwind":
      await buildTailwindConfig(k_commonBuildTargetContexts.tailwindConfig);
      logger.info(`Rebuilt '${ctx.paths.sourceFile}'.`);
      break;

    case "ctags":
      await startCtagsRebuild(ctx);
      break;
  }
}
