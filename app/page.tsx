import { auth, signOut } from '../auth';
import Painel from './painel';
import { obterDadosDashboard } from './dashboard-data';

export default async function Page() {
  const dados = await obterDadosDashboard();
  const session = await auth();
  return <Painel dados={dados} email={session?.user?.email || ''} sair={async () => { 'use server'; await signOut({ redirectTo: '/' }); }} />;
}
