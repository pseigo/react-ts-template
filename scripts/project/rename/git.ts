/*
 * react-ts-template/scripts/project/rename/glob.ts
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

import { spawn } from "node:child_process";
import { basename } from "node:path";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import { Logger, LogLevel } from "@/scripts/common/logging";

type GitWorkingTreeStatusResult = "clean" | "dirty" | "no_git";

const logger = new Logger({
  app: k_appName,
  file: basename(__filename, k_scriptExtension),
  //level: LogLevel.DEBUG,
});

const k_subProcessTimeoutMs = 5_000;
const k_subProcessTerminateSignal: NodeJS.Signals = "SIGTERM";

// TODO: unit test `queryGitWorkingTreeStatus`
export function queryGitWorkingTreeStatus(): Promise<GitWorkingTreeStatusResult> {
  return new Promise((resolve, reject) => {
    // TODO: does Windows need "git.exe" or just "git"?
    // TODO: ..is this a bad idea?
    const child = spawn("git", ["status", "--porcelain"], {
      stdio: ["ignore", "pipe", "pipe"], // stdin, stdout, stderr
      timeout: k_subProcessTimeoutMs,
      killSignal: k_subProcessTerminateSignal,
      windowsHide: true,
    });

    const out: string[] = [];
    const err: string[] = [];

    child.stdout.on("data", (chunk: Buffer | string) => {
      logger.debug("got stdout chunk", chunk);
      if (chunk instanceof Buffer) {
        out.push(chunk.toString("utf-8"));
      } else if (typeof chunk === "string") {
        out.push(chunk);
      }
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      logger.debug("got stderr chunk", chunk);
      if (chunk instanceof Buffer) {
        err.push(chunk.toString("utf-8"));
      } else if (typeof chunk === "string") {
        err.push(chunk);
      }
    });

    child.once("error", (e: NodeJS.ErrnoException) => {
      if (e.code === "ENOENT") {
        resolve("no_git");
      } else {
        reject(e);
      }
    });

    child.once("exit", (code: number | null, signal: NodeJS.Signals | null) => {
      const wasTerminated =
        code == null && signal === k_subProcessTerminateSignal;
      const exitedWithError = code != null && code !== 0;

      if (wasTerminated) {
        return reject("Git sub-process was terminated.");
      } else if (exitedWithError) {
        return reject(`Git sub-process exited with error code '${code}'.`);
      }

      logger.debug(
        "Git sub-process exited, here's 'out' and 'err':",
        out.length,
        err.length,
        out,
        err
      );
      resolve(out.length === 0 ? "clean" : "dirty");
    });
  });
}
