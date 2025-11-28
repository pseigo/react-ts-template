/*
 * react-ts-template/scripts/project/rename/inspect/names.ts
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
import { styleText } from "node:util";

import type { StyleTextFormat } from "@/scripts/common/logging";

import { type NameCase, nameCasesFromFlags } from "../../cases";
import {
  type CaseReplacementPairs,
  generateFilePatches,
  Patch,
} from "../../patches";

const createRenameDiffHeader = (
  //patch: Patch.Rename,
  dirName: string,
  originalName: string,
  newName: string,
  isDirectory: boolean
): string =>
  styleText(
    "bold",
    `${dirName}/{${originalName + (isDirectory ? "/" : "")} => ${newName + (isDirectory ? "/" : "")}} (move)`
  ) + "\n";
//styleText("bold", `(rename ${isDirectory ? "directory" : "file"}):`) + "\n";
//styleText("bold", `[rename] ${isDirectory ? "directory" : "file"}:`) + "\n";
//styleText("grey", "[rename] ") + styleText("bold", `${isDirectory ? "directory" : "file"}:`) + "\n";

const applyNameReplacements = (
  originalName: string,
  cases: NameCase[],
  caseReplacements: CaseReplacementPairs
): string =>
  cases.reduce(
    (acc: string, nameCase: NameCase) =>
      acc.replaceAll(
        caseReplacements[nameCase].pattern,
        caseReplacements[nameCase].replacement
      ),
    originalName
  );

const applyNameReplacementsPretty = (
  format: StyleTextFormat,
  replaceWith: "pattern" | "replacement",
  originalName: string,
  cases: NameCase[],
  caseReplacements: CaseReplacementPairs
): string =>
  cases.reduce(
    (acc: string, nameCase: NameCase) =>
      acc.replaceAll(
        caseReplacements[nameCase].pattern,
        styleText("bold", caseReplacements[nameCase][replaceWith])
      ),
    styleText(format, originalName)
  );

function createRenameDiffLineText(
  format: StyleTextFormat,
  replaceWith: "pattern" | "replacement",
  originalName: string,
  dirName: string,
  isDirectory: boolean,
  cases: NameCase[],
  caseReplacements: CaseReplacementPairs
): string {
  const prettyName = applyNameReplacementsPretty(
    format,
    replaceWith,
    originalName,
    cases,
    caseReplacements
  );
  return (
    styleText(format, dirName + "/") +
    prettyName +
    (isDirectory ? styleText(format, "/") : "")
  );
}

function createRenameDiffLine(
  format: StyleTextFormat,
  replaceWith: "pattern" | "replacement",
  originalName: string,
  dirName: string,
  isDirectory: boolean,
  cases: NameCase[],
  caseReplacements: CaseReplacementPairs
): string {
  const prefix =
    replaceWith === "pattern" ? "--- " : styleText("green", "+++ ");
  const text = createRenameDiffLineText(
    format,
    replaceWith,
    originalName,
    dirName,
    isDirectory,
    cases,
    caseReplacements
  );
  return prefix + text + "\n";
}

async function createRenameDiffBlock(
  patch: Patch.Rename,
  caseReplacements: CaseReplacementPairs
): Promise<string> {
  const cases: NameCase[] = nameCasesFromFlags(patch.caseMatches);

  const dirName = Path.dirname(patch.originalPath);
  const originalName = Path.basename(patch.originalPath);
  const newName = applyNameReplacements(originalName, cases, caseReplacements);

  const isDirectory = (await FS.stat(patch.originalPath)).isDirectory();
  const header = createRenameDiffHeader(
    dirName,
    originalName,
    newName,
    isDirectory
  );
  const deletionLine = createRenameDiffLine(
    "red",
    "pattern",
    originalName,
    dirName,
    isDirectory,
    cases,
    caseReplacements
  );
  const additionLine = createRenameDiffLine(
    "green",
    "replacement",
    originalName,
    dirName,
    isDirectory,
    cases,
    caseReplacements
  );

  return header;

  //return header +
  //  deletionLine +
  //  additionLine + "\n";

  //const block =
  //  styleText("bold", "rename:") + "\n" +
  //    "   " + styleText("red", "src/original.ts").replaceAll("original", styleText("bold", "original")) + "\n" +
  //    "=> " + styleText("green", "src/original.ts").replaceAll("original", styleText("bold", "new"));
}

export async function createNamesPatchDiff(
  patch: Patch.Names,
  caseReplacements: CaseReplacementPairs
): Promise<string> {
  const blockPromises = patch.changes.map(
    async (renamePatch: Patch.Rename) =>
      await createRenameDiffBlock(renamePatch, caseReplacements)
  );
  const blocks = await Promise.all(blockPromises);
  const blocksStr = blocks.reduce((acc, s) => acc + s);
  return blocksStr;
}
