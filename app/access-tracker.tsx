'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** Registra uma visualização autenticada sem interromper a navegação do usuário. */
export default function AccessTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    void fetch('/api/access-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rota: pathname }),
      keepalive: true,
    }).catch(() => {
      // A auditoria não deve impedir o acesso ao portal se o destino estiver indisponível.
    });
  }, [pathname]);

  return null;
}
