'use client';

import { useMemo, useState } from 'react';
import PortalHeader from './portal-header';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const numero = (v: unknown) => typeof v === 'number' ? v : Number(String(v ?? '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
const percentual = (v: number) => Number.isFinite(v) ? `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—';
const anoDe = (v: unknown) => { const x = String(v ?? '').match(/20\d{2}|\d{2}(?=\D*$)/); return x ? Number(x[0].length === 2 ? `20${x[0]}` : x[0]) : 0; };

type Ordem = { campo: string; direcao: 'asc' | 'desc' };

function ordenar(itens: any[], ordem: Ordem) {
  return [...itens].sort((a, b) => {
    const av = ordem.campo === 'mes' ? a.indice : a[ordem.campo];
    const bv = ordem.campo === 'mes' ? b.indice : b[ordem.campo];
    const r = typeof av === 'number' ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''), 'pt-BR', { numeric: true });
    return ordem.direcao === 'asc' ? r : -r;
  });
}

function Card({ titulo, valor, descricao, destaque }: { titulo: string; valor: string; descricao: string; destaque?: boolean }) {
  return <article className={destaque ? 'hot' : ''}><small>{titulo}</small><strong>{valor}</strong><span>{descricao}</span></article>;
}

function Tabela({ titulo, texto, cabeca, linhas, rodape }: { titulo: string; texto: string; cabeca: React.ReactNode; linhas: React.ReactNode; rodape?: React.ReactNode }) {
  return <section className="panel"><h2>{titulo}</h2><p>{texto}</p><div className="table-wrap"><table><thead><tr>{cabeca}</tr></thead><tbody>{linhas}</tbody>{rodape && <tfoot>{rodape}</tfoot>}</table></div></section>;
}

export default function Painel({ dados, email, sair }: { dados: any; email: string; sair: () => Promise<void> }) {
  const [periodo, setPeriodo] = useState('2026');
  const [ordem, setOrdem] = useState<Ordem>({ campo: 'valor', direcao: 'desc' });
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const v = useMemo(() => {
    const mensal = (dados.mensal || []).map((x: any) => ({ ...x, ano: numero(x.ano), valor: numero(x.valor) }));
    const a25 = mensal.filter((x: any) => x.ano === 2025), a26 = mensal.filter((x: any) => x.ano === 2026);
    const r25 = a25.reduce((s: number, x: any) => s + x.valor, 0), r26 = a26.reduce((s: number, x: any) => s + x.valor, 0);
    const ultimo = a26.reduce((r: number, x: any, i: number) => x.valor > 0 ? i : r, -1), q = Math.max(1, ultimo + 1);
    const verba = periodo === '2025' ? numero(dados.verba2025) : numero(dados.verba2026);
    const realizado = periodo === '2025' ? r25 : periodo === '2026' ? r26 : r25 + r26;
    const turmas = (dados.turmas || []).map((x: any) => ({ ...x, valor: periodo === '2025' ? numero(x.total2025) : periodo === '2026' ? numero(x.total2026) : numero(x.total), estrutura: /TOY\s*FORMA|EVENTOS\s*COMERCIAIS/i.test(String(x.turma)) })).filter((x: any) => x.valor > 0);
    const eventos = (dados.eventosComerciais || []).map((x: any) => ({ ...x, valor: periodo === '2025' ? numero(x.total2025) : periodo === '2026' ? numero(x.total2026) : numero(x.valor), quantidade: numero(x.quantidade) })).filter((x: any) => x.valor > 0);
    const aquisicao = (dados.turmasGanhas || []).filter((x: any) => periodo === 'ambos' || anoDe(x.ganhou ?? x.GANHOU) === Number(periodo)).reduce((s: number, x: any) => s + numero(x.custoComercial ?? x['CUSTO COMERCIAL']), 0);
    return { a25, a26, r25, r26, ultimo, q, verba, realizado, turmas, eventos, aquisicao, mp25: a25.slice(0, q).reduce((s: number, x: any) => s + x.valor, 0) };
  }, [dados, periodo]);

  const mudarOrdem = (campo: string) => setOrdem((atual) => ({ campo, direcao: atual.campo === campo && atual.direcao === 'desc' ? 'asc' : 'desc' }));
  const H = ({ campo, children, num }: { campo: string; children: React.ReactNode; num?: boolean }) => <th style={{ textAlign: num ? 'right' : 'left' }}><button type="button" style={{ appearance: 'none', border: 0, background: 'transparent', padding: 0, color: 'inherit', font: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', cursor: 'pointer', opacity: .78 }} onClick={() => mudarOrdem(campo)}>{children} {ordem.campo === campo ? (ordem.direcao === 'asc' ? '↑' : '↓') : '↕'}</button></th>;
  const maximo = Math.max(1, ...v.a25.slice(0, v.q).map((x: any) => x.valor), ...v.a26.slice(0, v.q).map((x: any) => x.valor));
  const consumo = v.verba ? v.realizado / v.verba * 100 : NaN;
  const esperado = periodo === '2026' ? v.verba * v.q / 12 : 0;
  const desvio = esperado ? v.realizado - esperado : 0;
  const variacao = v.mp25 ? (v.r26 / v.mp25 - 1) * 100 : NaN;
  const competencias = meses.slice(0, periodo === '2026' ? v.q : 12).map((mes, i) => ({ mes, indice: i, a25: v.a25[i]?.valor || 0, a26: v.a26[i]?.valor || 0, variacao: (v.a25[i]?.valor || 0) ? ((v.a26[i]?.valor || 0) / (v.a25[i]?.valor || 0) - 1) * 100 : NaN }));
  const ranking = v.turmas.filter((x: any) => !x.estrutura), corte = v.realizado * .01, visiveis = mostrarTodos ? ranking : ranking.filter((x: any) => x.valor >= corte);

  return <main>
    <PortalHeader titulo="Custos comerciais" descricao="Orçamento, execução e eficiência do investimento comercial." atual="custos" email={email} sair={sair} referencia={periodo === '2026' ? `Competências realizadas até ${meses[v.ultimo] || 'a data disponível'}/2026` : `Visão ${periodo === 'ambos' ? 'histórica' : periodo}`} atualizadoEm={dados.atualizadoEm} />
    <section className="toolbar"><label>Período<select value={periodo} onChange={(e) => { setPeriodo(e.target.value); setMostrarTodos(false); }}><option value="2026">2026</option><option value="2025">2025</option><option value="ambos">Histórico</option></select></label><span>{dados.fonte}</span></section>
    <section className="cards"><Card titulo="INVESTIMENTO COMERCIAL TOTAL" valor={brl.format(v.realizado)} descricao="Carteira: ganhas, negociação e estrutura" destaque /><Card titulo="CUSTO DE AQUISIÇÃO (GANHAS)" valor={brl.format(v.aquisicao)} descricao={v.realizado ? `${percentual(v.aquisicao / v.realizado * 100)} do investimento total` : 'Sem base no período'} /><Card titulo="ORÇAMENTO CONSUMIDO" valor={percentual(consumo)} descricao={periodo === '2026' ? `Esperado linear: ${brl.format(esperado)}` : brl.format(v.verba)} /><Card titulo="SALDO DISPONÍVEL" valor={periodo === 'ambos' ? '—' : brl.format(v.verba - v.realizado)} descricao="Capacidade remanescente do orçamento" /></section>
    <section className="grid"><article><h2>Ritmo de investimento</h2><p>Comparativo somente das competências já realizadas em 2026. Meses futuros não são interpretados como economia.</p><div className="chart">{competencias.map((x: any) => <div key={x.mes}><i className="old" style={{ height: `${x.a25 / maximo * 170}px` }} /><i className="new" style={{ height: `${x.a26 / maximo * 170}px` }} /><small>{x.mes}</small></div>)}</div></article><article><h2>Leitura de controladoria</h2><dl><dt>Mesmo período de 2025</dt><dd>{brl.format(v.mp25)}</dd><dt>Variação de investimento</dt><dd className={variacao > 0 ? 'risk' : 'ok'}>{percentual(variacao)}</dd><dt title="Orçamento anual distribuído linearmente pelos meses já decorridos.">Consumo esperado até agora</dt><dd>{periodo === '2026' ? brl.format(esperado) : '—'}</dd><dt>Desvio versus ritmo orçado</dt><dd className={desvio > 0 ? 'risk' : 'ok'}>{periodo === '2026' ? brl.format(desvio) : '—'}</dd><dt>Projeção anual 2026</dt><dd>{brl.format(v.r26 / v.q * 12)}</dd></dl></article></section>
    <Tabela titulo="Gastos por competência" texto="Aumento de custo é destacado em vermelho; redução em verde. O total compara o mesmo intervalo do ano." cabeca={<><H campo="mes">Mês</H><H campo="a25" num>2025</H><H campo="a26" num>2026</H><H campo="variacao" num>Variação</H></>} linhas={ordenar(competencias, ordem).map((x: any) => <tr key={x.mes}><td>{x.mes}</td><td style={{ textAlign: 'right' }}>{brl.format(x.a25)}</td><td style={{ textAlign: 'right' }}>{brl.format(x.a26)}</td><td style={{ textAlign: 'right', color: x.variacao > 0 ? '#c84747' : x.variacao < 0 ? '#087a53' : 'inherit' }}>{percentual(x.variacao)}</td></tr>)} rodape={<tr><th>Total comparável</th><th style={{ textAlign: 'right' }}>{brl.format(v.mp25)}</th><th style={{ textAlign: 'right' }}>{brl.format(v.r26)}</th><th style={{ textAlign: 'right', color: variacao > 0 ? '#c84747' : '#087a53' }}>{percentual(variacao)}</th></tr>} />
    <Tabela titulo="Eventos e estrutura comercial" texto="Custos de Toy Forma foram separados do ranking de turmas." cabeca={<><H campo="nome">Frente</H><H campo="quantidade" num>Lançamentos</H><H campo="valor" num>Investimento</H><H campo="valor" num>% do total</H></>} linhas={ordenar(v.eventos, ordem).map((x: any) => <tr key={x.nome}><td><b>{x.nome}</b></td><td style={{ textAlign: 'right' }}>{x.quantidade || '—'}</td><td style={{ textAlign: 'right' }}>{brl.format(x.valor)}</td><td style={{ textAlign: 'right' }}>{percentual(x.valor / v.realizado * 100)}</td></tr>)} />
    <section className="panel"><h2>Turmas com maior custo de aquisição</h2><p>Exibe inicialmente custos iguais ou superiores a 1% do investimento da visão ({brl.format(corte)}). Estrutura e eventos foram excluídos.</p><div className="table-wrap"><table><thead><tr><H campo="turma">Turma</H><H campo="centroCusto">Centro de custo</H><H campo="valor" num>Custo de aquisição</H><H campo="valor" num>% do investimento</H></tr></thead><tbody>{ordenar(visiveis, ordem).map((x: any) => <tr key={`${x.centroCusto}-${x.turma}`}><td>{x.turma}</td><td>{x.centroCusto}</td><td style={{ textAlign: 'right' }}><b>{brl.format(x.valor)}</b></td><td style={{ textAlign: 'right' }}>{percentual(x.valor / v.realizado * 100)}</td></tr>)}</tbody></table></div>{ranking.length > visiveis.length && <button type="button" style={{ marginTop: 14, border: '1px solid #d7cce0', borderRadius: 8, background: '#fff', padding: '8px 11px', cursor: 'pointer' }} onClick={() => setMostrarTodos(true)}>Ver {ranking.length - visiveis.length} turmas abaixo do corte</button>}{mostrarTodos && <button type="button" style={{ marginTop: 14, marginLeft: 8, border: 0, background: 'transparent', color: '#71258f', cursor: 'pointer' }} onClick={() => setMostrarTodos(false)}>Aplicar corte de 1%</button>}</section>
  </main>;
}
