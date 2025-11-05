import * as esbuild from "esbuild";
import * as FS from "node:fs";
import resolveTailwindConfig from "tailwindcss/resolveConfig";
import * as ChildProcess from "node:child_process";
import { type FSWatcher } from "node:fs";
import postcss, {
  type Processor as PostCssProcessor,
  type Result as PostCssResult,
}  from "postcss";
import postcssLoadConfig, { type ConfigContext as PostCssLoadConfigContext } from "postcss-load-config";

import { k_buildContextOptions } from "./common/esbuild.js";
import { k_paths } from "./common/paths.js";

const k_ctagsGenScriptPath = "scripts/project/ctags/gen.sh";
const k_globalCssSourceFilePath = `${k_paths.rootLayoutDir}/global.css`;
const k_globalCssArtifactFilePath = `${k_paths.distDir}/global.css`;
const k_indexHtmlSourceFilePath = `${k_paths.rootLayoutDir}/index.html`;
const k_indexHtmlArtifactFilePath = `${k_paths.distDir}/index.html`;
const k_logPrefix = "[unnamed_project][scripts/watch_build_html.js]";
const k_tailwindConfigFilePath = `${k_paths.configDir}/tailwind.config.cjs`;
const k_tailwindArtifactDirPath = `${k_paths.srcGenDir}/tailwind`;
const k_tailwindArtifactFilePath = `${k_tailwindArtifactDirPath}/compiled_theme.json`;
//import tailwindTheme from "@/unnamed_project/gen/tailwind/compiled_theme.json";

type WatchTarget = "html" | "css" | "tailwind" | "ctags";

interface WatchContext {
  target: WatchTarget;
  sourceFilePath: string;
  artifactFilePath: string;
  watcher: FSWatcher;
}

const watchContexts: Record<WatchTarget, WatchContext | null> = {
  html: null,
  css: null,
  tailwind: null,
  ctags: null
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

  const watcher = FS.watch(k_indexHtmlSourceFilePath, { encoding: "utf8" }, (...args) => listener("html", ...args));
  watchContexts.html = {
    target: "html",
    sourceFilePath: k_indexHtmlSourceFilePath,
    artifactFilePath: k_indexHtmlArtifactFilePath,
    watcher: watcher
  };
  console.log(`${k_logPrefix}[info] watching '${k_indexHtmlSourceFilePath}'`);
}

function rebuildHtml(ctx: WatchContext) {
  FS.copyFileSync(ctx.sourceFilePath, ctx.artifactFilePath);
}

// ~~~ CSS ~~~

async function watchCss() {
  if (watchContexts.css != null) {
    watchContexts.css.watcher.close();
  }

  const watcher = FS.watch(k_globalCssSourceFilePath, { encoding: "utf8" }, (...args) => listener("css", ...args));
  watchContexts.css = {
    target: "css",
    sourceFilePath: k_globalCssSourceFilePath,
    artifactFilePath: k_globalCssArtifactFilePath,
    watcher: watcher
  };
  console.log(`${k_logPrefix}[info] watching '${k_globalCssSourceFilePath}'`);
}

async function rebuildCss(ctx: WatchContext) {
  const globalCssSource = FS.readFileSync(ctx.sourceFilePath, {
    encoding: "utf8",
    flag: "r",
  });

  //const postcssLoadConfigContext: PostCssLoadConfigContext = { map: "inline" };
  const postcssLoadConfigContext: PostCssLoadConfigContext = {};
  const postcssConfig = await postcssLoadConfig(postcssLoadConfigContext, "./config");

  const postcssPlugins = postcssConfig.plugins;
  const postcssProcessOptions = {
    ...postcssConfig.options,
    from: ctx.sourceFilePath,
    to: ctx.artifactFilePath,
  };

  const postcssProcessor: PostCssProcessor = await postcss(postcssPlugins);

  const globalCssArtifact: PostCssResult = await postcssProcessor.process(
    globalCssSource,
    postcssProcessOptions
  );

  FS.writeFileSync(ctx.artifactFilePath, globalCssArtifact.css, {
    encoding: "utf8",
    flag: "w",
    mode: 0o644,
  });
}

// ~~~ Tailwind ~~~

async function watchTailwind() {
  if (watchContexts.tailwind != null) {
    watchContexts.tailwind.watcher.close();
  }

  const watcher = FS.watch(k_tailwindConfigFilePath, { encoding: "utf8" }, (...args) => listener("tailwind", ...args));
  watchContexts.tailwind = {
    target: "tailwind",
    sourceFilePath: k_tailwindConfigFilePath,
    artifactFilePath: k_tailwindArtifactFilePath,
    watcher: watcher
  };
  console.log(`${k_logPrefix}[info] watching '${k_tailwindConfigFilePath}'`);
}

async function rebuildTailwind(ctx: WatchContext) {
  //FS.copyFileSync(ctx.sourceFilePath, ctx.artifactFilePath);

  let rawConfigStr: string | null = null;
  try {
    rawConfigStr = FS.readFileSync(k_tailwindConfigFilePath, {
      encoding: "utf8",
      flag: "r",
    });
  } catch (error: unknown) {
    const reason = error instanceof Error ? ` - ${error.message}` : "";
    console.error(`${k_logPrefix}[error] failed to create Tailwind gen dir${reason}`);
    return;
  }

  const rawConfigObj = JSON.parse(rawConfigStr);
  const config = resolveTailwindConfig(rawConfigObj);
  const theme = config["theme"];
  const rawThemeStr = JSON.stringify(theme);

  try {
    FS.mkdirSync(k_tailwindArtifactDirPath);
  } catch (error: unknown) {
    const reason = error instanceof Error ? ` - ${error.message}` : "";
    console.error(`${k_logPrefix}[error] failed to create Tailwind gen dir${reason}`);
    return;
  }

  FS.writeFileSync(k_tailwindArtifactFilePath, rawThemeStr, {
    encoding: "utf8",
    mode: 0o644, // rw-r--r--
    flag: "w"
  });
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
    console.log(`${k_logPrefix}[info] ctags generation not yet supported on Windows.`);
    return;
  }

  if (!FS.existsSync(k_ctagsGenScriptPath)) {
    console.warn(`${k_logPrefix}[info] failed to find ctags generation script.`);
    return;
  }

  const watcher = FS.watch(k_paths.srcDir, {
    encoding: "utf8",
    recursive: true
  }, (...args) => listener("ctags", ...args));
  watchContexts.ctags = {
    target: "ctags",
    sourceFilePath: k_paths.srcDir,
    artifactFilePath: "tags",
    watcher: watcher
  };
  console.log(`${k_logPrefix}[info] watching '${k_paths.srcDir}' for rebuilding ctags`);
}

const k_ctagsBuildCooloffMs = 1_000;

class CtagsState {
  readonly #subProcessCommand = `"${k_ctagsGenScriptPath}" --project`;
  readonly #subProcessTimeoutMs = 2_000;

  #process: ChildProcess.ChildProcess | null = null;
  #isRebuildQueued: boolean = false;
  #earliestNextRebuildTimeMs: number = 0;

  isBuilding(): boolean { return this.#process != null; }
  isRebuildQueued(): boolean { return this.#isRebuildQueued; }

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
      throw new Error("cannot set process because a process reference still exists");
    }
    this.#process = process;
    process
      .once("exit", (code: number | null, signal: NodeJS.Signals | null) => {
        console.log(`${k_logPrefix}[info] subprocess event: exit`, code, signal);
        const hasError = code !== 0;
        if (hasError) {
          console.error(`${k_logPrefix}[error] ctags generation exited with error code; code=${code}, signal=${signal}`);
        } else {
          console.log(`${k_logPrefix}[info] Rebuilt ctags "tags" file.`);
        }
        // TODO: any other process cleanup needed here?
        this.#process = null;
        if (this.#isRebuildQueued) {
          this.#startRebuild();
        }
      })
      .once("error", (error: Error) => {
        console.error(`${k_logPrefix}[error] ctags generation failed (got "error" event)`, error);
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
      console.log(`${k_logPrefix}[debug] debounced - A ctags rebuild is already queued.`);
      return;
    }

    this.#isRebuildQueued = true;
    if (cooloff) {
      this.#earliestNextRebuildTimeMs = globalThis.performance.now() + k_ctagsBuildCooloffMs;
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
      throw new Error("cannot start rebuild because a process reference still exists");
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
      timeout: this.#subProcessTimeoutMs
    };
    const process: ChildProcess.ChildProcess = ChildProcess.exec(this.#subProcessCommand, opts);
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
  console.log(`${k_logPrefix} Start generating new "tags" file.`);
  ctagsState.queueRebuild(false);
}

// ~~~ Generic handlers and helpers ~~~

async function listener(target: WatchTarget, eventType: string, filename: string | Buffer | null) {
  console.log(`${k_logPrefix} got '${eventType}' for '${target}'`);
  const ctx = watchContexts[target];
  if (ctx == null) {
    console.warn(`${k_logPrefix}[warn] '${target}' watch target's context is not initialized. Dropping "${eventType}" event.`);
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
      console.warn(
        `${k_logPrefix}[warn] unhandled event of type "${eventType}" for file "${filename}'"`
      );
  }
}

async function rewatch(ctx: WatchContext) {
  ctx.watcher.close();

  try {
    const timeElapsedMs = await waitForFileToExist(ctx);
  } catch (timeoutMs) {
    console.error(
      `${k_logPrefix}[error] file '${ctx.sourceFilePath}' disappeared for longer than ${timeoutMs}ms. Stopped watching.`
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

  const promise = new Promise<number>((resolve, reject) => {
    const check = () => {
      FS.stat(ctx.sourceFilePath, (err, _stats) => {
        const timeElapsedMs = performance.now() - startedAtMs;
        if (timeElapsedMs > timeoutMs) {
          return reject(timeoutMs);
        }

        if (err == null) {
          return resolve(timeElapsedMs);
        }

        intervalMs *= intervalMs; // exponential backoff
        setTimeout(check, intervalMs);
      });
    };

    check();
  });

  return promise;
}

async function rebuild(ctx: WatchContext) {
  switch (ctx.target) {
    case "html":
      rebuildHtml(ctx);
      console.log(`${k_logPrefix}[info] rebuilt '${ctx.sourceFilePath}'`);
      break;

    case "css":
      await rebuildCss(ctx);
      console.log(`${k_logPrefix}[info] rebuilt '${ctx.sourceFilePath}'`);
      break;

    case "tailwind":
      await rebuildTailwind(ctx);
      console.log(`${k_logPrefix}[info] rebuilt '${ctx.sourceFilePath}'`);
      break;

    case "ctags":
      await rebuildCtags(ctx);
      console.log(`${k_logPrefix}[info] started rebuilding ctags`);
      break;
  }
}
