/*
 * react-ts-template/scripts/project/rename.ts
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

// TODO: make sure newline split patterns are correct

import * as FS from "node:fs/promises";
import * as Path from "node:path";
import { basename } from "node:path";
import {
  createInterface as createReadlineInterface,
  type Interface as ReadlineInterface,
} from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { parseArgs, type ParseArgsOptionsConfig, styleText } from "node:util";
import { inclusiveRange } from "tanaris/ranges";
import { toMarkdownTable } from "tanaris/strings/markdown_table";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import {
  Logger,
  LogLevel,
  type StyleTextFormat,
} from "@/scripts/common/logging";
import {
  errorMessageWithFallback,
  isErrorWithMessage,
} from "@/scripts/common/errors";
import { assertCwdIsPackageRootDir } from "@/scripts/common/packages";

import { NameCase } from "./rename/cases";
import { queryGitWorkingTreeStatus } from "./rename/git";
import { selectFiles } from "./rename/glob";
import { hasHelpOption, renderHelpInfo } from "./rename/help";
import {
  k_shortOption,
  OptionName,
  parseRenameArgs,
  type RenameOptions,
} from "./rename/options";
import { showPager } from "./rename/paging";
import {
  type CaseReplacementPairs,
  generateFilePatches,
  Patch,
} from "./rename/patches";
import { createContentPatchDiff } from "./rename/patches/inspect/content";
import { createNamesPatchDiff } from "./rename/patches/inspect/names";

const logger = new Logger({
  app: k_appName,
  file: basename(__filename, k_scriptExtension),
  level: LogLevel.DEBUG,
});

const k_statusOk = 0;
const k_statusError = 1;
const k_runCommand = "npm run rename --";

export async function renameProject() {
  // ~~~ Process command-line arguments. ~~~
  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0) {
    logger.error(`No arguments provided. '${k_runCommand} -h' for help.`);
    process.exit(k_statusError);
    return;
  }

  if (hasHelpOption(rawArgs)) {
    const helpInfo = renderHelpInfo({ runCommand: k_runCommand });
    logger.info(helpInfo);
    process.exit(k_statusOk);
    return;
  }

  let opts: RenameOptions | null = null;
  try {
    opts = parseRenameArgs(rawArgs, { logger: logger });
  } catch (error: unknown) {
    const reason = errorMessageWithFallback(
      error,
      `Unknown cause... try reviewing the help page ('${k_runCommand} -${k_shortOption[OptionName.HELP]}').`
    );
    logger.error(`Argument error: ${reason}`);
    return;
  }

  // ~~~ Setup. ~~~
  assertCwdIsPackageRootDir();
  const input = createReadlineInterface({ input: stdin, output: stdout });

  // ~~~ Check git working tree status. Prompt confirmation. ~~~
  if (opts.noGit) {
    logger.info(
      `'--${OptionName.NO_GIT}': Skipping working tree status check...`
    );
  } else if (opts.skipDirtyCheck) {
    logger.info(
      `'--${OptionName.SKIP_DIRTY_CHECK}': Skipping working tree status check...`
    );
  } else {
    const gitWorkingTreeStatus = await queryGitWorkingTreeStatus();
    //logger.debug("gitWorkingTreeStatus:", gitWorkingTreeStatus);
    if (gitWorkingTreeStatus === "no_git") {
      logger.warning(
        "\n\nCAUTION: Could not find 'git' in process environment to check working tree status.\n\nPlease check \`git status\` and consider committing, stashing, or reseting any uncommitted changes so \`git status\` is clean BEFORE performing the rename (to ease code review or reversion)...\n\nContinue anyways? (only recommended if the working tree is clean)"
      );
      if (!(await promptToContinue(input))) {
        return;
      }
    } else if (gitWorkingTreeStatus === "dirty") {
      logger.warning(
        "\nCAUTION: You appear to have uncommitted changes in the git working tree. Please consider committing, stashing, or reseting any uncommitted changes so \`git status\` is clean BEFORE performing the rename (to ease code review or reversion)...\n\nContinue anyways? (not recommended)"
      );
      if (!(await promptToContinue(input))) {
        return;
      }
    } else {
      logger.info("Git working tree appears to be clean. Continuing...");
    }
  }

  // ~~~ Summarize name mappings. Prompt confirmation. ~~~

  const namesSummary = createNamesSummary(opts);
  logger.notice(namesSummary);
  if (!opts.skipReview) {
    if (!(await promptToContinue(input))) {
      return;
    }
  }

  // ~~~ Generate patches. ~~~
  const caseReplacements: CaseReplacementPairs = {
    [NameCase.SNAKE]: {
      pattern: opts.oldNameSnake,
      replacement: opts.newNameSnake,
    },
    [NameCase.KEBAB]: {
      pattern: opts.oldNameKebab,
      replacement: opts.newNameKebab,
    },
    [NameCase.PASCAL]: {
      pattern: opts.oldNamePascal,
      replacement: opts.newNamePascal,
    },
    [NameCase.TITLE]: {
      pattern: opts.oldNameTitle,
      replacement: opts.newNameTitle,
    },
  };
  const filePaths = await selectFiles();
  const patches = await generateFilePatches(filePaths, caseReplacements);
  await printPatches(patches, caseReplacements, opts);

  //logger.debug("file paths:", filePaths);
  //logger.debug("generated patches:", patches);
  //logger.debug("name patches:");
  //if (logger.canPrint(LogLevel.DEBUG))
  //  console.dir(patches.content.changes);
  //logger.debug("content patches:");
  //if (logger.canPrint(LogLevel.DEBUG))
  //  console.dir(patches.content.changes, { depth: 4 });

  // ~~~ Check prettier status before applying changes. Prompt confirmation. ~~~
  // ...

  // ~~~ Apply actions. ~~~

  input.close();
  process.exit(k_statusOk);
}

async function printPatches(
  patches: Patch.File,
  caseReplacements: CaseReplacementPairs,
  opts: RenameOptions
) {
  const msgs = [
    "\n" + (await createContentPatchDiff(patches.content, caseReplacements)),
    "\n" + (await createNamesPatchDiff(patches.names, caseReplacements)),
  ];
  const msg = msgs.reduce((s1, s2) => s1 + "\n\n" + s2);
  //const msg = "it's a\nPIZZA PIE";

  logger.info("Showing content patch diff...");
  (!opts.noPager && (await showPager(msg))) || logger.info(msg);
  //msgs.forEach((m) => logger.info(m));
}

async function promptToContinue(input: ReadlineInterface): Promise<boolean> {
  const answer = (await input.question(styleText("bold", "[yN]> ")))
    .trimStart()
    .toLowerCase();
  console.log("");
  if (!answer.startsWith("y")) {
    logger.info("Abort.");
    process.exit(k_statusError);
    return false;
  }
  return true;
}

function createNamesSummary(opts: RenameOptions): string {
  const namesTable = toMarkdownTable(
    [
      ["Case", "Old name", "New name"],
      ["Snake", opts.oldNameSnake, opts.newNameSnake],
      ["Kebab", opts.oldNameKebab, opts.newNameKebab],
      ["Pascal", opts.oldNamePascal, opts.newNamePascal],
      ["Title", opts.oldNameTitle, opts.newNameTitle],
    ],
    { padding: 1 }
  );

  if (opts.skipReview) {
    return `\n${styleText("bold", "Proposed name changes")}:\n\n${namesTable}\n\n'--${OptionName.SKIP_REVIEW}': Skipping confirmation...`;
  }

  return `\nPlease review the following ${styleText("bold", "proposed name changes")}:\n\n${namesTable}\n\nDoes this look correct? Type 'y' and press 'Enter' to continue, or 'n' to abort.`;
}

(async () => await renameProject())();
