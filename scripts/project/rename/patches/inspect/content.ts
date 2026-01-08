/*
 * react-ts-template/scripts/project/rename/inspect/content.ts
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
import { styleText } from "node:util";

import { type StyleTextFormat } from "@/scripts/common/logging";

import { type NameCase, nameCasesFromFlags } from "../../cases";
import { type CaseReplacementPairs, Patch } from "../../patches";

export async function createContentPatchDiff(
  patch: Patch.Content,
  caseReplacements: CaseReplacementPairs
): Promise<string> {
  const fileDiffBlocks = await createFileDiffBlocks(patch, caseReplacements);
  return fileDiffBlocks.reduce((acc, s) => acc + s, "");
}

const createFileDiffBlocks = async (
  patch: Patch.Content,
  caseReplacements: CaseReplacementPairs
): Promise<string[]> =>
  await patch.changes.reduce(
    async (accPromise: Promise<string[]>, replacePatch: Patch.Replace) => {
      const acc = await accPromise;

      const lines = (
        await FS.readFile(replacePatch.path, { encoding: "utf-8" })
      ).split("\n");

      const fileHeader = createFileHeader(replacePatch.path);

      const patchBlocks = replacePatch.changes.reduce(
        (acc2: string[], replaceLinePatch: Patch.ReplaceLine) => {
          const { lineNumber } = replaceLinePatch;
          const line = lines[lineNumber - 1];
          if (line == null) {
            return acc2; // silent suppress RangeError...
          }
          const lineDiff = createReplaceLineDiff(
            line,
            replaceLinePatch,
            caseReplacements
          );
          acc2.push(lineDiff);
          acc2.push("\n\n");
          return acc2;
        },
        []
      );

      acc.push(fileHeader);
      acc.push("\n");
      return acc.concat(patchBlocks);
    },
    Promise.resolve([])
  );

const createFileHeader = (filePath): string => styleText("bold", filePath);
//styleText(["grey"], "[patch] ") + styleText("bold", filePath);
//styleText("bold", `[patch] ${filePath}:`);

const createReplaceLineDiffHeader = (lineNumber: number): string =>
  styleText("cyan", `@@ -${lineNumber},1 +${lineNumber},1 @@`);

const createReplaceLineDiffLine = (
  format: StyleTextFormat,
  replaceWith: "pattern" | "replacement",
  originalLine: string,
  cases: NameCase[],
  caseReplacements: CaseReplacementPairs
): string =>
  cases.reduce(
    (acc: string, nameCase: NameCase) =>
      acc.replaceAll(
        caseReplacements[nameCase].pattern,
        styleText(
          "bold",
          //[format, "bold"].flat() as StyleTextFormat,
          caseReplacements[nameCase][replaceWith]
        )
      ),
    styleText(format, originalLine)
    //originalLine
    //styleText("grey", originalLine)
  );

const createReplaceLineDiff = (
  originalLine: string,
  patch: Patch.ReplaceLine,
  caseReplacements: CaseReplacementPairs
): string => {
  const deletionLinePrefix = "\n" + styleText("red", "-");
  const additionLinePrefix = "\n" + styleText("green", "+");

  const cases: NameCase[] = nameCasesFromFlags(patch.caseMatches);
  const header = createReplaceLineDiffHeader(patch.lineNumber);
  const deletionLine = createReplaceLineDiffLine(
    "red",
    "pattern",
    originalLine,
    cases,
    caseReplacements
  );
  const additionLine = createReplaceLineDiffLine(
    "green",
    "replacement",
    originalLine,
    cases,
    caseReplacements
  );

  return (
    header +
    deletionLinePrefix +
    deletionLine +
    additionLinePrefix +
    additionLine
  );
};
