import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Portal Comercial | Toy Formaturas',
    short_name: 'Portal Comercial',
    description: 'Portal comercial e financeiro da Toy Formaturas.',
    display: 'standalone',
    background_color: '#3a1247',
    theme_color: '#3a1247',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  };
}
