import "./globals.css";

export const metadata = { title: "Custos Comerciais | Toy Formaturas", description: "Painel financeiro auditável" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><nav style={{ maxWidth: 1280, margin: '14px auto -14px', padding: '0 30px', display: 'flex', gap: 18 }}><a href="/">Custos comerciais</a><a href="/turmas-ganhas">Turmas ganhas</a></nav>{children}</body></html>;
}
