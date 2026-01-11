import { describe, expect, test } from "@jest/globals";

import { example } from "@/unnamed_project/example";

test("example", () => {
  expect(123).toBe(123);
  expect(example()).toStrictEqual("Hello, World!");
});
