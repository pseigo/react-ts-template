import { clsx, type ClassValue as ClsxClassValue } from "clsx";

export function LandingPage() {
  return (
    <main data-testid="main__content-container" className={clsx("p-touch")}>
      <h1 className="text-3xl">Landing Page</h1>
      <p>Lorem ipsum delor...</p>
    </main>
  );
}
