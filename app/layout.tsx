import type { Metadata, Viewport } from 'next';
import "./globals.css";
import "./foundation.css";

export const metadata: Metadata = {
  applicationName: 'Portal Comercial',
  title: {
    default: 'Portal Comercial | Toy Formaturas',
    template: '%s | Portal Comercial'
  },
  description: 'Visão comercial e financeira auditável da Toy Formaturas.',
  manifest: '/manifest.webmanifest'
};

export const viewport: Viewport = {
  themeColor: '#3a1247'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
