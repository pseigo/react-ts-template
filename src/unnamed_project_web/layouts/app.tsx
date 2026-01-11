import { Header } from "./app/header";
import { Footer } from "./app/footer";

/*
 * @param {object} props
 * @param {React.ReactElement} props.children
 */

export function AppLayout({ children }: React.PropsWithChildren) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
