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
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState('');
  const mensal = api.mensal || [];
  const linhas = useMemo(() => (api.parcelas || []).filter((p: any) => (!competencia || p.competencia === competencia) && `${p.colaborador} ${p.turma} ${p.job}`.toLowerCase().includes(busca.toLowerCase())), [api.parcelas, competencia, busca]);
  const previsto = linhas.reduce((s: number, p: any) => s + n(p.valor), 0);
  const colaboradores = new Set(linhas.map((p: any) => p.colaborador)).size;
  const totalProgramado = n(api.totalProgramado);
  const porPessoa = useMemo(() => Object.values(linhas.reduce((acc: Record<string, any>, p: any) => { const k = p.colaborador || 'Não identificado'; acc[k] ||= { nome: k, previsto: 0, turmas: 0 }; acc[k].previsto += n(p.valor); acc[k].turmas += 1; return acc; }, {})).sort((a: any, b: any) => b.previsto - a.previsto), [linhas]);
  const nomes = useMemo<string[]>(
  () =>
    Array.from(
      new Set<string>(
        (api.parcelas || [])
          .map((p: any): string => String(p.colaborador || ''))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'pt-BR')),
  [api.parcelas]
);
  const pessoa = colaboradorSelecionado || nomes[0] || '';
  const parcelasPessoa = linhas.filter((p: any) => p.colaborador === pessoa);
  const totalPessoaAno = (api.parcelas || []).filter((p: any) => p.colaborador === pessoa).reduce((s: number, p: any) => s + n(p.valor), 0);
  return <main>
    <PortalHeader titulo="Comissionamento" descricao="Parcelas previstas por colaborador e turma, conforme a base operacional do Financeiro." atual="comissionamento" email={email} sair={sair} referencia={competencia ? `Competência ${competencia}` : 'Base operacional'} atualizadoEm={api.atualizadoEm || dados.atualizadoEm} />
    {!api.mensal && <section className="panel"><h2>Integração em preparação</h2><p>A página já está pronta. A próxima atualização da API incluirá o consolidado da planilha de comissionamento.</p></section>}
    {api.mensal && <><section className="toolbar"><label>Competência<select value={competencia} onChange={e => setCompetencia(e.target.value)}>{mensal.map((m: any) => <option key={m.competencia} value={m.competencia}>{m.competencia}</option>)}</select></label><label>Buscar colaborador, turma ou JOB<input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Ex.: Lucas, PUC ou 2750" /></label><span>{linhas.length} parcelas na visão</span></section>
    <section className="cards"><Card titulo="COMISSÃO PREVISTA" valor={brl.format(previsto)} descricao="Parcelas agendadas na competência" destaque /><Card titulo="COLABORADORES" valor={String(colaboradores)} descricao="Com parcela prevista no período" /><Card titulo="TURMAS / PARCELAS" valor={String(linhas.length)} descricao="Registros que compõem a competência" /><Card titulo="TOTAL PROGRAMADO" valor={brl.format(totalProgramado)} descricao="Todas as parcelas da base atual" /></section>
    <section className="grid"><article><h2>Previsão por competência</h2><p>Programação da comissão para 2026. Use o seletor acima para cruzar com o detalhamento.</p><div className="chart">{mensal.map((m: any) => <div key={m.competencia} title={`${m.competencia}: ${brl.format(n(m.valor))}`}><i className="new" style={{ height: `${Math.max(4, (n(m.valor) / Math.max(...mensal.map((x: any) => n(x.valor)), 1)) * 175)}px` }} /><small>{m.competencia.slice(5,7)}/{m.competencia.slice(2,4)}</small></div>)}</div></article><article><h2>Controle financeiro</h2><p>Os valores desta entrega são programados. A baixa efetiva e ajustes entrarão na próxima camada.</p><dl><dt>Programado em 2026</dt><dd>{brl.format(totalProgramado)}</dd><dt>Dados de pagamento</dt><dd className="risk">Em integração</dd><dt>Recibos</dt><dd>Disponíveis no Drive</dd></dl></article></section>
    <section className="panel" style={{background:'#fbf7fc'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'end',gap:16,flexWrap:'wrap'}}><div><small style={{color:'#8127a6',fontWeight:800,letterSpacing:'.08em'}}>VISÃO INDIVIDUAL · MODELO DE RECIBO</small><h2 style={{marginTop:5}}>Composição da comissão por colaborador</h2><p>Camada de consulta; o acesso individual será aplicado com as permissões.</p></div><label style={{display:'grid',gap:5,color:'#766d7d',fontSize:11,fontWeight:800,textTransform:'uppercase'}}>Colaborador<select value={pessoa} onChange={e=>setColaboradorSelecionado(e.target.value)} style={{border:'1px solid #dcd2e1',borderRadius:8,padding:'9px 10px',background:'#fff'}}>{nomes.map(nome=><option key={nome} value={nome}>{nome}</option>)}</select></label></div><section className="cards" style={{marginTop:16}}><Card titulo="PREVISTO NA COMPETÊNCIA" valor={brl.format(parcelasPessoa.reduce((s:number,p:any)=>s+n(p.valor),0))} descricao={`${parcelasPessoa.length} parcelas de ${pessoa || '—'}`} destaque/><Card titulo="PROGRAMADO EM 2026" valor={brl.format(totalPessoaAno)} descricao="Soma das parcelas do colaborador"/><Card titulo="TURMAS NO MÊS" valor={String(new Set(parcelasPessoa.map((p:any)=>p.job)).size)} descricao="Turmas que compõem o recebimento"/><Card titulo="PAGAMENTO REALIZADO" valor="Em integração" descricao="Não exibido até a baixa ser validada"/></section></section>
    <section className="panel"><h2>Resumo por colaborador</h2><div className="table-wrap"><table><thead><tr><th>Colaborador</th><th style={{textAlign:'right'}}>Turmas / parcelas</th><th style={{textAlign:'right'}}>Previsto na competência</th></tr></thead><tbody>{porPessoa.map((p: any) => <tr key={p.nome}><td>{p.nome}</td><td style={{textAlign:'right'}}>{p.turmas}</td><td style={{textAlign:'right'}}><b>{brl.format(p.previsto)}</b></td></tr>)}</tbody></table></div></section>
    <section className="panel"><h2>Detalhamento por turma</h2><p>Os valores vêm diretamente das parcelas mensais programadas, sem recalcular benefícios ou despesas no portal.</p><div className="table-wrap"><table><thead><tr><th>Colaborador</th><th>JOB</th><th>Turma</th><th style={{textAlign:'right'}}>Fee líquido</th><th style={{textAlign:'right'}}>%</th><th>Parcela</th><th style={{textAlign:'right'}}>Valor previsto</th></tr></thead><tbody>{linhas.map((p: any, i: number) => <tr key={`${p.job}-${p.colaborador}-${i}`}><td>{p.colaborador}</td><td>{p.job}</td><td>{p.turma}</td><td style={{textAlign:'right'}}>{brl.format(n(p.feeLiquido))}</td><td style={{textAlign:'right'}}>{n(p.percentual).toLocaleString('pt-BR',{style:'percent',maximumFractionDigits:1})}</td><td>{p.parcelaAtual && p.totalParcelas ? `${p.parcelaAtual} de ${p.totalParcelas}` : '—'}</td><td style={{textAlign:'right'}}><b>{brl.format(n(p.valor))}</b></td></tr>)}</tbody></table></div></section></>}
  </main>;
}
