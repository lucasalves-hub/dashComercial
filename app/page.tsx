import { auth, signOut } from "../auth";

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const gastos2025 = [47, 42, 55, 51, 48, 43, 39, 45, 50, 46, 51, 54];
const gastos2026 = [33, 28, 36, 31, 38, 30, 34, 32, 28, 0, 0, 0];
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Card({ label, value, note, tone = "" }: { label: string; value: string; note: string; tone?: string }) {
  return <section className={`card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></section>;
}

export default async function Dashboard() {
  const session = await auth();
  const realizado = gastos2026.reduce((total, valor) => total + valor, 0) * 1000;
  const anoAnterior = gastos2025.slice(0, 9).reduce((total, valor) => total + valor, 0) * 1000;
  const verba = 420000;
  const max = Math.max(...gastos2025, ...gastos2026);

  return <main>
    <header>
      <div><p className="eyebrow">TOY FORMATURAS · CONTROLADORIA</p><h1>Custos comerciais</h1><p className="subtitle">Visão gerencial com rastreabilidade para a base auditada.</p></div>
      <div className="user"><span>{session?.user?.email}</span><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><button>Sair</button></form></div>
    </header>

    <section className="filters"><div><b>Período</b><span>2026 · janeiro a setembro</span></div><div><b>Fonte</b><span>Planilha de Auditoria</span></div><button className="update">Atualizar dados</button></section>

    <section className="cards">
      <Card label="Realizado 2026" value={moeda.format(realizado)} note="Base auditada" tone="primary" />
      <Card label="Verba comercial anual" value={moeda.format(verba)} note={`${Math.round(realizado / verba * 100)}% consumido`} />
      <Card label="Saldo disponível" value={moeda.format(verba - realizado)} note="Até o limite anual" />
      <Card label="Mesmo período 2025" value={moeda.format(anoAnterior)} note={`${Math.round((realizado / anoAnterior - 1) * 100)}% vs. ano anterior`} />
    </section>

    <section className="grid">
      <article className="panel wide"><div className="panelHead"><div><h2>Gastos por mês</h2><p>Comparativo acumulado por competência</p></div><div className="legend"><i className="blue" />2026 <i className="gray" />2025</div></div>
        <div className="chart">{meses.map((mes, index) => <div className="barGroup" key={mes}><div className="bars"><i className="bar old" style={{ height: `${gastos2025[index] / max * 150}px` }} /><i className="bar current" style={{ height: `${gastos2026[index] / max * 150}px` }} /></div><span>{mes}</span></div>)}</div>
      </article>
      <article className="panel"><div className="panelHead"><div><h2>Projeção anual</h2><p>Ritmo atual de gasto</p></div></div><div className="projection"><strong>{moeda.format(Math.round(realizado / 9 * 12))}</strong><span>projeção para 2026</span><div className="progress"><i style={{ width: `${Math.min(100, realizado / 9 * 12 / verba * 100)}%` }} /></div><small>Verba anual: {moeda.format(verba)}</small></div></article>
      <article className="panel"><div className="panelHead"><div><h2>Auditoria</h2><p>Status da conciliação</p></div></div><ul className="audit"><li><i />Dados de 2026 atualizados</li><li><i />Turmas agrupadas sem duplicidade</li><li><i />Base de 2025 preservada</li></ul></article>
    </section>

    <section className="panel tablePanel"><div className="panelHead"><div><h2>Maiores custos por turma</h2><p>Origem: Custo Agrupado por Turma — Auditoria</p></div><button className="link">Ver todas as turmas</button></div><table><thead><tr><th>Turma</th><th>2025</th><th>2026</th><th>Total</th></tr></thead><tbody><tr><td>Dados sincronizados após conexão com a planilha</td><td>—</td><td>—</td><td>—</td></tr></tbody></table></section>
    <footer>Ambiente restrito · Dados financeiros auditáveis · Última visualização: agora</footer>
  </main>;
}
