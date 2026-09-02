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

  const visao = useMemo(() => {
    const mensal = (projecao?.mensal || []).map((item: any) => ({
      ...item,
      valor: numero(item.valor),
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

    return { mensal, porEmpresa, maximo };
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
      />

      <section className="toolbar">
        <span>{projecao.fonte || 'Projeção ativa de entradas'}</span>
        <small>
          Atualizado: {projecao.atualizadoEm || dados.atualizadoEm}
        </small>
      </section>

      <section className="cards">
        <Card
          titulo="ENTRADA DO MÊS"
          valor={brl.format(numero(projecao.totalMesAtual))}
          descricao="Entradas brutas previstas no mês corrente"
          destaque
        />

        <Card
          titulo="PRÓXIMOS 12 MESES"
          valor={compacto.format(numero(projecao.totalProximos12Meses))}
          descricao="Fee + imposto previstos no cronograma"
        />

        <Card
          titulo="TURMAS ATIVAS"
          valor={String(numero(projecao.quantidadeTurmas))}
          descricao="Turmas com recebimento vigente ou futuro"
        />

        <Card
          titulo="LANÇAMENTOS PROJETADOS"
          valor={String(numero(projecao.quantidadeLancamentos))}
          descricao="Parcelas futuras consideradas na projeção"
        />
      </section>

      <section className="grid">
        <article>
          <h2>Curva de entradas</h2>
          <p>
            Entradas brutas projetadas: fee mais imposto. O imposto não representa
            receita líquida da empresa.
          </p>

          <div className="fee-bars">
            {visao.mensal.slice(0, 12).map((item: any) => (
              <div
                className="fee-bar"
                key={item.competencia}
              >
                <i
                  style={{
                    height: `${(item.valor / visao.maximo) * 170}px`,
                  }}
                />
                <small>{rotuloMes(item.competencia)}</small>
              </div>
            ))}
          </div>
        </article>

        <article>
          <h2>Composição por empresa</h2>

          <dl>
            {visao.porEmpresa.map((item: any) => (
              <div
                key={item.empresa}
                style={{ display: 'contents' }}
              >
                <dt>{item.empresa}</dt>
                <dd>{brl.format(item.valor)}</dd>
              </div>
            ))}

            <dt>Base considerada</dt>
            <dd>FORMA e MED</dd>
          </dl>
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
                <th style={{ textAlign: 'right' }}>Turmas</th>
                <th style={{ textAlign: 'right' }}>Lançamentos</th>
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
