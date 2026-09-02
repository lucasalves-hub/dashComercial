'use client';

import { useMemo } from 'react';
import PortalHeader from '../portal-header';

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const compacto = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
  notation: 'compact',
  compactDisplay: 'short',
});

function numero(valor: unknown) {
  if (typeof valor === 'number') return valor;
  return Number(String(valor ?? '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
}

function rotuloMes(valor: unknown) {
  const data = new Date(String(valor));
  if (Number.isNaN(data.getTime())) return String(valor || '—');
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })
    .format(data)
    .replace('.', '');
}

function Card({ titulo, valor, descricao, destaque }: { titulo: string; valor: string; descricao: string; destaque?: boolean }) {
  return <article className={destaque ? 'hot' : ''}><small>{titulo}</small><strong>{valor}</strong><span>{descricao}</span></article>;
}

export default function EntradasProjetadas({ dados, email, sair }: { dados: any; email: string; sair: () => Promise<void> }) {
  const projecao = dados.projecaoEntradas;

  const visao = useMemo(() => {
    const mensal = (projecao?.mensal || []).map((item: any) => ({
      ...item,
      valor: numero(item.valor),
    }));
    const maximo = Math.max(1, ...mensal.map((item: any) => item.valor));
    const porEmpresa = (projecao?.porEmpresa || []).map((item: any) => ({
      ...item,
      valor: numero(item.valor),
    }));
    return { mensal, maximo, porEmpresa };
  }, [projecao]);

  if (!projecao) {
    return <main>
      <PortalHeader titulo="Entradas projetadas" descricao="Projeção mensal de recebimentos comerciais." atual="entradas" email={email} sair={sair} />
      <section className="panel">
        <h2>Integração em preparação</h2>
        <p>A base de projeção está pronta na planilha. Falta publicar o retorno de entradas na API para exibir os indicadores aqui.</p>
      </section>
    </main>;
  }

  return <main>
    <PortalHeader titulo="Entradas projetadas" descricao="Fluxo futuro de recebimentos comerciais — FORMA e MED." atual="entradas" email={email} sair={sair} />

    <section className="toolbar">
      <span>{projecao.fonte || 'Projeção ativa de entradas'}</span>
      <small>Atualizado: {projecao.atualizadoEm || dados.atualizadoEm}</small>
    </section>

    <section className="cards">
      <Card titulo="ENTRADA DO MÊS" valor={brl.format(numero(projecao.totalMesAtual))} descricao="Faturamento bruto previsto no mês corrente" destaque />
      <Card titulo="PRÓXIMOS 12 MESES" valor={compacto.format(numero(projecao.totalDozeMeses))} descricao="Fee + imposto previstos no cronograma" />
      <Card titulo="TURMAS ATIVAS" valor={String(numero(projecao.quantidadeTurmas))} descricao="Turmas com recebimento vigente ou futuro" />
      <Card titulo="INÍCIOS E ENCERRAMENTOS" valor={`${numero(projecao.iniciosFee)} / ${numero(projecao.encerramentosFee)}`} descricao="Marcos previstos no horizonte da projeção" />
    </section>

    <section className="grid">
      <article>
        <h2>Curva de entradas</h2>
        <p>Entradas brutas projetadas: fee mais imposto. O imposto não representa receita líquida da empresa.</p>
        <div className="fee-bars">
          {visao.mensal.slice(0, 12).map((item: any) => <div className="fee-bar" key={item.competencia || item.mes}>
            <i style={{ height: `${item.valor / visao.maximo * 170}px` }} />
            <small>{rotuloMes(item.competencia || item.mes)}</small>
          </div>)}
        </div>
      </article>
      <article>
        <h2>Composição por empresa</h2>
        <dl>
          {visao.porEmpresa.map((item: any) => <div key={item.empresa} style={{ display: 'contents' }}>
            <dt>{item.empresa}</dt><dd>{brl.format(item.valor)}</dd>
          </div>)}
          <dt>Base considerada</dt><dd>FORMA e MED</dd>
        </dl>
      </article>
    </section>

    <section className="panel">
      <h2>Calendário mensal de entradas</h2>
      <p>O detalhamento considera somente contratos ativos ou futuros; contratos encerrados permanecem nas bases de auditoria.</p>
      <div className="table-wrap"><table>
        <thead><tr><th>Competência</th><th style={{ textAlign: 'right' }}>Entradas projetadas</th><th style={{ textAlign: 'right' }}>Turmas</th><th style={{ textAlign: 'right' }}>Inícios de fee</th><th style={{ textAlign: 'right' }}>Encerramentos</th></tr></thead>
        <tbody>{visao.mensal.map((item: any) => <tr key={item.competencia || item.mes}>
          <td>{rotuloMes(item.competencia || item.mes)}</td>
          <td style={{ textAlign: 'right' }}><b>{brl.format(item.valor)}</b></td>
          <td style={{ textAlign: 'right' }}>{numero(item.turmas)}</td>
          <td style={{ textAlign: 'right' }}>{numero(item.iniciosFee)}</td>
          <td style={{ textAlign: 'right' }}>{numero(item.encerramentosFee)}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </main>;
}
