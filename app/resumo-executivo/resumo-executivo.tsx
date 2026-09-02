'use client';

import { useMemo, useState } from 'react';
import PortalHeader from '../portal-header';
import styles from './resumo-executivo.module.css';

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const compacto = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
  notation: 'compact',
  compactDisplay: 'short',
});

function numero(valor: unknown) {
  if (typeof valor === 'number') return valor;
  const texto = String(valor ?? '').replace('R$', '').trim();
  if (!texto) return 0;
  if (texto.includes(',') && texto.includes('.')) {
    return Number(texto.replace(/\./g, '').replace(',', '.')) || 0;
  }
  return Number(texto.replace(',', '.')) || 0;
}

function pegar(registro: any, ...chaves: string[]) {
  return chaves
    .map((chave) => registro[chave])
    .find((valor) => valor !== undefined && valor !== null && valor !== '');
}

function anoDe(valor: unknown) {
  const encontrado = String(valor ?? '').match(/20\d{2}|\d{2}(?=\D*$)/);
  return encontrado
    ? Number(encontrado[0].length === 2 ? `20${encontrado[0]}` : encontrado[0])
    : 0;
}

function percentual(valor: number, base: number) {
  return base
    ? `${(valor / base * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
    : '—';
}

function faixaMargem(valor: number) {
  if (valor >= 0.7) return { texto: 'Saudável', classe: styles.verde };
  if (valor >= 0.5) return { texto: 'Atenção', classe: styles.amarelo };
  return { texto: 'Crítica', classe: styles.vermelho };
}

function competenciaAtual(dados: any) {
  const competencia = dados.projecaoEntradas?.mensal?.[0]?.competencia;
  const encontrado = String(competencia || '').match(/^(\d{4})-(\d{2})$/);
  if (!encontrado) return null;
  return { ano: Number(encontrado[1]), mes: Number(encontrado[2]) };
}

function prazoEmMeses(inicio?: string, fim?: string) {
  const nomes: Record<string, number> = {
    jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
    jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
  };
  const ler = (valor?: string) => {
    const texto = String(valor || '').toLowerCase().replace('.', '');
    const encontrado = texto.match(/(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[/\s-]*(\d{2,4})/);
    if (!encontrado) return null;
    const ano = Number(encontrado[2].length === 2 ? `20${encontrado[2]}` : encontrado[2]);
    return { ano, mes: nomes[encontrado[1]] };
  };
  const inicioLido = ler(inicio);
  const fimLido = ler(fim);
  if (!inicioLido || !fimLido) return null;
  return Math.max(0, (fimLido.ano - inicioLido.ano) * 12 + fimLido.mes - inicioLido.mes + 1);
}

type CardProps = {
  titulo: string;
  valor: string;
  descricao: string;
  principal?: boolean;
  ajuda?: string;
};

function Card({ titulo, valor, descricao, principal, ajuda }: CardProps) {
  return (
    <article className={principal ? `${styles.card} ${styles.principal}` : styles.card}>
      <small>{titulo}{ajuda && <span className={styles.info} title={ajuda} aria-label={ajuda}>ⓘ</span>}</small>
      <strong>{valor}</strong>
      <span>{descricao}</span>
    </article>
  );
}

export default function ResumoExecutivo({
  dados,
  email,
  sair,
}: {
  dados: any;
  email: string;
  sair: () => Promise<void>;
}) {
  const [ano, setAno] = useState('2026');
  const [empresa, setEmpresa] = useState('TODAS');

  const carteira = useMemo(() => (
    dados.turmasGanhas || []
  ).map((registro: any) => {
    const fee = numero(pegar(registro, 'fee', 'FEE'));
    const beneficio = numero(pegar(registro, 'beneficio', 'BENEFÍCIO', 'BENEFICIOS'));
    const custo = numero(pegar(registro, 'custoComercial', 'CUSTO COMERCIAL'));
    const imposto = numero(pegar(registro, 'imposto', 'IMPOSTO'));
    const ganhou = pegar(registro, 'ganhou', 'GANHOU');
    const base = fee - beneficio - custo;
    const contrato = registro.contrato || {};

    return {
      job: String(pegar(registro, 'job', 'JOB') || '—'),
      turma: String(pegar(registro, 'turma', 'TURMA') || 'Sem identificação'),
      empresa: String(pegar(registro, 'empresa', 'cluster', 'CLUSTER') || '').toUpperCase(),
      ano: anoDe(ganhou),
      faturamento: numero(pegar(registro, 'faturamento', 'FATURAMENTO')),
      fee,
      imposto,
      beneficio,
      custo,
      base,
      comissionamento: base * 0.12,
      margemFinal: base * 0.88,
      margemPct: fee ? base * 0.88 / fee : 0,
      temContrato: Boolean(registro.temContrato || contrato.status === 'ASSINADO'),
      inicioFee: contrato.inicioFee || '',
      fimFee: contrato.fimFee || '',
    };
  }), [dados]);

  const linhas = carteira.filter((turma: any) => (
    (ano === 'todos' || turma.ano === Number(ano)) &&
    (empresa === 'TODAS' || turma.empresa === empresa)
  ));

  const soma = (campo: string, lista = linhas) => (
    lista.reduce((acumulado: number, turma: any) => acumulado + turma[campo], 0)
  );

  const fee = soma('fee');
  const imposto = soma('imposto');
  const beneficios = soma('beneficio');
  const custos = soma('custo');
  const base = soma('base');
  const margemFinal = soma('margemFinal');
  const meta = Number(dados.metasFee?.[Number(ano)]?.meta || 0);
  const top = [...linhas].sort((a: any, b: any) => b.margemFinal - a.margemFinal).slice(0, 5);
  const top3 = top.slice(0, 3).reduce((total: number, turma: any) => total + turma.margemFinal, 0);
  const maximo = Math.max(1, ...top.map((turma: any) => Math.max(turma.margemFinal, 0)));
  const semFaturamento = linhas.filter((turma: any) => !turma.faturamento).length;
  const negativos = linhas.filter((turma: any) => turma.margemFinal < 0).length;
  const semContrato = linhas.filter((turma: any) => !turma.temContrato).length;
  const contratos = linhas.filter((turma: any) => turma.temContrato).length;
  const prazos = linhas.map((turma: any) => prazoEmMeses(turma.inicioFee, turma.fimFee)).filter((valor: any) => valor !== null);
  const prazoMedio = prazos.length ? prazos.reduce((total: number, valor: number) => total + valor, 0) / prazos.length : 0;

  const referencia = competenciaAtual(dados);
  const mesesDecorridos = referencia && referencia.ano === Number(ano)
    ? Math.max(1, referencia.mes - 1)
    : 0;
  const ritmoMensal = mesesDecorridos ? fee / mesesDecorridos : 0;
  const fechamentoAnual = mesesDecorridos ? ritmoMensal * 12 : 0;

  return (
    <main>
      <PortalHeader
        titulo="Resumo executivo"
        descricao="Resultado, saúde da carteira e riscos comerciais prioritários."
        atual="executivo"
        email={email}
        sair={sair}
        referencia={ano === 'todos' ? 'Carteira consolidada' : `Ano comercial ${ano}`}
        atualizadoEm={dados.atualizadoEm}
      />

      <section className="toolbar">
        <label>
          Ano comercial
          <select value={ano} onChange={(event) => setAno(event.target.value)}>
            <option value="todos">Todos os anos</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </label>
        <label>
          Empresa
          <select value={empresa} onChange={(event) => setEmpresa(event.target.value)}>
            <option value="TODAS">Consolidado</option>
            <option value="FORMA">FORMA</option>
            <option value="MED">MED</option>
          </select>
        </label>
        <span>{linhas.length} turmas na visão</span>
      </section>

      <section className={styles.cardsPrincipais}>
        <Card titulo="FEE CONTRATADO" valor={compacto.format(fee)} descricao={meta ? `${percentual(fee, meta)} da meta anual` : 'Meta não definida'} principal />
        <Card titulo="MARGEM FINAL" valor={compacto.format(margemFinal)} descricao={`${percentual(margemFinal, fee)} do fee contratado`} principal ajuda="Fee menos custo de aquisição, benefícios e comissionamento total de 12% da base comissionável: 10% do time comercial e 2% da liderança comercial." />
      </section>

      <section className={styles.cardsSecundarios}>
        <Card titulo="VALOR COBRADO DO CLIENTE" valor={compacto.format(fee + imposto)} descricao={`Fee ${compacto.format(fee)} + imposto`} />
        <Card titulo="CUSTO DE AQUISIÇÃO" valor={compacto.format(custos)} descricao={`${percentual(custos, fee)} do fee contratado`} />
        <Card titulo="TICKET MÉDIO DE FEE" valor={compacto.format(linhas.length ? fee / linhas.length : 0)} descricao="Por turma na visão selecionada" />
        <Card titulo="PRAZO MÉDIO DE FEE" valor={prazoMedio ? `${prazoMedio.toFixed(0)} meses` : '—'} descricao="Somente contratos identificados" />
      </section>

      <section className="grid">
        <article>
          <h2>Top 5 contribuições de margem final</h2>
          <p>Participação na margem consolidada e qualidade individual da rentabilidade.</p>
          <div className={styles.ranking}>
            {top.map((turma: any) => {
              const faixa = faixaMargem(turma.margemPct);
              return (
                <div className={styles.rankingLinha} key={`${turma.job}-${turma.turma}`}>
                  <span className={styles.nomeTurma} title={turma.turma}>{turma.turma}</span>
                  <i style={{ width: `${Math.max(4, Math.max(turma.margemFinal, 0) / maximo * 100)}%` }} />
                  <b>{compacto.format(turma.margemFinal)}</b>
                  <small title="Participação da margem final desta turma no total de margem das turmas selecionadas.">{percentual(turma.margemFinal, margemFinal)} da margem <span className={styles.info}>ⓘ</span></small>
                  <em className={faixa.classe} title="Margem final dividida pelo fee contratado da própria turma. Faixas: 70% ou mais = saudável; de 50% a 69,9% = atenção; abaixo de 50% = crítica.">{percentual(turma.margemFinal, turma.fee)} · {faixa.texto} <span className={styles.info}>ⓘ</span></em>
                </div>
              );
            })}
          </div>
        </article>

        <article>
          <h2>Qualidade e riscos</h2>
          <div className={styles.alertas}>
            <div className={semContrato ? styles.alerta : styles.saude}>
              <small>CONTRATOS PENDENTES</small>
              <b>{semContrato}</b>
              <span>{semContrato ? 'Exigem assinatura antes de compor projeção de entrada.' : 'Carteira com contratos identificados.'}</span>
            </div>
            <div className={top3 / Math.max(1, margemFinal) >= 0.5 ? styles.alertaAmarelo : styles.saude}>
              <small>CONCENTRAÇÃO TOP 3</small>
              <b>{percentual(top3, margemFinal)}</b>
              <span>Da margem final está concentrada nas três maiores turmas.</span>
            </div>
          </div>
          <dl>
            <dt>Contratos identificados</dt><dd className="ok">{contratos}</dd>
            <dt>Margem final negativa</dt><dd className={negativos ? 'risk' : 'ok'}>{negativos}</dd>
            <dt>Sem faturamento informado</dt><dd className={semFaturamento ? 'risk' : 'ok'}>{semFaturamento}</dd>
            <dt>Benefícios comprometidos</dt><dd>{compacto.format(beneficios)}</dd>
          </dl>
        </article>
      </section>

      {mesesDecorridos > 0 && (
        <section className={styles.fechamento}>
          <div>
            <small>PROJEÇÃO DE FECHAMENTO ANUAL</small>
            <h2>No ritmo atual, {ano} encerra em {brl.format(fechamentoAnual)} de fee.</h2>
            <p>Ritmo observado: {brl.format(ritmoMensal)} por mês, considerando {mesesDecorridos} meses completos.</p>
          </div>
          {meta > 0 && <b>{percentual(fechamentoAnual, meta)} da meta anual</b>}
        </section>
      )}

      <section className="panel">
        <h2>Waterfall de rentabilidade comercial</h2>
        <p>Imposto é cobrado à parte; as deduções abaixo são apresentadas como percentual do fee contratado.</p>
        <div className={styles.waterfall}>
          <Etapa nome="Fee contratado" valor={fee} percentualValor={100} destaque />
          <Etapa nome="Custo de aquisição" valor={-custos} percentualValor={fee ? -custos / fee * 100 : 0} />
          <Etapa nome="Benefícios" valor={-beneficios} percentualValor={fee ? -beneficios / fee * 100 : 0} />
          <Etapa nome="Base comissionável" valor={base} percentualValor={fee ? base / fee * 100 : 0} destaque />
          <Etapa nome="Comissionamento total" valor={-base * 0.12} percentualValor={fee ? -base * 0.12 / fee * 100 : 0} descricao="12% da base comissionável: 10% destinado ao time comercial e 2% à liderança comercial." />
          <Etapa nome="Margem final" valor={margemFinal} percentualValor={fee ? margemFinal / fee * 100 : 0} destaque />
        </div>
      </section>
    </main>
  );
}

function Etapa({ nome, valor, percentualValor, destaque, descricao }: { nome: string; valor: number; percentualValor: number; destaque?: boolean; descricao?: string }) {
  return (
    <div className={destaque ? `${styles.etapa} ${styles.etapaDestaque}` : styles.etapa}>
      <small>{nome}{descricao && <span className={styles.info} title={descricao} aria-label={descricao}>ⓘ</span>}</small>
      <b>{brl.format(valor)}</b>
      <span>{percentualValor >= 0 ? '' : '− '}{Math.abs(percentualValor).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% do fee</span>
    </div>
  );
}
