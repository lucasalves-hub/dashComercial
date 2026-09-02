import { auth, signOut } from '../../auth';
import { obterDadosDashboard } from '../dashboard-data';
import EntradasProjetadas from './entradas-projetadas';

export default async function Page() {
  const [dados, session] = await Promise.all([obterDadosDashboard(), auth()]);

  return (
    <EntradasProjetadas
      dados={dados}
      email={session?.user?.email || ''}
      sair={async () => {
        'use server';
        await signOut({ redirectTo: '/' });
      }}
    />
  );
}
