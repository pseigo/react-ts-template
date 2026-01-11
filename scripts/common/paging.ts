/*
 * react-ts-template/scripts/common/paging.ts
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
import * as FS from "node:fs/promises";
import { stdin, stdout } from "node:process";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import { Logger, LogLevel } from "@/scripts/common/logging";
import { isNonEmptyString } from "@/scripts/common/strings";

const logger = new Logger({
  app: k_appName,
  file: basename(__filename, k_scriptExtension),
  //level: LogLevel.DEBUG,
});

/**
 * Attempts to pipe `data` to the environment's configured pager, or some
 * (opaque) default. Returns `true` if a pager can be found, started, and piped
 * the `data`, otherwise returns `false`.
 */
export async function showPager(data: string): Promise<boolean> {
  const { pager, pagerArgs } = await findPager();

  if (pager == null) {
    return false;
  }

  return doShowPager(pager, pagerArgs, data);
}

function doShowPager(
  pager: string,
  pagerArgs: string[],
  data: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let resolved: boolean = false;
    const pagerProcess = spawn(pager, pagerArgs, {
      stdio: ["pipe", "inherit", "inherit"],
    });

    pagerProcess.on("error", (error: Error) => {
      // Failed to start process.
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    });

    pagerProcess.on("spawn", () => {
      // Process started.
      pagerProcess.stdin.write(data);
      pagerProcess.stdin.end();
    });

    pagerProcess.on(
      "exit",
      (code: number | null, signal: NodeJS.Signals | null) => {
        logger.debug(`pager ${pager}: exit`);
        // Process self-exited or was terminated.
        if (!resolved) {
          resolved = true;
          resolve(true);
        }
      }
    );
  });
}

/**
 * Searches the process's environment for a pager program.
 *
 * If found, returns its name or a path to the program.
 * Otherwise, returns `null`.
 */
async function findPager(): Promise<{
  pager: string | null;
  pagerArgs: string[];
}> {
  // TODO: split or quote env vars in case they have spaces?

  const pagers: unknown[] = [process.env["PAGER"], "less", "more"];
  const pager = await firstExistingPager(pagers.toReversed());

  if (isNonEmptyString(pager) && ["less", "more"].includes(pager)) {
    // TODO: read `less` docs for all options
    return { pager: pager, pagerArgs: ["-F", "-R", "-X"] };
  }

  return { pager: pager, pagerArgs: [] };
}

async function firstExistingPager(pagers: unknown[]): Promise<string | null> {
  if (pagers.length === 0) {
    return null;
  }

  const pager = pagers.pop();
  if (isNonEmptyString(pager) && (await pagerExists(pager))) {
    return pager;
  }

  return firstExistingPager(pagers);
}

async function pagerExists(pager: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let resolved: boolean = false;
    const process = spawn(pager, { stdio: "ignore", timeout: 7_000 });

    process.on("error", (error: Error) => {
      // Failed to start process.
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    });

    process.on("spawn", () => {
      // Process started.
      if (!resolved) {
        resolved = true;
        resolve(true);
        process.kill();
      }
    });

    process.on("exit", (code: number | null, signal: NodeJS.Signals | null) => {
      // Process self-exited or was terminated.
      if (!resolved) {
        resolved = true;
        resolve(true);
      }
    });
  });
}
