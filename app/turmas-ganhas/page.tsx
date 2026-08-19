import { auth, signOut } from '../../auth';
import TurmasGanhas from './turmas-ganhas';

export default async function Page() {
  const url = process.env.DASHBOARD_DATA_URL;
  const key = process.env.DASHBOARD_API_KEY;
  if (!url || !key) throw new Error('Integração com a base não configurada.');
  const resposta = await fetch(`${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`, { cache: 'no-store' });
  const dados = await resposta.json();
  if (!resposta.ok || dados.error) throw new Error(dados.error || 'Não foi possível ler a base auditada.');
  const session = await auth();
  return <TurmasGanhas dados={dados} email={session?.user?.email || ''} sair={async () => { 'use server'; await signOut({ redirectTo: '/' }); }} />;
}
