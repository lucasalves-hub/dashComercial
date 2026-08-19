import "./globals.css";

export const metadata = { title: "Portal Comercial | Toy Formaturas", description: "Visão comercial e financeira auditável" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
