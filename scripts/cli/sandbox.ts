import { basename } from "node:path";
import {
  createInterface as createReadlineInterface,
  type Interface as ReadlineInterface,
} from "node:readline/promises";
import { stdin, stdout } from "node:process";
//import { styleText } from "node:util";

import { k_appName, k_scriptExtension } from "@/scripts/common/constants";
import {
  Logger,
  LogLevel,
  type StyleTextFormat,
} from "@/scripts/common/logging";
//import { showPager } from "@/scripts/common/paging";
//import { createPromptPrefix, PromptDecoration } from "@/scripts/common/prompts";
//import { wrapTextSmart } from "@/scripts/common/strings";

const k_statusOk = 0;
const k_statusError = 1;

const logger = new Logger({
  app: k_appName,
  file: basename(__filename, k_scriptExtension),
  level: LogLevel.DEBUG,
});

//const k_maxGraphemesPerLine = 59;

// ~~~ Entry point. ~~~
(async () => await main())();

export async function main() {
  // ~~~ Setup. ~~~
  const input: ReadlineInterface = createReadlineInterface({
    input: stdin,
    output: stdout,
  });

  console.log("~ Sandbox ~");
  console.log("===========");
  console.log("");
  console.log("Hello, World!");

  // ~~~ Cleanup. ~~~
  input.close();
  process.exit(k_statusOk);
}
