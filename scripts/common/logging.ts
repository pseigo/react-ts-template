/*
 * react-ts-template/scripts/common/logging.ts
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2025 Peyton Seigo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the “Software”), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

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

export type StyleTextFormat = Parameters<typeof styleText>[0];

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
    const [msg, rest] = buildLogMessage(
      this.#logPrefix,
      LogLevel.DEBUG,
      ...args
    );
    console.debug(msg, ...rest);
  }

  canPrint(level: LogLevel): boolean {
    return this.#logLevel <= level;
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
