import { isString } from "tanaris/strings";

export enum LogLevel {
  NONE,
  ERROR,
  WARNING,
  INFO,
  DEBUG,
}

export type LogLevelName = keyof typeof LogLevel;

export interface LoggerOpts {
  /**
   * Lowest severity log level allowed to be printed. Defaults to
   * `LogLevel.INFO` (meaning everything except `LogLevel.DEBUG` messages will
   * be printed).
   *
   * Messages with a lower severity than the {@link Logger}'s current `level`
   * will be no-ops.
   *
   * Setting `level to `LogLevel.NONE` means all attempted log commands will be
   * no-ops (nothing will be printed, regardless of level).
   */
  level?: LogLevel;

  /** Name of the application. */
  app?: string;

  /** Name of a sub-program within the application. */
  program?: string;

  /**
   * Name of a file associated with log commands.
   *
   * @example new Logger({ file: import.meta.url }); // ESM
   * @example new Logger({ file: __filename }); // CJS
   */
  file?: string;
}

export class Logger {
  #logLevel: LogLevel;
  #appName: string | null;
  #programName: string | null;
  #associatedFile: string | null;
  #logPrefix: string;

  constructor(opts: LoggerOpts) {
    this.#logLevel = opts.level ?? LogLevel.INFO;
    this.#appName = opts.app ?? null;
    this.#programName = opts.program ?? null;
    this.#associatedFile = opts.file ?? null;
    this.#logPrefix = createLogPrefix(opts);
  }

  setLevel(level: LogLevel) {
    this.#logLevel = level;
  }

  error(...args) {
    if (this.#logLevel < LogLevel.ERROR) {
      return;
    }
    if (args.length === 0) {
      console.error();
      return;
    }
    const [msg, rest] = buildLogMessage(
      this.#logPrefix,
      LogLevel.ERROR,
      ...args
    );
    console.error(msg, ...rest);
  }

  warning(...args) {
    if (this.#logLevel < LogLevel.WARNING) {
      return;
    }
    if (args.length === 0) {
      console.warn();
      return;
    }
    const [msg, rest] = buildLogMessage(
      this.#logPrefix,
      LogLevel.WARNING,
      ...args
    );
    console.warn(msg, ...rest);
  }

  info(...args) {
    if (this.#logLevel < LogLevel.INFO) {
      return;
    }
    if (args.length === 0) {
      console.info();
      return;
    }
    const [msg, rest] = buildLogMessage(
      this.#logPrefix,
      LogLevel.INFO,
      ...args
    );
    console.info(msg, ...rest);
  }

  debug(...args) {
    if (this.#logLevel < LogLevel.DEBUG) {
      return;
    }
    if (args.length === 0) {
      console.debug();
      return;
    }
    const [msg, rest] = buildLogMessage(
      this.#logPrefix,
      LogLevel.DEBUG,
      ...args
    );
    console.debug(msg, ...rest);
  }
}

function createLogPrefix(opts: LoggerOpts): string {
  let prefix = "";
  if (opts.app != null) {
    prefix += `[${opts.app}]`;
  }
  if (opts.program != null) {
    prefix += `[${opts.program}]`;
  }
  if (opts.file != null && opts.file !== "") {
    const truncatedFile = truncateFileName(opts.file);
    prefix += `[${truncatedFile}]`;
  }
  return prefix;
}

function truncateFileName(file: string): string {
  const projectRootDirName = "react-ts-template";

  // (a) Try truncating to a path relative to the project's root directory.
  {
    const regExp = new RegExp(`^.*${projectRootDirName}\/(.*)`);
    const match = file.match(regExp);
    if (match != null) {
      return match[1]!;
    }
  }

  // (b) Try truncating to just the filename.
  {
    const match = file.match(/^.*\/(.*)/);
    if (match != null) {
      return match[1]!;
    }
  }

  return "";
}

function buildLogMessage(
  prefix: string,
  level: LogLevel,
  ...args
): [string, unknown[]] {
  const timestamp = createLogTimestamp();
  let msg = `[${timestamp}]${prefix}[${LogLevel[level]}]`;
  let rest = args;

  if (isString(args[0])) {
    msg += " ";
    msg += args[0];
    rest = args.slice(1);
  }

  return [msg, rest];
}

function createLogTimestamp(): string {
  return new Date().toISOString();
}
