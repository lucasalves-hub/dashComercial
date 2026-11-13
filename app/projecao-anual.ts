/** Referência comercial independente da competência de recebimentos. */
export function calendarioComercial(agora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: 'numeric',
  }).formatToParts(agora);
  return {
    ano: Number(partes.find(p => p.type === 'year')!.value),
    mes: Number(partes.find(p => p.type === 'month')!.value),
  };
}

export function mesesDaProjecao(ano: number, referencia: { ano: number; mes: number }) {
  if (!ano || ano > referencia.ano) return 0;
  return ano < referencia.ano ? 12 : referencia.mes;
}
