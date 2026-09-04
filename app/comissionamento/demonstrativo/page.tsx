import { auth } from '../../../auth';
import { obterDadosDashboard } from '../../dashboard-data';
import Demonstrativo from './demonstrativo';

export default async function Page({ searchParams }: { searchParams: Promise<{ colaborador?: string; competencia?: string }> }) {
  const [dados, session, parametros] = await Promise.all([obterDadosDashboard(), auth(), searchParams]);
  return <Demonstrativo dados={dados} email={session?.user?.email || ''} colaboradorInicial={parametros.colaborador || ''} competenciaInicial={parametros.competencia || ''} />;
}
