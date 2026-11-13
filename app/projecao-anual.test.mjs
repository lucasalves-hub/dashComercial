import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calendarioComercial, mesesDaProjecao } from './projecao-anual.ts';

test('novembro inclui os meses sem fechamento, independente da competência financeira', () => {
  const referencia = calendarioComercial(new Date('2026-11-13T15:00:00Z'));
  assert.equal(mesesDaProjecao(2026, referencia), 11);
  const feesPorMes = [100, 100, 100, 100, 100, 100, 100, 100, 0, 0, 300];
  assert.equal(feesPorMes.reduce((a, b) => a + b, 0) / mesesDaProjecao(2026, referencia) * 12, 1200);
});

test('anos encerrados usam 12 meses e anos futuros ou visão consolidada não projetam', () => {
  const referencia = { ano: 2026, mes: 11 };
  assert.equal(mesesDaProjecao(2025, referencia), 12);
  assert.equal(mesesDaProjecao(2027, referencia), 0);
  assert.equal(mesesDaProjecao(Number('todos'), referencia), 0);
});

test('virada do mês respeita o calendário de São Paulo', () => {
  assert.deepEqual(calendarioComercial(new Date('2026-11-01T02:59:59Z')), { ano: 2026, mes: 10 });
  assert.deepEqual(calendarioComercial(new Date('2026-11-01T03:00:00Z')), { ano: 2026, mes: 11 });
  assert.equal(mesesDaProjecao(2026, { ano: 2026, mes: 1 }), 1);
  assert.equal(mesesDaProjecao(2026, { ano: 2026, mes: 12 }), 12);
});
