import { useMemo } from "react";
import { Route as WouterRoute, type PathPattern } from "wouter";

import { AppLayout } from "@/unnamed_project/layouts/app";

interface RouteProps {
  children: React.ReactElement;
  path?: PathPattern;
  /** Must render its children. Set to `null` or omit to use no layout. */
  Layout?: React.ComponentType<React.PropsWithChildren> | null;
}

export function Route({ children, path, Layout }: RouteProps): React.ReactNode {
  const ResolvedLayout = useMemo(() => {
    if (Layout == null) {
      return null;
    }
    return AppLayout;
  }, [Layout]);

  return (
    <WouterRoute path={path ?? "*"}>
      {ResolvedLayout != null ? (
        <ResolvedLayout>{children}</ResolvedLayout>
      ) : (
        children
      )}
    </WouterRoute>
  );
}
//asdfasdf
