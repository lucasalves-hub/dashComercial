import { auth } from '../../../auth';

const dominioToy = (process.env.ALLOWED_GOOGLE_DOMAIN || 'grupotoy.com.br').toLowerCase();

export async function POST(request: Request) {
  const sessao = await auth();
  const email = sessao?.user?.email?.trim().toLowerCase();

  if (!email || !email.endsWith(`@${dominioToy}`)) {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const corpo: unknown = await request.json().catch(() => ({}));
  const rotaRecebida = typeof corpo === 'object' && corpo !== null && 'rota' in corpo
    ? (corpo as { rota?: unknown }).rota
    : '';
  const rota = String(rotaRecebida || '/').slice(0, 180);
  const urlDestino = process.env.ACCESS_LOG_URL;
  const chave = process.env.ACCESS_LOG_KEY;

  if (!urlDestino || !chave) {
    return Response.json({ registrado: false, motivo: 'Auditoria não configurada.' });
  }

  try {
    const resposta = await fetch(urlDestino, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: chave,
        email,
        rota,
        evento: 'VISUALIZACAO',
        userAgent: request.headers.get('user-agent') || '',
      }),
      cache: 'no-store',
    });

    return Response.json({ registrado: resposta.ok });
  } catch {
    return Response.json({ registrado: false });
  }
}
