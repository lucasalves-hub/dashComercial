'use client';

import { useMemo, useState } from 'react';
import PortalHeader from '../portal-header';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const numero = (v: unknown) => typeof v === 'number' ? v : Number(String(v ?? '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
const percentual = (parte: number, total: number) => total ? `${(parte / total * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—';
const categoria = (status: string) => /CONTRATO\s*ASSINADO|GANH[AO]|FECHAD/i.test(status) ? 'Ganhas' : /PERDID|RECUS|CANCEL/i.test(status) ? 'Perdidas' : /DIVERGÊNCIA|SEM STATUS/i.test(status) ? 'Revisar' : 'Em atendimento';

function Card({ titulo, valor, descricao, destaque }: { titulo: string; valor: string; descricao: string; destaque?: boolean }) {
  return <article className={destaque ? 'hot' : ''}><small>{titulo}</small><strong>{valor}</strong><span>{descricao}</span></article>;
}

export default function Pipeline({ dados, email, sair }: { dados: any; email: string; sair: () => Promise<void> }) {
  const [status, setStatus] = useState('TODOS');
  const [busca, setBusca] = useState('');
  const api = dados.pipeline || {};
  const registros = useMemo(() => (api.registros || []).map((item: any) => ({
    pit: String(item.pit || item.job || '—'),
    turma: String(item.turma || 'Sem identificação'),
    status: String(item.status || 'SEM STATUS'),
    categoria: categoria(String(item.status || '')),
    custo2025: numero(item.custo2025),
    custo2026: numero(item.custo2026),
    custo: numero(item.custo),
    feeEstimado: numero(item.feeEstimado),
    linhasFonte: String(item.linhasFonte || ''),
  })), [api.registros]);
  const statusDisponiveis = useMemo<string[]>(() => [...new Set<string>(registros.map((item: any) => String(item.status)))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [registros]);
  const filtrados = useMemo(() => registros.filter((item: any) =>
    (status === 'TODOS' || item.status === status) && `${item.pit} ${item.turma} ${item.status}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))
  ), [registros, status, busca]);
  const total = (itens: any[]) => itens.reduce((soma: number, item: any) => soma + item.custo, 0);
  const custoTotal = total(filtrados);
  const feeTotal = filtrados.reduce((soma: number, item: any) => soma + item.feeEstimado, 0);
  const porCategoria = (nome: string) => filtrados.filter((item: any) => item.categoria === nome);
  const ganhas = porCategoria('Ganhas'), perdidas = porCategoria('Perdidas'), atendimento = porCategoria('Em atendimento'), revisar = porCategoria('Revisar');
  const resumo = useMemo(() => Object.values(filtrados.reduce((acumulado: Record<string, any>, item: any) => {
    acumulado[item.status] ||= { status: item.status, turmas: 0, feeEstimado: 0, custo: 0, comCusto: 0 };
    acumulado[item.status].turmas += 1;
    acumulado[item.status].feeEstimado += item.feeEstimado;
    acumulado[item.status].custo += item.custo;
    acumulado[item.status].comCusto += item.custo > 0 ? 1 : 0;
    return acumulado;
  }, {})).sort((a: any, b: any) => b.custo - a.custo), [filtrados]);

  return <main>
    <PortalHeader titulo="Pipeline comercial" descricao="Status das oportunidades e investimento comercial já realizado por PIT/JOB." atual="pipeline" email={email} sair={sair} referencia="Pipeline de turmas consolidadas" atualizadoEm={api.atualizadoEm || dados.atualizadoEm} />
    <section className="toolbar"><label>Status de fechamento<select value={status} onChange={e => setStatus(e.target.value)}><option value="TODOS">Todos os status</option>{statusDisponiveis.map(item => <option key={item} value={item}>{item}</option>)}</select></label><label>Buscar PIT ou turma<input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Ex.: 27500319 ou ANHEMBI" /></label><span>{filtrados.length} turmas na visão</span></section>
    {!registros.length ? <section className="panel"><h2>Importação pendente</h2><p>Execute a rotina de Pipeline na planilha e atualize a API para disponibilizar os dados nesta página.</p></section> : <>
      <section className="cards"><Card titulo="TURMAS NA VISÃO" valor={String(filtrados.length)} descricao={`${filtrados.filter((item: any) => item.custo > 0).length} com custo comercial identificado`} destaque /><Card titulo="FEE ESTIMADO" valor={brl.format(feeTotal)} descricao={status === 'TODOS' ? 'Potencial total do Pipeline' : `Potencial no status: ${status}`} destaque /><Card titulo="CUSTO MAPEADO" valor={brl.format(custoTotal)} descricao="Investimento comercial vinculado por PIT/JOB" /><Card titulo="COBERTURA DE CUSTO" valor={percentual(filtrados.filter((item: any) => item.custo > 0).length, filtrados.length)} descricao={`${filtrados.filter((item: any) => item.custo > 0).length} PITs com custo identificado`} /></section>
      <section className="grid"><article><h2>Leitura do funil</h2><p>Fee representa o potencial comercial; custo é o investimento histórico já realizado na oportunidade.</p><dl><dt>Ganhas / contrato assinado</dt><dd>{ganhas.length} · {brl.format(ganhas.reduce((soma: number, item: any) => soma + item.feeEstimado, 0))}</dd><dt>Em atendimento</dt><dd>{atendimento.length} · {brl.format(atendimento.reduce((soma: number, item: any) => soma + item.feeEstimado, 0))}</dd><dt>Perdidas</dt><dd className={perdidas.length ? 'risk' : ''}>{perdidas.length} · {brl.format(perdidas.reduce((soma: number, item: any) => soma + item.feeEstimado, 0))}</dd><dt>Revisar status</dt><dd className={revisar.length ? 'risk' : 'ok'}>{revisar.length} · {brl.format(revisar.reduce((soma: number, item: any) => soma + item.feeEstimado, 0))}</dd></dl></article><article><h2>Cobertura de custo</h2><p>Quanto da visão selecionada já encontra custo na auditoria comercial.</p><dl><dt>PITs com custo identificado</dt><dd>{filtrados.filter((item: any) => item.custo > 0).length}</dd><dt>PITs sem custo na auditoria</dt><dd>{filtrados.filter((item: any) => !item.custo).length}</dd><dt>Custo em turmas perdidas</dt><dd className={perdidas.length ? 'risk' : 'ok'}>{percentual(total(perdidas), custoTotal)}</dd></dl></article></section>
      <section className="panel"><h2>Fee e custo comercial por status</h2><p>Ao selecionar um status, esta tabela e todos os indicadores passam a refletir somente a visão escolhida.</p><div className="table-wrap"><table><thead><tr><th>Status</th><th style={{ textAlign: 'right' }}>Turmas</th><th style={{ textAlign: 'right' }}>Fee estimado</th><th style={{ textAlign: 'right' }}>Com custo</th><th style={{ textAlign: 'right' }}>Custo associado</th><th style={{ textAlign: 'right' }}>% do custo</th></tr></thead><tbody>{resumo.map((item: any) => <tr key={item.status}><td><b>{item.status}</b></td><td style={{ textAlign: 'right' }}>{item.turmas}</td><td style={{ textAlign: 'right' }}>{brl.format(item.feeEstimado || 0)}</td><td style={{ textAlign: 'right' }}>{item.comCusto}</td><td style={{ textAlign: 'right' }}>{brl.format(item.custo)}</td><td style={{ textAlign: 'right' }}>{percentual(item.custo, custoTotal)}</td></tr>)}</tbody></table></div></section>
      <section className="panel"><h2>Detalhamento por turma e PIT</h2><p>Base para comercial, financeiro e controladoria verificarem potencial de Fee, status e custo associado à mesma chave.</p><div className="table-wrap"><table><thead><tr><th>PIT/JOB</th><th>Turma</th><th>Status de fechamento</th><th style={{ textAlign: 'right' }}>Fee estimado</th><th style={{ textAlign: 'right' }}>Custo 2025</th><th style={{ textAlign: 'right' }}>Custo 2026</th><th style={{ textAlign: 'right' }}>Custo total</th><th>Rastreio</th></tr></thead><tbody>{filtrados.map((item: any) => <tr key={item.pit}><td>{item.pit}</td><td>{item.turma}</td><td><b className={item.categoria === 'Perdidas' || item.categoria === 'Revisar' ? 'risk' : item.categoria === 'Ganhas' ? 'ok' : ''}>{item.status}</b></td><td style={{ textAlign: 'right' }}><b>{brl.format(item.feeEstimado)}</b></td><td style={{ textAlign: 'right' }}>{brl.format(item.custo2025)}</td><td style={{ textAlign: 'right' }}>{brl.format(item.custo2026)}</td><td style={{ textAlign: 'right' }}><b>{brl.format(item.custo)}</b></td><td>{item.linhasFonte ? `Linha ${item.linhasFonte}` : '—'}</td></tr>)}</tbody><tfoot><tr><th colSpan={3}>Total filtrado</th><th style={{ textAlign: 'right' }}>{brl.format(filtrados.reduce((s: number, item: any) => s + item.feeEstimado, 0))}</th><th style={{ textAlign: 'right' }}>{brl.format(filtrados.reduce((s: number, item: any) => s + item.custo2025, 0))}</th><th style={{ textAlign: 'right' }}>{brl.format(filtrados.reduce((s: number, item: any) => s + item.custo2026, 0))}</th><th style={{ textAlign: 'right' }}>{brl.format(total(filtrados))}</th><th /></tr></tfoot></table></div></section>
    </>}
  </main>;
}
