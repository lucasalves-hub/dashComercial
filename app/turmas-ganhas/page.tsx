import { auth, signOut } from '../../auth';
import TurmasGanhas from './turmas-ganhas';
import { obterDadosDashboard } from '../dashboard-data';

export default async function Page() {
  const dados = await obterDadosDashboard();
  const session = await auth();
  return <TurmasGanhas dados={dados} email={session?.user?.email || ''} sair={async () => { 'use server'; await signOut({ redirectTo: '/' }); }} />;
}
