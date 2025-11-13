import Chalk, { type ChalkInstance } from "chalk";
import { isString } from "tanaris/strings";

export enum LogLevel {
  NONE,
  ERROR,
  WARNING,
  NOTICE, // not as severe as WARNING, but more important than INFO.
  INFO,
  DEBUG,
}
export type LogLevelName = keyof typeof LogLevel;

const logLevelNameStyle: Record<LogLevel, ChalkInstance> = {
  [LogLevel.NONE]: Chalk.grey,
  [LogLevel.ERROR]: Chalk.red,
  [LogLevel.WARNING]: Chalk.yellow,
  [LogLevel.NOTICE]: Chalk.magenta,
  [LogLevel.INFO]: Chalk.grey,
  [LogLevel.DEBUG]: Chalk.cyan,
};
const logLevelMessageStyle: Record<LogLevel, ChalkInstance> = {
  [LogLevel.NONE]: logLevelNameStyle[LogLevel.NONE],
  [LogLevel.ERROR]: logLevelNameStyle[LogLevel.ERROR].bold,
  [LogLevel.WARNING]: logLevelNameStyle[LogLevel.WARNING].bold,
  [LogLevel.NOTICE]: logLevelNameStyle[LogLevel.NOTICE],
  [LogLevel.INFO]: Chalk.black,
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
   * @example new Logger({ file: import.meta.url }); // ESM
   * @example new Logger({ file: __filename }); // CJS
   */
  file?: string;
}

export class Logger {
  #opts: LoggerOpts;
  #logLevel: LogLevel; // to avoid null-checking on `LoggerOpts.level?`
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
  if (opts.app != null) {
    prefix += `[${opts.app}]`;
  }
  if (opts.namespace != null) {
    prefix += `[${opts.namespace}]`;
  }
  if (opts.program != null) {
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

  const timestampBlock = Chalk.grey(`[${timestamp}]`);
  const prefixBlock = Chalk.grey(prefix);
  const logLevelNameBlock = logLevelNameStyle[level](`[${LogLevel[level]}]`);

  let msg = `${timestampBlock}${prefixBlock}${logLevelNameBlock}`;
  let rest = args;

  if (isString(args[0])) {
    msg += " ";
    msg += logLevelMessageStyle[level](args[0]);
    rest = args.slice(1);
  }

  return [msg, rest];
}

function createLogTimestamp(): string {
  return new Date().toISOString();
}
