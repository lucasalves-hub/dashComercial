'use client';

import { useState } from 'react';

export default function DocumentosComissionamento({ competenciaInicial, colaboradores }: { competenciaInicial: string; colaboradores: string[] }) {
  const [colaborador, setColaborador] = useState(colaboradores[0] || '');
  const reciboUrl = `/comissionamento/demonstrativo?competencia=${encodeURIComponent(competenciaInicial)}&colaborador=${encodeURIComponent(colaborador)}`;
  return <section className="toolbar" style={{ justifyContent: 'flex-end', gap: 10 }}>
    <a className="print-button" href="/comissionamento/relatorio" target="_blank" rel="noreferrer">Relatório CFO</a>
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Demonstrativo<select value={colaborador} onChange={e => setColaborador(e.target.value)}>{colaboradores.map(nome => <option key={nome} value={nome}>{nome}</option>)}</select></label>
    <a className="print-button" href={reciboUrl} target="_blank" rel="noreferrer">Gerar demonstrativo</a>
  </section>;
}
