const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const state = {
  entradas: [],
  saidas: [],
  entregas: [],
  dividas: [],
  devedores: [],
  netflixPeople: ['Moises', 'Marcelo', 'Vitoria', 'Fernanda']
};

const fixedEntregaPrices = { 'Pripel Postagem': 5 };
const LIMITES_CARTAO = { INTER: 2000, NEON: 500 };

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatCurrency(v) {
  return BRL.format(Number(v) || 0);
}

function openWhatsApp(message) {
  const msg = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

function bindNavigation(menuSelector) {
  const menuButtons = [...document.querySelectorAll(`${menuSelector} button[data-target]`)];
  menuButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      document.querySelectorAll('.panel').forEach((panel) => panel.classList.remove('active'));
      document.getElementById(target).classList.add('active');

      document.querySelectorAll('#mainMenu button, #mobileMenu button').forEach((button) => {
        button.classList.toggle('active', button.dataset.target === target);
      });
    });
  });
}

function applyFixedDates() {
  const date = todayISO();
  document.getElementById('entradaDataFixa').value = date;
  document.getElementById('saidaDataFixa').value = date;
  document.getElementById('dividaVencimentoFixo').value = date;
}

function bindEntradasSaidas() {
  document.getElementById('entradaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));

    state.entradas.push({
      descricao: data.descricao,
      valor: Number(data.valor),
      data: todayISO()
    });

    e.target.reset();
    applyFixedDates();
    renderEntradasSaidas();
  });

  document.getElementById('saidaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));

    state.saidas.push({
      descricao: data.descricao,
      valor: Number(data.valor),
      responsavel: data.responsavel,
      cartao: data.cartao,
      parcelas: Number(data.parcelas),
      valorParcela: Number(data.valor) / Number(data.parcelas),
      data: todayISO()
    });

    e.target.reset();
    applyFixedDates();
    renderEntradasSaidas();
    renderCardUsage();
  });
}

function renderEntradasSaidas() {
  document.getElementById('entradaList').innerHTML = state.entradas
    .map((item) => `<li>${item.data} · ${item.descricao}: <strong>${formatCurrency(item.valor)}</strong></li>`)
    .join('');

  document.getElementById('saidaList').innerHTML = state.saidas
    .map((item) => `
      <li>
        ${item.data} · ${item.descricao} (${item.responsavel}) · ${item.cartao} · ${item.parcelas}x de ${formatCurrency(item.valorParcela)}
        <strong>${formatCurrency(item.valor)}</strong>
      </li>
    `)
    .join('');

  updateLucasPanel();
}

function bindEntregas() {
  const form = document.getElementById('entregaForm');
  const categoriaEl = form.querySelector('[name="categoria"]');
  const valorEl = form.querySelector('[name="valorUnitario"]');

  categoriaEl.addEventListener('change', () => {
    const fixed = fixedEntregaPrices[categoriaEl.value];
    if (fixed) {
      valorEl.value = fixed;
      valorEl.readOnly = true;
    } else {
      valorEl.readOnly = false;
      valorEl.value = '';
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    state.entregas.push({
      categoria: data.categoria,
      quantidade: Number(data.quantidade),
      valorUnitario: fixedEntregaPrices[data.categoria] ?? Number(data.valorUnitario)
    });

    form.reset();
    valorEl.readOnly = false;
    renderEntregaResumo();
  });

  document.getElementById('grupoAReport').addEventListener('click', () => sendEntregaReport(['Expresso', 'iFood']));
  document.getElementById('grupoBReport').addEventListener('click', () => sendEntregaReport(['Pripel Entregas', 'Pripel Postagem']));
}

function renderEntregaResumo() {
  const grouped = state.entregas.reduce((acc, entrega) => {
    if (!acc[entrega.categoria]) {
      acc[entrega.categoria] = { quantidade: 0, valorTotal: 0, valorUnitario: entrega.valorUnitario };
    }
    acc[entrega.categoria].quantidade += entrega.quantidade;
    acc[entrega.categoria].valorTotal += entrega.quantidade * entrega.valorUnitario;
    return acc;
  }, {});

  const rows = Object.entries(grouped)
    .map(([categoria, data]) => `
      <tr>
        <td>${categoria.toUpperCase()}</td>
        <td>${data.quantidade}</td>
        <td>${formatCurrency(data.valorUnitario)}</td>
        <td>${formatCurrency(data.valorTotal)}</td>
      </tr>
    `)
    .join('');

  const totalQtd = Object.values(grouped).reduce((acc, item) => acc + item.quantidade, 0);
  const totalValor = Object.values(grouped).reduce((acc, item) => acc + item.valorTotal, 0);

  document.getElementById('entregaResumoBody').innerHTML = rows
    ? `${rows}<tr><td><strong>TOTAL</strong></td><td><strong>${totalQtd}</strong></td><td>-</td><td><strong>${formatCurrency(totalValor)}</strong></td></tr>`
    : '<tr><td colspan="4">Sem dados de entregas</td></tr>';
}

function sendEntregaReport(categorias) {
  const selecionadas = state.entregas.filter((item) => categorias.includes(item.categoria));
  const qtd = selecionadas.reduce((acc, item) => acc + item.quantidade, 0);
  const total = selecionadas.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario), 0);

  openWhatsApp(`Resumo ${categorias.join(' + ')}\nQuantidade: ${qtd}\nTotal: ${formatCurrency(total)}`);
}

function initNetflix() {
  const list = document.getElementById('netflixList');
  const pendencias = document.getElementById('netflixPendencias');
  const now = new Date();

  const months = [...Array(3)].map((_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });

  list.innerHTML = state.netflixPeople
    .map((name) => `<li>${name} · ${formatCurrency(15)} <button data-cobrar="${name}">Cobrar</button></li>`)
    .join('');

  pendencias.innerHTML = state.netflixPeople
    .map((name) => `<li><strong>${name}</strong>: ${months.join(' • ')}</li>`)
    .join('');

  list.querySelectorAll('[data-cobrar]').forEach((button) => {
    button.addEventListener('click', () => {
      const pessoa = button.dataset.cobrar;
      openWhatsApp(`Olá ${pessoa}, sua mensalidade da Netflix (${formatCurrency(15)}) está pendente.`);
    });
  });
}

function getCardTotals() {
  const inter = state.saidas.filter((item) => item.cartao === 'INTER').reduce((acc, item) => acc + item.valor, 0);
  const neon = state.saidas.filter((item) => item.cartao === 'NEON').reduce((acc, item) => acc + item.valor, 0);
  return { INTER: inter, NEON: neon };
}

function renderCardUsage() {
  const totals = getCardTotals();
  document.getElementById('interUso').textContent = formatCurrency(totals.INTER);
  document.getElementById('neonUso').textContent = formatCurrency(totals.NEON);
  document.getElementById('interProgress').value = Math.min(totals.INTER, LIMITES_CARTAO.INTER);
  document.getElementById('neonProgress').value = Math.min(totals.NEON, LIMITES_CARTAO.NEON);
}

function buildCardReport(cardName) {
  const gastos = state.saidas.filter((item) => item.cartao === cardName);
  const total = gastos.reduce((acc, item) => acc + item.valor, 0);
  if (!gastos.length) {
    return `${cardName}\nSem gastos registrados.`;
  }

  const linhas = gastos
    .map((item) => `- ${item.data} | ${item.descricao} | ${item.parcelas}x de ${formatCurrency(item.valorParcela)} | Total ${formatCurrency(item.valor)}`)
    .join('\n');

  return `${cardName}\nTotal: ${formatCurrency(total)}\n\n${linhas}`;
}

function bindCardReports() {
  document.getElementById('interReportBtn').addEventListener('click', () => alert(buildCardReport('INTER')));
  document.getElementById('neonReportBtn').addEventListener('click', () => alert(buildCardReport('NEON')));

  document.getElementById('allCardsReportBtn').addEventListener('click', () => {
    const report = `${buildCardReport('INTER')}\n\n${buildCardReport('NEON')}`;
    alert(report);
  });

  document.getElementById('lucasReportBtn').addEventListener('click', () => {
    const saidasLucas = state.saidas.filter((item) => item.responsavel === 'Lucas');
    const total = saidasLucas.reduce((acc, item) => acc + item.valor, 0);
    alert(`Relatório de Saídas Lucas\nItens: ${saidasLucas.length}\nTotal: ${formatCurrency(total)}`);
  });
}

function updateLucasPanel() {
  const entradasTotal = state.entradas.reduce((acc, item) => acc + item.valor, 0);
  const saidasLucasTotal = state.saidas
    .filter((item) => item.responsavel === 'Lucas')
    .reduce((acc, item) => acc + item.valor, 0);

  const lucro = entradasTotal - saidasLucasTotal;
  const percent = Math.min((saidasLucasTotal / 1000) * 100, 100);

  document.getElementById('lucasGasto').textContent = formatCurrency(saidasLucasTotal);
  document.getElementById('lucroRealValue').textContent = formatCurrency(lucro);
  document.getElementById('lucasPercent').textContent = `${percent.toFixed(1)}%`;
  document.getElementById('lucasProgress').value = saidasLucasTotal;

  const panel = document.getElementById('lucasPanel');
  panel.classList.remove('warning', 'danger');
  if (saidasLucasTotal >= 800 && saidasLucasTotal < 1000) panel.classList.add('warning');
  if (saidasLucasTotal >= 1000) panel.classList.add('danger');
}

function bindDevedores() {
  const formDivida = document.getElementById('dividaForm');
  const formDevedor = document.getElementById('devedorForm');
  const devedorSelect = document.getElementById('devedorSelect');
  const devedorOutro = document.getElementById('devedorOutro');

  devedorSelect.addEventListener('change', () => {
    const isOutros = devedorSelect.value === 'Outros';
    devedorOutro.hidden = !isOutros;
    devedorOutro.required = isOutros;
  });

  formDivida.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(formDivida));
    state.dividas.push({
      id: crypto.randomUUID(),
      titulo: data.titulo,
      valor: Number(data.valor),
      vencimento: todayISO(),
      quitada: false
    });
    formDivida.reset();
    applyFixedDates();
    renderDividas();
  });

  formDevedor.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(formDevedor));
    const nome = data.devedor === 'Outros' ? data.devedorOutro : data.devedor;

    state.devedores.push({ nome, valor: Number(data.valor) });
    formDevedor.reset();
    devedorOutro.hidden = true;
    devedorOutro.required = false;
    renderDevedores();
  });
}

function renderDividas() {
  const list = document.getElementById('dividaList');
  list.innerHTML = state.dividas
    .map((item) => `
      <li>
        <strong>${item.titulo}</strong> · ${formatCurrency(item.valor)} · Venc.: ${item.vencimento} · ${item.quitada ? 'Quitada' : 'Aberta'}
        <div class="actions-inline">
          <button data-edit="${item.id}">Editar</button>
          <button data-quit="${item.id}">Quitar</button>
          <button data-remove="${item.id}">Remover</button>
        </div>
      </li>
    `)
    .join('');

  list.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      state.dividas = state.dividas.filter((item) => item.id !== button.dataset.remove);
      renderDividas();
    });
  });

  list.querySelectorAll('[data-quit]').forEach((button) => {
    button.addEventListener('click', () => {
      const divida = state.dividas.find((item) => item.id === button.dataset.quit);
      if (divida) divida.quitada = true;
      renderDividas();
    });
  });

  list.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const divida = state.dividas.find((item) => item.id === button.dataset.edit);
      if (!divida) return;
      const novoValor = Number(prompt('Novo valor:', divida.valor));
      if (!Number.isNaN(novoValor)) {
        divida.valor = novoValor;
        renderDividas();
      }
    });
  });
}

function renderDevedores() {
  const list = document.getElementById('devedorList');
  list.innerHTML = state.devedores
    .map((item, index) => `
      <li>
        ${item.nome}: <strong>${formatCurrency(item.valor)}</strong>
        <button data-extrato="${index}">Enviar extrato WhatsApp</button>
      </li>
    `)
    .join('');

  list.querySelectorAll('[data-extrato]').forEach((button) => {
    button.addEventListener('click', () => {
      const devedor = state.devedores[Number(button.dataset.extrato)];
      openWhatsApp(`Extrato de dívida\n${devedor.nome}: ${formatCurrency(devedor.valor)}`);
    });
  });
}

function bindRelatorios() {
  document.getElementById('fechamentoBtn').addEventListener('click', exportFechamento);
  document.getElementById('quickCloseBtn').addEventListener('click', exportFechamento);

  document.getElementById('syncSheetsBtn').addEventListener('click', async () => {
    const loading = document.getElementById('loading');
    const logErro = document.getElementById('logErro');

    loading.hidden = false;
    logErro.hidden = true;

    try {
      await fakeSheetsSync();
      alert('Sincronização concluída com sucesso.');
    } catch (error) {
      logErro.hidden = false;
      logErro.textContent = `Falha ao sincronizar com Google Sheets: ${error.message}`;
    } finally {
      loading.hidden = true;
    }
  });
}

function exportFechamento() {
  const payload = {
    entradas: state.entradas,
    saidas: state.saidas,
    entregas: state.entregas,
    dividas: state.dividas,
    devedores: state.devedores
  };

  const csv = [
    'tipo,descricao,valor,data,cartao,parcelas,valorParcela',
    ...state.entradas.map((item) => `entrada,${item.descricao},${item.valor},${item.data},,,`),
    ...state.saidas.map((item) => `saida,${item.descricao},${item.valor},${item.data},${item.cartao},${item.parcelas},${item.valorParcela}`)
  ].join('\n');

  downloadFile('fechamento-mensal.csv', 'text/csv', csv);
  downloadFile('fechamento-mensal.pdf', 'application/pdf', `Fechamento mensal\n\n${JSON.stringify(payload, null, 2)}`);
}

function fakeSheetsSync() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!navigator.onLine) {
        reject(new Error('Sem internet. Verifique sua conexão.'));
      } else {
        resolve(true);
      }
    }, 1000);
  });
}

function downloadFile(name, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function initTopbarDate() {
  const date = new Date();
  const dateText = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  document.getElementById('datePill').textContent = dateText;
}

function initFilterHint() {
  document.getElementById('filterBtn').addEventListener('click', () => {
    alert('Use as seções Entradas/Saídas para registrar movimentações e refletir no dashboard.');
  });
}

bindNavigation('#mainMenu');
bindNavigation('#mobileMenu');
applyFixedDates();
bindEntradasSaidas();
bindEntregas();
initNetflix();
bindCardReports();
bindDevedores();
bindRelatorios();
initTopbarDate();
initFilterHint();
renderEntradasSaidas();
renderEntregaResumo();
renderCardUsage();
renderDividas();
renderDevedores();
