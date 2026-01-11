import { describe, expect, test } from "@jest/globals";
import { render, screen, type Screen } from "@testing-library/react";

import { InternalLink } from "@/unnamed_project_web/common/components/link";

// eslint-disable-next-line jest/expect-expect
test("renders label", () => {
  const label = "Create new resource";
  render(<InternalLink href="#">{label}</InternalLink>);

  //globalThis.document.
  screen.getByText(label);
  //screen.getByRole("button", { name: label });
});
