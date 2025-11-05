import { clsx } from "clsx";

import { InternalLink } from "@/unnamed_project/common/components/link";

export function Header() {
  return (
    <header className={clsx()}>
      <nav className="max-w-[900px] mx-auto">
        <InternalLink href="/" unstyled className="text-xl">
          Home
        </InternalLink>
      </nav>
    </header>
  );
}
