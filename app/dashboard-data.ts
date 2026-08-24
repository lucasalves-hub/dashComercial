/** Dados compartilhados da planilha, reutilizados por todas as páginas do portal. */
export async function obterDadosDashboard() {
  const url = process.env.DASHBOARD_DATA_URL;
  const key = process.env.DASHBOARD_API_KEY;
  if (!url || !key) throw new Error('Integração com a base não configurada.');

  const resposta = await fetch(`${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`, {
    next: { revalidate: 300 },
  });
  const dados = await resposta.json();
  if (!resposta.ok || dados.error) throw new Error(dados.error || 'Não foi possível ler a base auditada.');
  return dados;
}
