'use client';
import Image from 'next/image';

export default function PortalHeader({ titulo, descricao, atual, email, sair }: { titulo: string; descricao: string; atual: 'custos' | 'turmas' | 'executivo' | 'entradas'; email: string; sair: () => Promise<void> }) {
  return <><header className="portal-header"><div className="brand"><Image src="/toy-formaturas-logo.png" alt="Toy Formaturas" width={220} height={80} priority /><div className="brand-copy"><span className="eyebrow">PORTAL COMERCIAL</span><h1>{titulo}</h1><p>{descricao}</p></div></div><aside className="header-actions"><span>{email}</span><form action={sair}><button>Sair</button></form></aside></header><nav className="portal-nav"><a className={atual === 'executivo' ? 'active' : ''} href="/resumo-executivo">Resumo executivo</a><a className={atual === 'custos' ? 'active' : ''} href="/">Custos comerciais</a><a className={atual === 'entradas' ? 'active' : ''} href="/entradas-projetadas">Entradas projetadas</a><a className={atual === 'turmas' ? 'active' : ''} href="/turmas-ganhas">Turmas ganhas</a></nav></>;
}
