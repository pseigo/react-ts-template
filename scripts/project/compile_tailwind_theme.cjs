const resolveTailwindConfig = require("tailwindcss/resolveConfig.js");
const fs = require("node:fs");

const tailwindConfig = require("../tailwind.config.cjs");

const outFilePath = "../src/unnamed_project/common/config/tailwind/compiled_theme.json";
const resolvedTailwindConfig = resolveTailwindConfig(tailwindConfig);

fs.writeFileSync(outFilePath, JSON.stringify(resolvedTailwindConfig["theme"]), {
  encoding: "utf8",
  mode: 0o644, // rw-r--r--
  flag: "w",
  flush: true,
});
