'use client';

import { useMemo, useState } from 'react';
import PortalHeader from '../portal-header';

type Visao = 'FECHADO' | 'EM ANDAMENTO' | 'PERDIDO';
type FiltroVisao = 'TODOS' | Visao;
type Registro = { pit: string; turma: string; status: string; visao: Visao; feeEstimado: number; custo2025: number; custo2026: number; custo: number; linhasFonte: string };
type ResumoStatus = { status: string; turmas: number; feeEstimado: number; custo: number; comCusto: number };

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const numero = (valor: unknown) => typeof valor === 'number' ? valor : Number(String(valor ?? '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
const percentual = (parte: number, total: number) => total ? `${(parte / total * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—';

function classificarVisao(status: string): Visao {
  const texto = status.toUpperCase();
  if (/CONTRATO\s*ASSINADO|FECHADO|BAILE\s*ENTREGUE/.test(texto)) return 'FECHADO';
  if (/PERDIDO/.test(texto)) return 'PERDIDO';
  return 'EM ANDAMENTO';
}

function Card({ titulo, valor, descricao, destaque }: { titulo: string; valor: string; descricao: string; destaque?: boolean }) {
  return <article className={destaque ? 'hot' : ''}><small>{titulo}</small><strong>{valor}</strong><span>{descricao}</span></article>;
}

export default function Pipeline({ dados, email, sair }: { dados: any; email: string; sair: () => Promise<void> }) {
  const [visaoSelecionada, setVisaoSelecionada] = useState<FiltroVisao>('TODOS');
  const [busca, setBusca] = useState('');
  const api = dados.pipeline || {};
  const registros = useMemo<Registro[]>(() => (api.registros || []).map((item: any): Registro => {
    const status = String(item.status || 'SEM STATUS');
    return { pit: String(item.pit || item.job || '—'), turma: String(item.turma || 'Sem identificação'), status, visao: classificarVisao(status), feeEstimado: numero(item.feeEstimado), custo2025: numero(item.custo2025), custo2026: numero(item.custo2026), custo: numero(item.custo), linhasFonte: String(item.linhasFonte || '') };
  }), [api.registros]);
  const porVisao = useMemo<Record<Visao, Registro[]>>(() => ({ FECHADO: registros.filter(item => item.visao === 'FECHADO'), 'EM ANDAMENTO': registros.filter(item => item.visao === 'EM ANDAMENTO'), PERDIDO: registros.filter(item => item.visao === 'PERDIDO') }), [registros]);
  const filtrados = useMemo(() => registros.filter(item => {
    const pertenceVisao = visaoSelecionada === 'TODOS' || item.visao === visaoSelecionada;
    return pertenceVisao && `${item.pit} ${item.turma} ${item.status}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'));
  }), [registros, visaoSelecionada, busca]);
  const totalCusto = (itens: Registro[]) => itens.reduce((soma: number, item: Registro) => soma + item.custo, 0);
  const totalFee = (itens: Registro[]) => itens.reduce((soma: number, item: Registro) => soma + item.feeEstimado, 0);
  const custoFiltrado = totalCusto(filtrados), feeFiltrado = totalFee(filtrados), comCusto = filtrados.filter(item => item.custo > 0).length;
  const resumoPorStatus = useMemo<ResumoStatus[]>(() => Object.values(filtrados.reduce<Record<string, ResumoStatus>>((acumulado, item) => {
    acumulado[item.status] ||= { status: item.status, turmas: 0, feeEstimado: 0, custo: 0, comCusto: 0 };
    acumulado[item.status].turmas += 1; acumulado[item.status].feeEstimado += item.feeEstimado; acumulado[item.status].custo += item.custo; acumulado[item.status].comCusto += item.custo > 0 ? 1 : 0;
    return acumulado;
  }, {})).sort((a, b) => b.feeEstimado - a.feeEstimado), [filtrados]);
  const rotuloFee = visaoSelecionada === 'FECHADO' ? 'FEE FECHADO' : visaoSelecionada === 'PERDIDO' ? 'FEE PERDIDO' : visaoSelecionada === 'EM ANDAMENTO' ? 'FEE EM DISPUTA' : 'FEE TOTAL DO PIPELINE';
  const descricaoFee = visaoSelecionada === 'FECHADO' ? 'Potencial consolidado em oportunidades fechadas' : visaoSelecionada === 'PERDIDO' ? 'Potencial não convertido em contratos' : visaoSelecionada === 'EM ANDAMENTO' ? 'Potencial comercial ainda em negociação' : 'Potencial comercial de toda a carteira';
  const corVisao = (visao: Visao) => visao === 'FECHADO' ? 'ok' : visao === 'PERDIDO' ? 'risk' : '';

  return <main>
    <PortalHeader titulo="Pipeline comercial" descricao="Potencial de Fee, status de fechamento e custo comercial vinculados por PIT/JOB." atual="pipeline" email={email} sair={sair} referencia="Pipeline de turmas consolidadas" atualizadoEm={api.atualizadoEm || dados.atualizadoEm} />
    <section className="toolbar"><label>Visão do Pipeline<select value={visaoSelecionada} onChange={event => setVisaoSelecionada(event.target.value as FiltroVisao)}><option value="TODOS">Todos os status</option><option value="FECHADO">Fechado</option><option value="EM ANDAMENTO">Em andamento</option><option value="PERDIDO">Perdido</option></select></label><label>Buscar PIT, turma ou status<input value={busca} onChange={event => setBusca(event.target.value)} placeholder="Ex.: 27500319 ou ANHEMBI" /></label><span>{filtrados.length} turmas na visão</span></section>
    {!registros.length ? <section className="panel"><h2>Importação pendente</h2><p>Execute a rotina de Pipeline na planilha para disponibilizar os dados nesta página.</p></section> : <>
      <section className="cards"><Card titulo="TURMAS NA VISÃO" valor={String(filtrados.length)} descricao={`${comCusto} com custo comercial identificado`} destaque /><Card titulo={rotuloFee} valor={brl.format(feeFiltrado)} descricao={descricaoFee} destaque /><Card titulo="CUSTO MAPEADO" valor={brl.format(custoFiltrado)} descricao="Investimento comercial já realizado" /><Card titulo="COBERTURA DE CUSTO" valor={percentual(comCusto, filtrados.length)} descricao={`${comCusto} PITs associados à auditoria`} /></section>
      <section className="panel"><h2>Visões consolidadas do Pipeline</h2><p>Contrato Assinado, Fechado e Baile Entregue = Fechado; Perdido = Perdido; demais status = Em Andamento.</p><div className="table-wrap"><table><thead><tr><th>Visão</th><th style={{ textAlign: 'right' }}>Turmas</th><th style={{ textAlign: 'right' }}>Fee estimado</th><th style={{ textAlign: 'right' }}>Custo mapeado</th><th style={{ textAlign: 'right' }}>Custo / Fee</th></tr></thead><tbody>{(['FECHADO', 'EM ANDAMENTO', 'PERDIDO'] as Visao[]).map(visao => <tr key={visao}><td><b className={corVisao(visao)}>{visao}</b></td><td style={{ textAlign: 'right' }}>{porVisao[visao].length}</td><td style={{ textAlign: 'right' }}><b>{brl.format(totalFee(porVisao[visao]))}</b></td><td style={{ textAlign: 'right' }}>{brl.format(totalCusto(porVisao[visao]))}</td><td style={{ textAlign: 'right' }}>{percentual(totalCusto(porVisao[visao]), totalFee(porVisao[visao]))}</td></tr>)}</tbody></table></div></section>
      <section className="grid"><article><h2>Leitura para gestão comercial</h2><p>Fee é potencial de receita; custo é investimento comercial já realizado e rastreado pelo mesmo PIT/JOB.</p><dl><dt>Fee fechado</dt><dd className="ok">{brl.format(totalFee(porVisao.FECHADO))}</dd><dt>Fee em disputa</dt><dd>{brl.format(totalFee(porVisao['EM ANDAMENTO']))}</dd><dt>Fee perdido</dt><dd className="risk">{brl.format(totalFee(porVisao.PERDIDO))}</dd><dt>Custo em oportunidades perdidas</dt><dd className="risk">{brl.format(totalCusto(porVisao.PERDIDO))}</dd></dl></article><article><h2>Qualidade da base</h2><p>A classificação consolida a leitura executiva sem alterar o status original do Pipe.</p><dl><dt>PITs com custo identificado</dt><dd>{comCusto}</dd><dt>PITs sem custo na visão</dt><dd>{filtrados.length - comCusto}</dd><dt>Investimento / Fee da visão</dt><dd>{percentual(custoFiltrado, feeFiltrado)}</dd></dl></article></section>
      <section className="panel"><h2>Fee e custo por status original</h2><p>Detalhamento do status registrado na fonte, restrito à visão selecionada.</p><div className="table-wrap"><table><thead><tr><th>Status original</th><th style={{ textAlign: 'right' }}>Turmas</th><th style={{ textAlign: 'right' }}>Fee estimado</th><th style={{ textAlign: 'right' }}>Com custo</th><th style={{ textAlign: 'right' }}>Custo associado</th></tr></thead><tbody>{resumoPorStatus.map(item => <tr key={item.status}><td><b>{item.status}</b></td><td style={{ textAlign: 'right' }}>{item.turmas}</td><td style={{ textAlign: 'right' }}>{brl.format(item.feeEstimado)}</td><td style={{ textAlign: 'right' }}>{item.comCusto}</td><td style={{ textAlign: 'right' }}>{brl.format(item.custo)}</td></tr>)}</tbody></table></div></section>
      <section className="panel"><h2>Detalhamento por turma e PIT</h2><p>Base auditável para comercial, financeiro e controladoria.</p><div className="table-wrap"><table><thead><tr><th>Visão</th><th>Status original</th><th>PIT/JOB</th><th>Turma</th><th style={{ textAlign: 'right' }}>Fee estimado</th><th style={{ textAlign: 'right' }}>Custo 2025</th><th style={{ textAlign: 'right' }}>Custo 2026</th><th style={{ textAlign: 'right' }}>Custo total</th><th>Rastreio</th></tr></thead><tbody>{filtrados.map(item => <tr key={item.pit}><td><b className={corVisao(item.visao)}>{item.visao}</b></td><td>{item.status}</td><td>{item.pit}</td><td>{item.turma}</td><td style={{ textAlign: 'right' }}><b>{brl.format(item.feeEstimado)}</b></td><td style={{ textAlign: 'right' }}>{brl.format(item.custo2025)}</td><td style={{ textAlign: 'right' }}>{brl.format(item.custo2026)}</td><td style={{ textAlign: 'right' }}><b>{brl.format(item.custo)}</b></td><td>{item.linhasFonte ? `Linha ${item.linhasFonte}` : '—'}</td></tr>)}</tbody><tfoot><tr><th colSpan={4}>Total filtrado</th><th style={{ textAlign: 'right' }}>{brl.format(totalFee(filtrados))}</th><th style={{ textAlign: 'right' }}>{brl.format(filtrados.reduce((soma: number, item: Registro) => soma + item.custo2025, 0))}</th><th style={{ textAlign: 'right' }}>{brl.format(filtrados.reduce((soma: number, item: Registro) => soma + item.custo2026, 0))}</th><th style={{ textAlign: 'right' }}>{brl.format(custoFiltrado)}</th><th /></tr></tfoot></table></div></section>
    </>}
  </main>;
}
