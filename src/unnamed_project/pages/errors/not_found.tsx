import { useLocation } from "wouter";

import {
  useDocumentTitle,
  toDocumentTitle,
} from "@/unnamed_project/common/hooks/document_title";

export function NotFoundErrorPage() {
  const [location, _navigate] = useLocation();
  useDocumentTitle(toDocumentTitle(["Not Found", "Error"]));

  return (
    <div>
      <h1 className="text-3xl mb-4">Not Found (404)</h1>
    </div>
  );
}
