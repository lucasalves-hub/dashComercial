import "./globals.css";

export const metadata = { title: "Custos Comerciais | Toy Formaturas", description: "Painel financeiro auditável" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
