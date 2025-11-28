/*
 * react-ts-template/scripts/project/rename/help.ts
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

import { parseArgs, type ParseArgsOptionsConfig } from "node:util";

import { k_shortOption, OptionName, type RenameOptions } from "./options";

const k_parseArgsHelpOptions: ParseArgsOptionsConfig = {
  [OptionName.HELP]: {
    type: "boolean",
    short: k_shortOption[OptionName.HELP],
  },
};

export function hasHelpOption(rawArgs: string[]): boolean {
  let parsed: ReturnType<typeof parseArgs> | null = null;
  try {
    parsed = parseArgs({
      args: rawArgs,
      options: k_parseArgsHelpOptions,
      strict: false,
    });
  } catch (error: unknown) {
    throw new Error("Argument error.", { cause: error });
  }
  return parsed.values[OptionName.HELP] === true;
}

export const renderHelpInfo = (params: { runCommand: string }): string => `
Usage: ${params.runCommand}
  [-${k_shortOption[OptionName.HELP]} | --${OptionName.HELP}] [-${k_shortOption[OptionName.SKIP_DIRTY_CHECK]} | --${OptionName.SKIP_DIRTY_CHECK}] [-${k_shortOption[OptionName.SKIP_REVIEW]} | --${OptionName.SKIP_REVIEW}]
  [--${OptionName.OLD_NAME_SNAKE} <old_name>]
  [--${OptionName.OLD_NAME_KEBAB} <old-name>]
  [--${OptionName.OLD_NAME_PASCAL} <OldName>]
  [--${OptionName.OLD_NAME_TITLE} <"Old Name">]
  [--${OptionName.NEW_NAME_SNAKE} <new_name>]
  [--${OptionName.NEW_NAME_KEBAB} <new-name>]
  [--${OptionName.NEW_NAME_PASCAL} <NewName>]
  [--${OptionName.NEW_NAME_TITLE} <"New Name">]

Recursively renames all files and occurrences of the current ("old") project
name with a new project name.

SPECIFIYING CASE
    This program searches for several versions of the name in different
    cases:

    |    Case     |  Example  |
    |-------------|-----------|
    | Camel case  | sql_utils |
    | Kebab case  | sql-utils |
    | Pascal case | SqlUtils  |
    | Title case  | SQL Utils |

    Each case can be specified using its corresponding option (see OPTIONS).

CASE INFERENCE
    - Camel case is inferred from Kebab, and vice versa, if one is not
      provided.  At least one is required.

    - Pascal case is inferred from Title, and vice versa, if one is not
      provided.  At least one is required.

      - Unsurprising inference behaviour:
        - If only Pascal case is provided as 'SqlUtils', Title case will be
          inferred as 'Sql Utils'.

        - If only Title case is provided as 'SQL Utils', Pascal case will be
          inferred as 'SQLUtils'.

      - Surprising inference behaviour (i.e., when you should specify both):
        - If only Pascal case is provided as 'SQLUtils', Title case will be
          inferred as 'S Q L Utils'. You should also specify Title case as
          'SQL Utils'.

        - If only Title case is provided as 'SQL Utils', Pascal case will be
          inferred as 'SQLUtils'. If you prefer acronyms to be capitalized
          rather than uppercased, you should also specify Pascal case as
          'SqlUtils'.

DEFAULT OLD NAME
    If no old name is provided, it defaults to 'unnamed_project',
    'unnamed-project', 'UnnamedProject', and 'Unnamed Project' for
    Camel, Kebab, Pascal, and Title case respectively.

INTERACTIVE CONFIRMATION
    Unless \`-${k_shortOption[OptionName.SKIP_DIRTY_CHECK]}\` or \`-${k_shortOption[OptionName.SKIP_REVIEW]}\` are provided, the program prompts for confirmation from
    stdin if the git work tree has uncommitted changes, and gives the user a
    chance to review and confirm the changes before they are applied.

    If both \`-${k_shortOption[OptionName.SKIP_DIRTY_CHECK]}\` _and_ \`-${k_shortOption[OptionName.SKIP_REVIEW]}\` are provided, the program effectively runs in
    non-interactive mode and will make changes WITHOUT confirmation.
    Be careful!

OPTIONS
    -${k_shortOption[OptionName.HELP]}, --${OptionName.HELP}
      Shows this help screen.

    --${OptionName.OLD_NAME_SNAKE} old_name
      Old project name in Snake case.
      Can be inferred from Kebab case.

    --${OptionName.OLD_NAME_KEBAB} old-name
      Old project name in Kebab case.
      Can be inferred from Snake case.

    --${OptionName.OLD_NAME_PASCAL} OldName
      Old project name in Pascal case.
      Can be inferred from Title case (see CASE INFERENCE).

    --${OptionName.OLD_NAME_TITLE} "Old Name"
      Old project name in Title case.
      Can be inferred from Pascal case (see CASE INFERENCE).

    --${OptionName.NEW_NAME_SNAKE} new_name
      New project name in Snake case.
      Can be inferred from Kebab case.

    --${OptionName.NEW_NAME_KEBAB} new-name
      New project name in Kebab case.
      Can be inferred from Snake case.

    --${OptionName.NEW_NAME_PASCAL} NewName
      New project name in Pascal case.
      Can be inferred from Title case (see CASE INFERENCE).

    --${OptionName.NEW_NAME_TITLE} "New Name"
      New project name in Title case.
      Can be inferred from Pascal case (see CASE INFERENCE).

    -${k_shortOption[OptionName.SKIP_DIRTY_CHECK]}, --${OptionName.SKIP_DIRTY_CHECK}
      Continues without asking when the git work tree has uncommitted changes.
      (Be careful!)

    -${k_shortOption[OptionName.SKIP_REVIEW]}, --${OptionName.SKIP_REVIEW}
      Continues without presenting the proposed changes or asking for approval.
      (Be careful!)

EXAMPLES
    # (1) Initial rename (old name defaults to 'unnamed_project').
    ${params.runCommand} \\
        --${OptionName.NEW_NAME_SNAKE} first_project_name \\
        --${OptionName.NEW_NAME_PASCAL} FirstProjectName

    # (2) Old name is no longer 'unnamed_project'.
    ${params.runCommand} \\
        --${OptionName.OLD_NAME_SNAKE} first_project_name \\
        --${OptionName.OLD_NAME_PASCAL} FirstProjectName \\
        --${OptionName.NEW_NAME_SNAKE} second_project_name \\
        --${OptionName.NEW_NAME_PASCAL} SecondProjectName

    # (3) Acronym is capitalized in Pascal case but uppercased in Title case.
    ${params.runCommand} \\
        --${OptionName.OLD_NAME_SNAKE} second_project_name \\
        --${OptionName.OLD_NAME_PASCAL} SecondProjectName
        --${OptionName.NEW_NAME_SNAKE} sql_utils \\
        --${OptionName.NEW_NAME_PASCAL} SqlUtils \\
        --${OptionName.NEW_NAME_TITLE} "SQL Utils"

    # (4) Definite article ("the") is capitalized in Pascal case but downcased
    #  in Title case.
    ${params.runCommand} \\
        --${OptionName.OLD_NAME_SNAKE} sql_utils \\
        --${OptionName.OLD_NAME_PASCAL} SqlUtils \\
        --${OptionName.OLD_NAME_TITLE} "SQL Utils" \\
        --${OptionName.NEW_NAME_SNAKE} for_the_future \\
        --${OptionName.NEW_NAME_PASCAL} ForTheFuture \\
        --${OptionName.NEW_NAME_TITLE} "For the Future"`;
