import { auth, signOut } from '../../auth';
import { obterDadosDashboard } from '../dashboard-data';
import Pipeline from './pipeline';

export default async function Page() {
  const dados = await obterDadosDashboard();
  const session = await auth();
  return <Pipeline dados={dados} email={session?.user?.email || ''} sair={async () => { 'use server'; await signOut({ redirectTo: '/' }); }} />;
}
