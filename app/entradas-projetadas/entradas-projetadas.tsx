'use client';

import { useMemo, useState } from 'react';
import PortalHeader from '../portal-header';

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

function numero(valor: unknown) {
  if (typeof valor === 'number') return valor;

  const texto = String(valor ?? '')
    .replace('R$', '')
    .trim();

  if (!texto) return 0;

  if (texto.includes(',') && texto.includes('.')) {
    return Number(texto.replace(/\./g, '').replace(',', '.')) || 0;
  }

  return Number(texto.replace(',', '.')) || 0;
}

function rotuloMes(valor: unknown) {
  const texto = String(valor || '');
  const encontrado = texto.match(/^(\d{4})-(\d{2})$/);

  if (!encontrado) return texto || '—';

  const ano = Number(encontrado[1]);
  const mes = Number(encontrado[2]) - 1;

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: '2-digit',
  })
    .format(new Date(ano, mes, 1))
    .replace('.', '');
}

function Card({
  titulo,
  valor,
  descricao,
  destaque,
}: {
  titulo: string;
  valor: string;
  descricao: string;
  destaque?: boolean;
}) {
  return (
    <article className={destaque ? 'hot' : ''}>
      <small>{titulo}</small>
      <strong>{valor}</strong>
      <span>{descricao}</span>
    </article>
  );
}

export default function EntradasProjetadas({
  dados,
  email,
  sair,
}: {
  dados: any;
  email: string;
  sair: () => Promise<void>;
}) {
  const projecao = dados.projecaoEntradas;
  const [horizonte, setHorizonte] = useState<'12' | 'todos'>('12');

  const visao = useMemo(() => {
    const mensal = (projecao?.mensal || []).map((item: any) => ({
      ...item,
      valor: numero(item.valor),
      forma: numero(item.forma),
      med: numero(item.med),
      quantidadeTurmas: numero(item.quantidadeTurmas),
      quantidadeLancamentos: numero(item.quantidadeLancamentos),
    }));

    const porEmpresa = Object.entries(projecao?.porEmpresa || {}).map(
      ([empresa, valor]) => ({
        empresa,
        valor: numero(valor),
      })
    );

    const maximo = Math.max(
      1,
      ...mensal.map((item: any) => item.valor)
    );

    return {
      mensal,
      porEmpresa,
      maximo,
      encerramentos: projecao?.encerramentosProximos || { quantidadeTurmas: 0, valorMensal: 0, turmas: [] },
      inicios: projecao?.iniciosProximos || { quantidadeTurmas: 0, valorMensal: 0, turmas: [] },
    };
  }, [projecao]);

  if (!projecao) {
    return (
      <main>
        <PortalHeader
          titulo="Entradas projetadas"
          descricao="Projeção mensal de recebimentos comerciais."
          atual="entradas"
          email={email}
          sair={sair}
          referencia="Projeção ativa de entradas"
          atualizadoEm={dados.atualizadoEm}
        />

        <section className="panel">
          <h2>Integração em preparação</h2>
          <p>
            A base de projeção está pronta na planilha. Falta publicar o retorno
            de entradas na API para exibir os indicadores aqui.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <PortalHeader
        titulo="Entradas projetadas"
        descricao="Fluxo futuro de recebimentos comerciais — FORMA e MED."
        atual="entradas"
        email={email}
        sair={sair}
        referencia={`Competência inicial ${rotuloMes(visao.mensal[0]?.competencia)}`}
        atualizadoEm={projecao.atualizadoEm || dados.atualizadoEm}
      />

      <section className="toolbar">
        <span>{projecao.fonte || 'Projeção ativa de entradas'}</span>
      </section>

      {(numero(visao.encerramentos.quantidadeTurmas) > 0 || numero(visao.inicios.quantidadeTurmas) > 0) && <section className="grid" style={{ gridTemplateColumns: numero(visao.inicios.quantidadeTurmas) > 0 && numero(visao.encerramentos.quantidadeTurmas) > 0 ? '1fr 1fr' : '1fr' }}>
      {numero(visao.inicios.quantidadeTurmas) > 0 && (
        <article style={{ borderColor: '#bfe4d3', background: '#f4fcf7' }}>
          <h2 style={{ color: '#087a53' }}>Entrada prevista: turmas iniciando nos próximos 60 dias</h2>
          <p>{visao.inicios.quantidadeTurmas} turmas passam a gerar aproximadamente {brl.format(numero(visao.inicios.valorMensal))} por mês quando o Fee iniciar.</p>
        </article>
      )}
      {numero(visao.encerramentos.quantidadeTurmas) > 0 && (
        <article style={{ borderColor: '#f0c9c9', background: '#fff8f8' }}>
          <h2 style={{ color: '#a13b3b' }}>Atenção: turmas encerrando nos próximos 60 dias</h2>
          <p>{visao.encerramentos.quantidadeTurmas} turmas deixam de gerar aproximadamente {brl.format(numero(visao.encerramentos.valorMensal))} por mês após o encerramento do Fee.</p>
        </article>
      )}
      </section>}

      <section className="cards">
        <Card
          titulo="ENTRADA DO MÊS"
          valor={brl.format(numero(projecao.totalMesAtual))}
          descricao="Entradas brutas previstas no mês corrente"
          destaque
        />

        <Card
          titulo="PRÓXIMOS 12 MESES"
          valor={brl.format(numero(projecao.totalProximos12Meses))}
          descricao="Fee + imposto previstos no cronograma"
        />

        <Card
          titulo="TURMAS ATIVAS"
          valor={String(numero(projecao.quantidadeTurmas))}
          descricao="Turmas com recebimento vigente ou futuro"
        />

        <Card
          titulo="PARCELAS ATIVAS"
          valor={String(numero(projecao.quantidadeLancamentos))}
          descricao="Parcelas previstas em todo o cronograma"
        />
      </section>

      <section className="grid">
        <article>
          <h2>Curva de entradas</h2>
          <p>
            Entradas brutas projetadas: Fee mais imposto. Roxo representa FORMA e verde representa MED.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, margin: '-8px 0 8px' }}>
            <button type="button" onClick={() => setHorizonte('12')} style={{ border: horizonte === '12' ? '1px solid #8127a6' : '1px solid #ded3e2', background: horizonte === '12' ? '#f3e8f7' : '#fff', borderRadius: 7, padding: '5px 8px', cursor: 'pointer' }}>12 meses</button>
            <button type="button" onClick={() => setHorizonte('todos')} style={{ border: horizonte === 'todos' ? '1px solid #8127a6' : '1px solid #ded3e2', background: horizonte === 'todos' ? '#f3e8f7' : '#fff', borderRadius: 7, padding: '5px 8px', cursor: 'pointer' }}>Cronograma completo</button>
          </div>

          <div style={{ overflowX: 'auto' }}><div className="fee-bars" style={{ minWidth: horizonte === 'todos' ? `${visao.mensal.length * 38}px` : undefined }}>
            {(horizonte === '12' ? visao.mensal.slice(0, 12) : visao.mensal).map((item: any) => (
              <div
                className="fee-bar"
                key={item.competencia}
              >
                <div style={{ height: 170, display: 'flex', alignItems: 'end', justifyContent: 'center', gap: 3 }}>
                  <i style={{ height: `${(item.forma / visao.maximo) * 170}px`, background: 'linear-gradient(#c65ae0,#7a249c)', width: 12 }} title={`FORMA: ${brl.format(item.forma)}`} />
                  <i style={{ height: `${(item.med / visao.maximo) * 170}px`, background: 'linear-gradient(#35b981,#087a53)', width: 12 }} title={`MED: ${brl.format(item.med)}`} />
                </div>
                <small>{rotuloMes(item.competencia)}</small>
              </div>
            ))}
          </div></div>
        </article>

        <article>
          <h2>Composição por empresa</h2>
          {visao.porEmpresa.map((item: any) => (
            <div key={item.empresa} style={{ margin: '18px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}><b>{item.empresa}</b><b>{brl.format(item.valor)}</b></div>
              <div style={{ height: 12, background: '#eee7f0', borderRadius: 99, overflow: 'hidden' }}><i style={{ display: 'block', height: '100%', width: `${(item.valor / Math.max(1, visao.porEmpresa.reduce((total: number, empresa: any) => total + empresa.valor, 0))) * 100}%`, background: item.empresa === 'FORMA' ? 'linear-gradient(90deg,#c65ae0,#7a249c)' : 'linear-gradient(90deg,#35b981,#087a53)' }} /></div>
              <small>{((item.valor / Math.max(1, visao.porEmpresa.reduce((total: number, empresa: any) => total + empresa.valor, 0))) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% das entradas projetadas</small>
            </div>
          ))}
        </article>
      </section>

      <section className="panel">
        <h2>Calendário mensal de entradas</h2>
        <p>
          Considera somente contratos ativos ou futuros. Contratos encerrados
          permanecem preservados nas bases de auditoria.
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Competência</th>
                <th style={{ textAlign: 'right' }}>
                  Entradas projetadas
                </th>
                <th style={{ textAlign: 'right' }}>FORMA</th>
                <th style={{ textAlign: 'right' }}>MED</th>
                <th style={{ textAlign: 'right' }}>Turmas pagantes</th>
                <th style={{ textAlign: 'right' }}>Parcelas ativas</th>
              </tr>
            </thead>

            <tbody>
              {visao.mensal.map((item: any) => (
                <tr key={item.competencia}>
                  <td>{rotuloMes(item.competencia)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <b>{brl.format(item.valor)}</b>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {brl.format(item.forma)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {brl.format(item.med)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {item.quantidadeTurmas}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {item.quantidadeLancamentos}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
