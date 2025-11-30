/*
 * react-ts-template/scripts/project/rename/patches.ts
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

import * as FS from "node:fs/promises";
import * as Path from "node:path";

import { NameCase } from "./cases";

export interface PatternReplacementPair {
  pattern: string;
  replacement: string;
}

export type CaseReplacementPairs = Record<NameCase, PatternReplacementPair>;

export namespace Patch {
  export interface ReplaceLine {
    lineNumber: number;
    caseMatches: number; // TODO: NameCaseFlags
    //originalContent: string;
    //newContent: string;
  }
  export interface Replace {
    path: string;
    changes: ReplaceLine[];
    cases: NameCase; // memoized while building `changes`
  }
  export interface Content {
    caseReplacements: CaseReplacementPairs;
    changes: Replace[];
  }

  export interface Rename {
    originalPath: string;
    //newPath: string;
    caseMatches: number; // TODO: NameCaseFlags
  }
  export interface Names {
    //caseReplacements: CaseReplacementPairs;
    changes: Rename[];
  }

  export interface File {
    content: Patch.Content;
    names: Patch.Names;
  }
}

/**
 * ... TODO: document
 *
 * Patch lists are returned in the same order as their corresponding paths
 * in `filePaths`.
 */
export async function generateFilePatches(
  filePaths: string[],
  caseReplacements: CaseReplacementPairs
): Promise<Patch.File> {
  const content: Patch.Content = {
    caseReplacements: caseReplacements,
    changes: await generateReplacePatches(filePaths, caseReplacements),
  };
  const names: Patch.Names = {
    //caseReplacements: caseReplacements,
    changes: await generateRenamePatches(filePaths, caseReplacements),
  };
  return { content: content, names: names };
}

async function generateReplacePatches(
  filePaths: string[],
  caseReplacements: CaseReplacementPairs
): Promise<Patch.Replace[]> {
  const replacements: PatternReplacementPair[] =
    Object.values(caseReplacements);

  return filePaths.reduce(
    async (
      replacePatchesPromise: Promise<Patch.Replace[]>,
      filePath: string
    ) => {
      const replacePatches = await replacePatchesPromise;

      const stats = await FS.stat(filePath);
      if (!stats.isFile()) {
        return replacePatches;
      }

      // TODO: read error handling
      const lines = (await FS.readFile(filePath, { encoding: "utf-8" })).split(
        "\n"
      );

      const replaceLinePatches: Patch.ReplaceLine[] = lines.reduce(
        (acc: Patch.ReplaceLine[], originalLine: string, index: number) => {
          const caseMatches: number = matchingReplacements(
            originalLine,
            caseReplacements
          );

          if (caseMatches !== 0) {
            const replaceLine: Patch.ReplaceLine = {
              lineNumber: index + 1,
              caseMatches: caseMatches,
            };
            acc.push(replaceLine);
          }

          return acc;
        },
        []
      );

      if (replaceLinePatches.length > 0) {
        const replacePatch: Patch.Replace = {
          path: filePath,
          changes: replaceLinePatches,
          cases: NameCase.SNAKE, // TODO
        };
        replacePatches.push(replacePatch);
      }

      return replacePatches;
    },
    Promise.resolve([])
  );
}

async function generateRenamePatches(
  filePaths: string[],
  caseReplacements: CaseReplacementPairs
): Promise<Patch.Rename[]> {
  const replacements: PatternReplacementPair[] =
    Object.values(caseReplacements);

  return filePaths.reduce((changes: Patch.Rename[], filePath: string) => {
    const originalName = Path.basename(filePath);

    const caseMatches: number = matchingReplacements(
      originalName,
      caseReplacements
    );
    const newName: string = applyReplacements(originalName, replacements);

    if (caseMatches !== 0) {
      changes.push({
        originalPath: filePath,
        caseMatches: caseMatches,
      });
    }

    return changes;
  }, []);
}

/**
 * Tests which patterns in `caseReplacements` match the `str` and returns a
 * bitwise OR of the corresponding `NameCase`s that do, otherwise `0` if none
 * match.
 */
const matchingReplacements = (
  str: string,
  caseReplacements: CaseReplacementPairs
): number =>
  //): NameCaseFlags => // TODO: `NameCaseFlags` type
  Object.entries(caseReplacements).reduce(
    (acc, [nameCase, pair]) =>
      new RegExp(pair.pattern).test(str)
        ? acc | (nameCase as unknown as number)
        : acc,
    0
  );

/**
 * Applies all `replacements` to `str` and returns the result.
 */
const applyReplacements = (
  str: string,
  replacements: PatternReplacementPair[]
): string =>
  replacements.reduce(
    (intermediateName, { pattern, replacement }) =>
      intermediateName.replaceAll(pattern, replacement),
    str
  );
