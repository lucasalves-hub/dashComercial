import { auth } from '../../../auth';
import { obterDadosDashboard } from '../../dashboard-data';
import RelatorioCfo from './relatorio-cfo';

export default async function Page() {
  const [dados, session] = await Promise.all([obterDadosDashboard(), auth()]);
  return <RelatorioCfo dados={dados} email={session?.user?.email || ''} />;
}
