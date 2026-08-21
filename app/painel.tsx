'use client';

import { useMemo, useState } from 'react';
import PortalHeader from './portal-header';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const numero = (valor: unknown) => typeof valor === 'number' ? valor : Number(String(valor ?? '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
const percentual = (valor: number) => Number.isFinite(valor) ? valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%' : '—';

export default function Painel({ dados, email, sair }: { dados: any; email: string; sair: () => Promise<void> }) {
  const [periodo, setPeriodo] = useState('2026');
  const visao = useMemo(() => {
    const mensal = (dados.mensal || []).map((item: any) => ({ ...item, ano: numero(item.ano), valor: numero(item.valor) }));
    const a25 = mensal.filter((item: any) => item.ano === 2025);
    const a26 = mensal.filter((item: any) => item.ano === 2026);
    const realizado25 = a25.reduce((soma: number, item: any) => soma + item.valor, 0);
    const realizado26 = a26.reduce((soma: number, item: any) => soma + item.valor, 0);
    const ultimoMesRealizado = a26.reduce((ultimo: number, item: any, indice: number) => item.valor > 0 ? indice : ultimo, -1);
    const mesesRealizados = Math.max(1, ultimoMesRealizado + 1);
    const mesmoPeriodo25 = a25.slice(0, mesesRealizados).reduce((soma: number, item: any) => soma + item.valor, 0);
    const verba = periodo === '2025' ? numero(dados.verba2025) : numero(dados.verba2026);
    const realizado = periodo === '2025' ? realizado25 : periodo === '2026' ? realizado26 : realizado25 + realizado26;
    const turmas = (dados.turmas || []).map((item: any) => ({
      ...item,
      valor: periodo === '2025' ? numero(item.total2025) : periodo === '2026' ? numero(item.total2026) : numero(item.total),
      estrutura: /TOY\s*FORMA/i.test(String(item.turma)),
    })).filter((item: any) => item.valor > 0).sort((a: any, b: any) => b.valor - a.valor);
    const anoSelecionado = periodo === 'ambos' ? null : Number(periodo);
    const custoAquisicao = (dados.turmasGanhas || []).filter((item: any) => !anoSelecionado || String(item.ganhou || '').includes(String(anoSelecionado))).reduce((soma: number, item: any) => soma + numero(item.custoComercial), 0);
    const eventos = (dados.eventosComerciais || []).map((item: any) => ({ ...item, valor: numero(item.valor), quantidade: numero(item.quantidade) }));
    return { a25, a26, realizado25, realizado26, ultimoMesRealizado, mesmoPeriodo25, verba, realizado, turmas, custoAquisicao, eventos, projecao: realizado26 / mesesRealizados * 12 };
  }, [dados, periodo]);

  const maximo = Math.max(1, ...visao.a25.map((item: any) => item.valor), ...visao.a26.map((item: any) => item.valor));
  const consumo = visao.verba ? visao.realizado / visao.verba * 100 : NaN;
  const variacao = visao.mesmoPeriodo25 ? (visao.realizado26 / visao.mesmoPeriodo25 - 1) * 100 : NaN;

  return <main>
    <PortalHeader titulo="Custos comerciais" descricao="Orçamento, execução e eficiência do investimento comercial." atual="custos" email={email} sair={sair} />
    <section className="toolbar"><label>Período<select value={periodo} onChange={e => setPeriodo(e.target.value)}><option value="2026">2026</option><option value="2025">2025</option><option value="ambos">Histórico</option></select></label><span>{dados.fonte}</span><small>Atualizado: {dados.atualizadoEm}</small></section>
    <section className="cards">
      <Card t="INVESTIMENTO COMERCIAL TOTAL" v={brl.format(visao.realizado)} d="Carteira: ganhas, negociação e estrutura" hot />
      <Card t="CUSTO DE AQUISIÇÃO (GANHAS)" v={brl.format(visao.custoAquisicao)} d={visao.realizado ? `${percentual(visao.custoAquisicao / visao.realizado * 100)} do investimento total` : 'Sem base no período'} />
      <Card t="ORÇAMENTO" v={brl.format(visao.verba)} d={`${percentual(consumo)} consumido`} />
      <Card t="SALDO DISPONÍVEL" v={periodo === 'ambos' ? '—' : brl.format(visao.verba - visao.realizado)} d="Capacidade remanescente" />
    </section>
    <section className="grid"><article><h2>Ritmo de investimento</h2><p>Comparativo mensal 2025 × 2026; meses sem realização ainda não são tratados como economia.</p><div className="chart">{meses.map((mes, indice) => <div key={mes}><i className="old" style={{ height: `${(visao.a25[indice]?.valor || 0) / maximo * 170}px` }} /><i className="new" style={{ height: `${(visao.a26[indice]?.valor || 0) / maximo * 170}px` }} /><small>{mes}</small></div>)}</div></article><article><h2>Leitura de controladoria</h2><dl><dt>Mesmo período 2025</dt><dd>{brl.format(visao.mesmoPeriodo25)}</dd><dt>Variação de investimento</dt><dd className={variacao > 0 ? 'risk' : 'ok'}>{percentual(variacao)}</dd><dt>Projeção anual 2026</dt><dd>{brl.format(visao.projecao)}</dd><dt>Turmas com gasto</dt><dd>{visao.turmas.filter((item: any) => !item.estrutura).length}</dd></dl></article></section>
    <section className="panel"><h2>Gastos por competência</h2><p>Variação só é exibida até o último mês com realização na base. Aumento de custo é vermelho; redução é verde.</p><div className="table-wrap"><table><thead><tr><th>Mês</th><th style={{ textAlign: 'right' }}>2025</th><th style={{ textAlign: 'right' }}>2026</th><th style={{ textAlign: 'right' }}>Variação</th></tr></thead><tbody>{meses.map((mes, indice) => { const anterior = visao.a25[indice]?.valor || 0; const atual = visao.a26[indice]?.valor || 0; const futuro = periodo === '2026' && indice > visao.ultimoMesRealizado; const variacaoMes = anterior ? (atual / anterior - 1) * 100 : NaN; return <tr key={mes}><td>{mes}{futuro ? ' · não decorrido' : ''}</td><td style={{ textAlign: 'right' }}>{brl.format(anterior)}</td><td style={{ textAlign: 'right' }}>{futuro ? '—' : brl.format(atual)}</td><td style={{ textAlign: 'right', color: futuro ? 'inherit' : variacaoMes > 0 ? '#c84747' : variacaoMes < 0 ? '#087a53' : 'inherit', fontWeight: 700 }}>{futuro ? '—' : percentual(variacaoMes)}</td></tr>; })}</tbody><tfoot><tr><th>Total</th><th style={{ textAlign: 'right' }}>{brl.format(visao.realizado25)}</th><th style={{ textAlign: 'right' }}>{brl.format(visao.realizado26)}</th><th /></tr></tfoot></table></div></section>
    <section className="panel"><h2>Eventos e estrutura comercial</h2><p>Custos de “Toy Forma” foram separados do ranking de turmas e classificados por complemento.</p><div className="table-wrap"><table><thead><tr><th>Frente</th><th style={{ textAlign: 'right' }}>Lançamentos</th><th style={{ textAlign: 'right' }}>Investimento</th><th style={{ textAlign: 'right' }}>% do total</th></tr></thead><tbody>{visao.eventos.map((evento: any) => <tr key={evento.nome}><td><b>{evento.nome}</b></td><td style={{ textAlign: 'right' }}>{evento.quantidade || '—'}</td><td style={{ textAlign: 'right' }}>{brl.format(evento.valor)}</td><td style={{ textAlign: 'right' }}>{percentual(evento.valor / visao.realizado * 100)}</td></tr>)}</tbody></table></div></section>
    <section className="panel"><h2>Turmas com maior custo de aquisição</h2><p>Estrutura comercial e eventos foram excluídos deste ranking.</p><div className="table-wrap"><table><thead><tr><th>#</th><th>Turma</th><th>Centro de custo</th><th style={{ textAlign: 'right' }}>Custo de aquisição</th><th style={{ textAlign: 'right' }}>% do investimento</th></tr></thead><tbody>{visao.turmas.filter((item: any) => !item.estrutura).slice(0, 10).map((item: any, indice: number) => <tr key={item.turma}><td>{indice + 1}</td><td>{item.turma}</td><td>{item.centroCusto}</td><td style={{ textAlign: 'right' }}><b>{brl.format(item.valor)}</b></td><td style={{ textAlign: 'right' }}>{percentual(item.valor / visao.realizado * 100)}</td></tr>)}</tbody></table></div></section>
  </main>;
}

function Card({ t, v, d, hot }: { t: string; v: string; d: string; hot?: boolean }) { return <article className={hot ? 'hot' : ''}><small>{t}</small><strong>{v}</strong><span>{d}</span></article>; }
