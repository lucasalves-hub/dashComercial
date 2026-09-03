'use client';

import Image from 'next/image';

type TelaAtual = 'custos' | 'turmas' | 'executivo' | 'entradas' | 'comissionamento';
type PortalHeaderProps = {
  titulo: string;
  descricao: string;
  atual: TelaAtual;
  email: string;
  sair: () => Promise<void>;
  referencia?: string;
  atualizadoEm?: string;
};

function formatarAtualizacao(valor?: string) {
  if (!valor) return 'Não informado';

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data);
}

export default function PortalHeader({
  titulo,
  descricao,
  atual,
  email,
  sair,
  referencia = 'Visão consolidada',
  atualizadoEm,
}: PortalHeaderProps) {
  return (
    <>
      <header className="portal-header">
        <div className="brand">
          <Image
            src="/toy-formaturas-logo.png"
            alt="Toy Formaturas"
            width={220}
            height={80}
            priority
          />
          <div className="brand-copy">
            <span className="eyebrow">PORTAL COMERCIAL</span>
            <h1>{titulo}</h1>
            <p>{descricao}</p>
          </div>
        </div>

        <aside className="header-actions">
          <span>{email}</span>
          <button
            className="print-button"
            onClick={() => window.print()}
            type="button"
          >
            Gerar PDF
          </button>
          <form action={sair}>
            <button type="submit">Sair</button>
          </form>
        </aside>
      </header>

      <nav className="portal-nav" aria-label="Navegação principal">
        <a className={atual === 'executivo' ? 'active' : ''} href="/resumo-executivo">
          Resumo executivo
        </a>
        <a className={atual === 'custos' ? 'active' : ''} href="/">
          Custos comerciais
        </a>
        <a className={atual === 'entradas' ? 'active' : ''} href="/entradas-projetadas">
          Entradas projetadas
        </a>
        <a className={atual === 'turmas' ? 'active' : ''} href="/turmas-ganhas">
          Turmas ganhas
        </a>
      </nav>

      <section className="data-reference" aria-label="Contexto dos dados exibidos">
        <span>Referência: <b>{referencia}</b></span>
        {atualizadoEm && <span>Atualizado: <b>{formatarAtualizacao(atualizadoEm)}</b></span>}
      </section>
    </>
  );
}
