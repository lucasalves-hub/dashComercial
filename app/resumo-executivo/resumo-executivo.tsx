'use client';

import { useMemo, useState } from 'react';
import PortalHeader from '../portal-header';

const compacto = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0, notation: 'compact', compactDisplay: 'short' });
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const numero = (valor: unknown) => typeof valor === 'number' ? valor : Number(String(valor ?? '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
const pegar = (registro: any, ...chaves: string[]) => chaves.map(chave => registro[chave]).find(valor => valor !== undefined && valor !== null && valor !== '');
const anoDe = (valor: unknown) => { const encontrado = String(valor ?? '').match(/20\d{2}|\d{2}(?=\D*$)/); return encontrado ? Number(encontrado[0].length === 2 ? '20' + encontrado[0] : encontrado[0]) : 0; };
const percentual = (valor: number, base: number) => base ? (valor / base * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%' : '—';

export default function ResumoExecutivo({ dados, email, sair }: { dados: any; email: string; sair: () => Promise<void> }) {
  const [ano, setAno] = useState('2026');
  const carteira = useMemo(() => (dados.turmasGanhas || []).map((registro: any) => {
    const fee = numero(pegar(registro, 'fee', 'FEE'));
    const beneficio = numero(pegar(registro, 'beneficio', 'BENEFÍCIO', 'BENEFICIOS'));
    const custo = numero(pegar(registro, 'custoComercial', 'CUSTO COMERCIAL'));
    const imposto = numero(pegar(registro, 'imposto', 'IMPOSTO'));
    const ganhou = pegar(registro, 'ganhou', 'GANHOU');
    const base = fee - beneficio - custo;
    return { job: String(pegar(registro, 'job', 'JOB') || '—'), turma: String(pegar(registro, 'turma', 'TURMA') || 'Sem identificação'), ano: anoDe(ganhou), faturamento: numero(pegar(registro, 'faturamento', 'FATURAMENTO')), fee, imposto, beneficio, custo, base, comissaoTime: base * .10, comissaoLideranca: base * .02, margemFinal: base * .88 };
  }), [dados]);
  const linhas = carteira.filter((turma: any) => ano === 'todos' || turma.ano === Number(ano));
  const soma = (campo: string, lista = linhas) => lista.reduce((acumulado: number, turma: any) => acumulado + turma[campo], 0);
  const fee = soma('fee'), imposto = soma('imposto'), beneficios = soma('beneficio'), custos = soma('custo'), base = soma('base'), comissaoTime = soma('comissaoTime'), comissaoLideranca = soma('comissaoLideranca'), margemFinal = soma('margemFinal');
  const meta = Number(dados.metasFee?.[Number(ano)]?.meta || 0);
  const top = [...linhas].sort((a: any, b: any) => b.margemFinal - a.margemFinal).slice(0, 5);
  const maximo = Math.max(1, ...top.map((turma: any) => Math.max(turma.margemFinal, 0)));
  const semFaturamento = linhas.filter((turma: any) => !turma.faturamento).length;
  const negativos = linhas.filter((turma: any) => turma.margemFinal < 0).length;
  return <main>
    <PortalHeader titulo="Resumo executivo" descricao="Crescimento, qualidade da carteira e principais riscos comerciais." atual="executivo" email={email} sair={sair} referencia={ano === 'todos' ? 'Carteira consolidada' : `Ano comercial ${ano}`} atualizadoEm={dados.atualizadoEm} />
    <section className="toolbar"><label>Competência comercial<select value={ano} onChange={e => setAno(e.target.value)}><option value="todos">Todos os anos</option><option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option></select></label><span>{linhas.length} turmas na carteira</span><small>Atualizado: {dados.atualizadoEm}</small></section>
    <section className="cards"><Card t="FEE CONTRATADO" v={compacto.format(fee)} d={meta ? `${percentual(fee, meta)} da meta anual` : 'Meta não definida'} hot /><Card t="VALOR COBRADO DO CLIENTE" v={compacto.format(fee + imposto)} d={`Fee ${compacto.format(fee)} + imposto ${compacto.format(imposto)}`} /><Card t="CUSTO DE AQUISIÇÃO (GANHAS)" v={compacto.format(custos)} d={`${percentual(custos, fee)} do fee contratado`} /><Card t="MARGEM FINAL DA EMPRESA" v={compacto.format(margemFinal)} d={`${percentual(margemFinal, fee)} do fee; após comissão`} /></section>
    <section className="grid"><article><h2>Top 5 contribuições de margem final</h2><p>Visão executiva; o detalhamento por turma permanece em Turmas Ganhas.</p><div style={{ display: 'grid', gap: 10 }}>{top.map((turma: any) => <div key={turma.job + turma.turma} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 90px', gap: 10, alignItems: 'center' }}><span title={turma.turma}>{turma.turma.slice(0, 25)}</span><i style={{ display: 'block', height: 10, borderRadius: 99, background: turma.margemFinal < 0 ? '#c84747' : '#8d2aac', width: `${Math.max(4, Math.max(turma.margemFinal, 0) / maximo * 100)}%` }} /><b style={{ textAlign: 'right' }}>{compacto.format(turma.margemFinal)}</b></div>)}</div></article><article><h2>Qualidade e riscos</h2><dl><dt>Sem faturamento informado</dt><dd className={semFaturamento ? 'risk' : 'ok'}>{semFaturamento}</dd><dt>Margem final negativa</dt><dd className={negativos ? 'risk' : 'ok'}>{negativos}</dd><dt>Benefícios comprometidos</dt><dd>{compacto.format(beneficios)}</dd><dt>Status de contrato</dt><dd className="risk">A estruturar</dd></dl></article></section>
    <section className="panel"><h2>Waterfall de rentabilidade comercial</h2><p>O imposto é cobrado por fora sobre o fee: ele compõe o valor ao cliente, mas não reduz a margem do projeto.</p><div className="table-wrap"><table><thead><tr><th>Fee contratado</th><th style={{ textAlign: 'right' }}>Imposto cobrado à parte</th><th style={{ textAlign: 'right' }}>Custo de aquisição</th><th style={{ textAlign: 'right' }}>Benefícios</th><th style={{ textAlign: 'right' }}>Base comissionável</th><th style={{ textAlign: 'right' }}>Time (10%)</th><th style={{ textAlign: 'right' }}>Liderança (2%)</th><th style={{ textAlign: 'right' }}>Margem final</th></tr></thead><tbody><tr><td><b>{brl.format(fee)}</b></td><td style={{ textAlign: 'right' }}>{brl.format(imposto)}</td><td style={{ textAlign: 'right' }}>{brl.format(custos)}</td><td style={{ textAlign: 'right' }}>{brl.format(beneficios)}</td><td style={{ textAlign: 'right' }}>{brl.format(base)}</td><td style={{ textAlign: 'right' }}>{brl.format(comissaoTime)}</td><td style={{ textAlign: 'right' }}>{brl.format(comissaoLideranca)}</td><td style={{ textAlign: 'right' }}><b>{brl.format(margemFinal)}</b></td></tr></tbody></table></div></section>
  </main>;
}

function Card({ t, v, d, hot }: { t: string; v: string; d: string; hot?: boolean }) { return <article className={hot ? 'hot' : ''}><small>{t}</small><strong>{v}</strong><span>{d}</span></article>; }
