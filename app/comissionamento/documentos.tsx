'use client';

import { useState } from 'react';

const actionStyle = { display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #b24bd6', borderRadius: 10, padding: '9px 13px', color: '#762095', background: '#fff', fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 10px rgba(116, 32, 149, .10)' };

export default function DocumentosComissionamento({ competenciaInicial, colaboradores }: { competenciaInicial: string; colaboradores: string[] }) {
  const [colaborador, setColaborador] = useState('');
  const reciboUrl = `/comissionamento/demonstrativo?competencia=${encodeURIComponent(competenciaInicial)}&colaborador=${encodeURIComponent(colaborador)}`;
  return <section className="toolbar" style={{ justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
    <a style={actionStyle} href="/comissionamento/relatorio" target="_blank" rel="noreferrer"><span aria-hidden>▣</span> Relatório CFO</a>
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#66506f' }}>Demonstrativo<select value={colaborador} onChange={e => setColaborador(e.target.value)}><option value="">Selecionar colaborador</option>{colaboradores.map(nome => <option key={nome} value={nome}>{nome}</option>)}</select></label>
    {colaborador ? <a style={{ ...actionStyle, background: '#8127a6', color: '#fff' }} href={reciboUrl} target="_blank" rel="noreferrer"><span aria-hidden>▤</span> Gerar demonstrativo</a> : <span style={{ ...actionStyle, opacity: .45, cursor: 'not-allowed' }}><span aria-hidden>▤</span> Gerar demonstrativo</span>}
  </section>;
}
