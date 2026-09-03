'use client';

import { useMemo, useState } from 'react';
import PortalHeader from '../portal-header';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const n = (v: unknown) => typeof v === 'number' ? v : Number(String(v ?? '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
function Card({ titulo, valor, descricao, destaque }: { titulo: string; valor: string; descricao: string; destaque?: boolean }) { return <article className={destaque ? 'hot' : ''}><small>{titulo}</small><strong>{valor}</strong><span>{descricao}</span></article>; }

export default function Comissionamento({ dados, email, sair }: { dados: any; email: string; sair: () => Promise<void> }) {
  const api = dados.comissionamento || {};
  const [competencia, setCompetencia] = useState(String(api.competenciaAtual || api.mensal?.[0]?.competencia || ''));
  const [busca, setBusca] = useState('');
  const mensal = api.mensal || [];
  const linhas = useMemo(() => (api.parcelas || []).filter((p: any) => (!competencia || p.competencia === competencia) && `${p.colaborador} ${p.turma} ${p.job}`.toLowerCase().includes(busca.toLowerCase())), [api.parcelas, competencia, busca]);
  const previsto = linhas.reduce((s: number, p: any) => s + n(p.valor), 0);
  const colaboradores = new Set(linhas.map((p: any) => p.colaborador)).size;
  const totalProgramado = n(api.totalProgramado);
  const porPessoa = useMemo(() => Object.values(linhas.reduce((acc: Record<string, any>, p: any) => { const k = p.colaborador || 'Não identificado'; acc[k] ||= { nome: k, previsto: 0, turmas: 0 }; acc[k].previsto += n(p.valor); acc[k].turmas += 1; return acc; }, {})).sort((a: any, b: any) => b.previsto - a.previsto), [linhas]);
  return <main>
    <PortalHeader titulo="Comissionamento" descricao="Parcelas previstas por colaborador e turma, conforme a base operacional do Financeiro." atual="comissionamento" email={email} sair={sair} referencia={competencia ? `Competência ${competencia}` : 'Base operacional'} atualizadoEm={api.atualizadoEm || dados.atualizadoEm} />
    {!api.mensal && <section className="panel"><h2>Integração em preparação</h2><p>A página já está pronta. A próxima atualização da API incluirá o consolidado da planilha de comissionamento.</p></section>}
    {api.mensal && <><section className="toolbar"><label>Competência<select value={competencia} onChange={e => setCompetencia(e.target.value)}>{mensal.map((m: any) => <option key={m.competencia} value={m.competencia}>{m.competencia}</option>)}</select></label><label>Buscar colaborador, turma ou JOB<input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Ex.: Lucas, PUC ou 2750" /></label><span>{linhas.length} parcelas na visão</span></section>
    <section className="cards"><Card titulo="COMISSÃO PREVISTA" valor={brl.format(previsto)} descricao="Parcelas agendadas na competência" destaque /><Card titulo="COLABORADORES" valor={String(colaboradores)} descricao="Com parcela prevista no período" /><Card titulo="TURMAS / PARCELAS" valor={String(linhas.length)} descricao="Registros que compõem a competência" /><Card titulo="TOTAL PROGRAMADO" valor={brl.format(totalProgramado)} descricao="Todas as parcelas da base atual" /></section>
    <section className="grid"><article><h2>Previsão por competência</h2><p>Leitura da programação registrada no controle atual.</p><div className="bars">{mensal.slice(0, 18).map((m: any) => <div key={m.competencia}><i style={{ height: `${Math.max(4, (n(m.valor) / Math.max(...mensal.map((x: any) => n(x.valor)), 1)) * 150)}px` }} /><span>{m.competencia}</span><b>{brl.format(n(m.valor))}</b></div>)}</div></article><article><h2>Controle de pagamentos</h2><p>O controle atual contém a programação de parcelas. A baixa financeira individual ainda será conectada quando validarmos a regra da aba “pagamentos feitos”.</p><dl><dt>Status atual</dt><dd>Programação disponível</dd><dt>Pagamento efetivado</dt><dd>Próxima integração</dd><dt>Recibos</dt><dd>Já gerados no Drive</dd></dl></article></section>
    <section className="panel"><h2>Resumo por colaborador</h2><div className="table-wrap"><table><thead><tr><th>Colaborador</th><th style={{textAlign:'right'}}>Turmas / parcelas</th><th style={{textAlign:'right'}}>Previsto na competência</th></tr></thead><tbody>{porPessoa.map((p: any) => <tr key={p.nome}><td>{p.nome}</td><td style={{textAlign:'right'}}>{p.turmas}</td><td style={{textAlign:'right'}}><b>{brl.format(p.previsto)}</b></td></tr>)}</tbody></table></div></section>
    <section className="panel"><h2>Detalhamento por turma</h2><p>Os valores vêm diretamente das parcelas mensais programadas, sem recalcular benefícios ou despesas no portal.</p><div className="table-wrap"><table><thead><tr><th>Colaborador</th><th>JOB</th><th>Turma</th><th style={{textAlign:'right'}}>Fee líquido</th><th style={{textAlign:'right'}}>%</th><th>Parcela</th><th style={{textAlign:'right'}}>Valor previsto</th></tr></thead><tbody>{linhas.map((p: any, i: number) => <tr key={`${p.job}-${p.colaborador}-${i}`}><td>{p.colaborador}</td><td>{p.job}</td><td>{p.turma}</td><td style={{textAlign:'right'}}>{brl.format(n(p.feeLiquido))}</td><td style={{textAlign:'right'}}>{n(p.percentual).toLocaleString('pt-BR',{style:'percent',maximumFractionDigits:1})}</td><td>{p.parcelaAtual && p.totalParcelas ? `${p.parcelaAtual} de ${p.totalParcelas}` : '—'}</td><td style={{textAlign:'right'}}><b>{brl.format(n(p.valor))}</b></td></tr>)}</tbody></table></div></section></>}
  </main>;
}
