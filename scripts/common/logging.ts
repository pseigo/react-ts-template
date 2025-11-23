import { styleText } from "node:util";
import { isString } from "tanaris/strings";

export enum LogLevel {
  NONE,
  ERROR,
  WARNING,
  NOTICE,
  INFO,
  DEBUG,
}
export type LogLevelName = keyof typeof LogLevel;

type StyleTextFormat = Parameters<typeof styleText>[0];

// TODO: consider mirroring ESBuild's colour behaviour: https://esbuild.github.io/api/#color

const logLevelNameStyle: Record<LogLevel, StyleTextFormat> = {
  [LogLevel.NONE]: "grey",
  [LogLevel.ERROR]: "red",
  [LogLevel.WARNING]: "yellow",
  [LogLevel.NOTICE]: "magenta",
  [LogLevel.INFO]: "grey",
  [LogLevel.DEBUG]: "cyan",
};
const logLevelMessageStyle: Record<LogLevel, StyleTextFormat> = {
  [LogLevel.NONE]: logLevelNameStyle[LogLevel.NONE],
  [LogLevel.ERROR]: [
    logLevelNameStyle[LogLevel.ERROR],
    "bold",
  ].flat() as StyleTextFormat,
  [LogLevel.WARNING]: [
    logLevelNameStyle[LogLevel.WARNING],
    "bold",
  ].flat() as StyleTextFormat,
  [LogLevel.NOTICE]: logLevelNameStyle[LogLevel.NOTICE],
  [LogLevel.INFO]: "black",
  [LogLevel.DEBUG]: logLevelNameStyle[LogLevel.DEBUG],
};

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

  /** A namespace within the application. e.g., "project" for project scripts. */
  namespace?: string;

  /** Name of a sub-program within the app or namespace. */
  program?: string;

  /**
   * Name of a file associated with log commands.
   *
   * @example new Logger({ file: Path.basename(__filename) }); // CJS
   * @example new Logger({ file: Path.basename(import.meta.url) }); // ESM
   */
  file?: string;
}

export class Logger {
  #opts: LoggerOpts;
  #logLevel: LogLevel; // to avoid null-checks for `LoggerOpts.level`
  #logPrefix: string;

  constructor(opts: LoggerOpts) {
    this.#opts = opts;
    this.#logLevel = opts.level ?? LogLevel.INFO;
    this.#logPrefix = createLogPrefix(opts);
  }

  setLevel(level: LogLevel) {
    this.#logLevel = level;
    this.#opts.level = level; // just in case
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

  notice(...args) {
    if (this.#logLevel < LogLevel.NOTICE) {
      return;
    }
    if (args.length === 0) {
      console.info();
      return;
    }
    const [msg, rest] = buildLogMessage(
      this.#logPrefix,
      LogLevel.NOTICE,
      ...args
    );
    console.info(msg, ...rest);
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
  if (opts.app != null && opts.app !== "") {
    prefix += `[${opts.app}]`;
  }
  if (opts.namespace != null && opts.namespace !== "") {
    prefix += `[${opts.namespace}]`;
  }
  if (opts.program != null && opts.program !== "") {
    prefix += `[${opts.program}]`;
  }
  if (opts.file != null && opts.file !== "") {
    prefix += `[${opts.file}]`;
  }
  return prefix;
}

function buildLogMessage(
  prefix: string,
  level: LogLevel,
  ...args
): [string, unknown[]] {
  const timestamp = createLogTimestamp();

  const timestampBlock = styleText("grey", `[${timestamp}]`);
  const prefixBlock = styleText("grey", prefix);
  const logLevelNameBlock = styleText(
    logLevelNameStyle[level],
    `[${LogLevel[level]}]`
  );

  let msg = `${timestampBlock}${prefixBlock}${logLevelNameBlock}`;
  let rest = args;

  if (isString(args[0])) {
    msg += " ";
    msg += styleText(logLevelMessageStyle[level], args[0]);
    rest = args.slice(1);
  }

  return [msg, rest];
}

function createLogTimestamp(): string {
  return new Date().toISOString();
}
