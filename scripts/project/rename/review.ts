/*
 * react-ts-template/scripts/project/rename/review.ts
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

import { basename } from "node:path";
import type { Interface as ReadlineInterface } from "node:readline/promises";
import { styleText } from "node:util";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import { Logger, LogLevel } from "@/scripts/common/logging";

import type { RenameOptions } from "./options";
import type { CaseReplacementPairs, Patch } from "./patches";
import { createPromptPrefix } from "./prompts";

export enum Command {
  QUIT = 1,
  HELP = 2,
  DIFF = 3,
  RENAMES = 4,
  SUMMARY = 5,
  APPLY = 6,
}

interface CommandInfo {
  type: Command;
  description: string;
}

const k_commands: CommandInfo[] = [
  {
    type: Command.QUIT,
    description: "Abort.",
  },
  {
    type: Command.HELP,
    description: "Learn about this menu.",
  },
  {
    type: Command.DIFF,
    description: "Show proposed file changes.",
  },
  {
    type: Command.RENAMES,
    description: "Show proposed file and directory renames.",
  },
  {
    type: Command.SUMMARY,
    description: "Show compact summary of changes and renames.",
  },
  {
    type: Command.APPLY,
    description: "Continue and apply changes.",
  },
].sort((left, right) => left.type - right.type);

const k_commandListStr: string = createCommandListStr();

function createCommandListStr(): string {
  const commandListItemInitial = (c: string): string =>
    styleText(["bold", "blue"], c);
  const commandListItem = (item: string): string =>
    `${commandListItemInitial(item.charAt(0))}${item.slice(1)}`;

  const commandListItemsStr: string = k_commands.reduce(
    (acc: string, ci: CommandInfo) =>
      `${acc}\n  ${ci.type}: ${commandListItem(Command[ci.type].toLowerCase())} \t(${ci.description})`,
    ""
  );
  const commandListStr =
    `${styleText("bold", "commands")}:` + commandListItemsStr;
  return commandListStr;
}

const logger = new Logger({
  app: k_appName,
  file: basename(__filename, k_scriptExtension),
  level: LogLevel.DEBUG,
});

/**
 * Prompts the user until a valid, unambiguous selection is received and
 * then returns the corresponding {@link Command}.
 */
export async function promptInteractiveReviewCommand(
  patches: Patch.File,
  caseReplacements: CaseReplacementPairs,
  opts: RenameOptions,
  input: ReadlineInterface
): Promise<Command> {
  console.log(k_commandListStr);

  while (true) {
    const [command, helpMsg] = await promptCommand(input);

    if (command != null) {
      return command;
    }

    console.log(helpMsg);
  }
}

/**
 * Reads a command selection from stdin and returns the matching `Command`,
 * otherwise returns `null` if the input cannot be understood as exactly one
 * command unambiguously.
 *
 * If the first returned value is `null`, the second contains a string with
 * error or hint feedback for the user. Otherwise, the second value is an empty
 * string (`""`).
 */
async function promptCommand(
  input: ReadlineInterface
): Promise<[Command | null, string]> {
  const promptPrefix = createPromptPrefix("command");
  const answer = (await input.question(promptPrefix)).trim().toLowerCase();

  if (k_commands.length === 0) {
    return [null, createInvalidCommandMsg(answer)];
  }

  // Input is a number?
  const maybeInt = Number.parseInt(answer);
  if (!Number.isNaN(maybeInt)) {
    if (
      maybeInt >= k_commands[0]!.type &&
      maybeInt <= k_commands[k_commands.length - 1]!.type
    ) {
      return [maybeInt, ""];
    }
    return [null, createInvalidCommandMsg(answer)]; // range error
  }

  // Input is a command name?
  const matches = k_commands.filter((command: CommandInfo) =>
    Command[command.type].toLowerCase().startsWith(answer)
  );

  if (matches.length === 1) {
    return [matches.at(0)!.type, ""];
  }

  // No match or ambiguous.
  return [null, createAmbiguousCommandMsg(answer)];
}

const createInvalidCommandMsg = (answer: string): string =>
  `"${answer}" is not a valid command.\nHint: Type a command's number or start spelling it out, then press Enter. (Type "${Command.QUIT}" or "${Command[Command.QUIT][0]!.toLowerCase()}" to ${Command[Command.QUIT].toLowerCase()}.)`;

const createAmbiguousCommandMsg = (answer: string): string =>
  `"${answer}" is ambiguous because it matches more than one command.\nHint: Try fully spelling out the command.)`;
