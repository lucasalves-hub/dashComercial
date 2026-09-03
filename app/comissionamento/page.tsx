import { auth, signOut } from '../../auth';
import { obterDadosDashboard } from '../dashboard-data';
import Comissionamento from './comissionamento';

export default async function Page() {
  const [dados, session] = await Promise.all([obterDadosDashboard(), auth()]);
  return <Comissionamento dados={dados} email={session?.user?.email || ''} sair={async () => { 'use server'; await signOut({ redirectTo: '/' }); }} />;
}
