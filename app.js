const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const state = {
  entradas: [],
  saidas: [],
  entregas: [],
  dividas: [],
  devedores: [],
  netflixPeople: ['Moises', 'Marcelo', 'Vitoria', 'Fernanda']
};

const fixedEntregaPrices = {
  'Pripel Postagem': 5
};


function bindLogin() {
  const overlay = document.getElementById('loginOverlay');
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (data.user === 'admin' && data.password === '1234') {
      overlay.classList.add('hidden');
    } else {
      alert('Acesso negado.');
    }
  });
}


function formatCurrency(v) {
  return BRL.format(Number(v) || 0);
}

function bindNavigation() {
  const navButtons = [...document.querySelectorAll('.thumb-nav button')];
  navButtons.forEach((btn, idx) => {
    if (idx === 0) btn.classList.add('active');
    btn.addEventListener('click', () => {
      document.querySelectorAll('main section').forEach((s) => s.classList.remove('active'));
      navButtons.forEach((b) => b.classList.remove('active'));
      document.getElementById(btn.dataset.target).classList.add('active');
      btn.classList.add('active');
    });
  });
}

function bindEntradasSaidas() {
  document.getElementById('entradaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    state.entradas.push({ ...data, valor: Number(data.valor) });
    e.target.reset();
    renderEntradasSaidas();
  });

  document.getElementById('saidaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    state.saidas.push({ ...data, valor: Number(data.valor) });
    e.target.reset();
    renderEntradasSaidas();
  });
}

function renderEntradasSaidas() {
  document.getElementById('entradaList').innerHTML = state.entradas
    .map((i) => `<li>${i.data} · ${i.descricao}: <strong>${formatCurrency(i.valor)}</strong></li>`)
    .join('');

  document.getElementById('saidaList').innerHTML = state.saidas
    .map((i) => `<li>${i.data} · ${i.descricao} (${i.responsavel}): <strong>${formatCurrency(i.valor)}</strong></li>`)
    .join('');

  updateLucasPanel();
}

function bindEntregas() {
  const form = document.getElementById('entregaForm');
  const categoriaEl = form.querySelector('[name="categoria"]');
  const valorUnitarioEl = form.querySelector('[name="valorUnitario"]');

  categoriaEl.addEventListener('change', () => {
    const fixedPrice = fixedEntregaPrices[categoriaEl.value];
    if (fixedPrice) {
      valorUnitarioEl.value = fixedPrice;
      valorUnitarioEl.readOnly = true;
    } else {
      valorUnitarioEl.readOnly = false;
      valorUnitarioEl.value = '';
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const categoria = data.categoria;
    const quantidade = Number(data.quantidade);
    const valorUnitario = fixedEntregaPrices[categoria] ?? Number(data.valorUnitario);
    state.entregas.push({ categoria, quantidade, valorUnitario });
    form.reset();
    valorUnitarioEl.readOnly = false;
    renderEntregaResumo();
  });

  document.getElementById('grupoAReport').addEventListener('click', () => sendEntregaReport(['Expresso', 'iFood']));
  document.getElementById('grupoBReport').addEventListener('click', () => sendEntregaReport(['Pripel Entregas', 'Pripel Postagem']));
}

function renderEntregaResumo() {
  const grouped = state.entregas.reduce((acc, i) => {
    if (!acc[i.categoria]) acc[i.categoria] = { quantidade: 0, valorTotal: 0, valorUnitario: i.valorUnitario };
    acc[i.categoria].quantidade += i.quantidade;
    acc[i.categoria].valorTotal += i.quantidade * i.valorUnitario;
    return acc;
  }, {});

  const body = Object.entries(grouped)
    .map(([cat, d]) => `<tr><td>${cat}</td><td>${d.quantidade}</td><td>${formatCurrency(d.valorUnitario)}</td><td>${formatCurrency(d.valorTotal)}</td></tr>`)
    .join('');

  document.getElementById('entregaResumoBody').innerHTML = body || '<tr><td colspan="4">Sem dados</td></tr>';
}

function sendEntregaReport(categorias) {
  const filtered = state.entregas.filter((i) => categorias.includes(i.categoria));
  const quantidade = filtered.reduce((a, i) => a + i.quantidade, 0);
  const total = filtered.reduce((a, i) => a + i.quantidade * i.valorUnitario, 0);
  const msg = encodeURIComponent(`Resumo ${categorias.join(' + ')}\nQuantidade: ${quantidade}\nTotal: ${formatCurrency(total)}`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

function initNetflix() {
  const list = document.getElementById('netflixList');
  const pendencias = document.getElementById('netflixPendencias');
  const month = new Date();
  const last3Months = [...Array(3)].map((_, i) => {
    const d = new Date(month.getFullYear(), month.getMonth() - i, 1);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });

  list.innerHTML = state.netflixPeople
    .map((p) => `<li>${p} · ${formatCurrency(15)}<div class="actions"><button data-cobrar="${p}">Cobrar</button></div></li>`)
    .join('');

  pendencias.innerHTML = state.netflixPeople
    .map((p) => `<li><strong>${p}</strong>: ${last3Months.join(' • ')}</li>`)
    .join('');

  list.querySelectorAll('[data-cobrar]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.cobrar;
      const msg = encodeURIComponent(`Olá ${p}, sua mensalidade da Netflix está pendente: ${formatCurrency(15)}.`);
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    });
  });
}

function bindCartoes() {
  const pairs = [
    { input: 'interGasto', progress: 'interProgress', label: 'interUso' },
    { input: 'neonGasto', progress: 'neonProgress', label: 'neonUso' }
  ];
  pairs.forEach((p) => {
    const input = document.getElementById(p.input);
    input.addEventListener('input', () => {
      document.getElementById(p.progress).value = Number(input.value);
      document.getElementById(p.label).textContent = formatCurrency(input.value);
    });
  });

  document.getElementById('lucasReportBtn').addEventListener('click', () => {
    const saidasLucas = state.saidas.filter((s) => s.responsavel === 'Lucas');
    const total = saidasLucas.reduce((a, s) => a + s.valor, 0);
    alert(`Relatório Lucas\nItens: ${saidasLucas.length}\nTotal: ${formatCurrency(total)}`);
  });
}

function updateLucasPanel() {
  const entradasTotal = state.entradas.reduce((a, i) => a + i.valor, 0);
  const saidasLucasTotal = state.saidas.filter((s) => s.responsavel === 'Lucas').reduce((a, i) => a + i.valor, 0);
  const lucro = entradasTotal - saidasLucasTotal;

  document.getElementById('lucasGasto').textContent = formatCurrency(saidasLucasTotal);
  document.getElementById('lucasLucro').textContent = formatCurrency(lucro);

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
    state.dividas.push({ id: crypto.randomUUID(), ...data, valor: Number(data.valor), quitada: false });
    formDivida.reset();
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
    .map((d) => `
      <li>
        <strong>${d.titulo}</strong> · ${formatCurrency(d.valor)} · Venc: ${d.vencimento} · ${d.quitada ? 'Quitada' : 'Aberta'}
        <div class="actions">
          <button class="secondary" data-edit="${d.id}">Editar</button>
          <button class="warn" data-quit="${d.id}">Quitar</button>
          <button class="danger" data-remove="${d.id}">Remover</button>
        </div>
      </li>
    `)
    .join('');

  list.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.dividas = state.dividas.filter((d) => d.id !== btn.dataset.remove);
      renderDividas();
    });
  });

  list.querySelectorAll('[data-quit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = state.dividas.find((x) => x.id === btn.dataset.quit);
      if (d) d.quitada = true;
      renderDividas();
    });
  });

  list.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = state.dividas.find((x) => x.id === btn.dataset.edit);
      if (!d) return;
      const novoValor = Number(prompt('Novo valor da dívida:', d.valor));
      if (!Number.isNaN(novoValor)) d.valor = novoValor;
      renderDividas();
    });
  });
}

function renderDevedores() {
  const list = document.getElementById('devedorList');
  list.innerHTML = state.devedores
    .map((d, idx) => `<li>${d.nome}: ${formatCurrency(d.valor)}<div class="actions"><button data-extrato="${idx}">Enviar extrato WhatsApp</button></div></li>`)
    .join('');

  list.querySelectorAll('[data-extrato]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = state.devedores[Number(btn.dataset.extrato)];
      const msg = encodeURIComponent(`Extrato de dívida\n${d.nome}: ${formatCurrency(d.valor)}`);
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    });
  });
}

function bindRelatorios() {
  document.getElementById('fechamentoBtn').addEventListener('click', () => {
    const data = {
      entradas: state.entradas,
      saidas: state.saidas,
      entregas: state.entregas,
      dividas: state.dividas,
      devedores: state.devedores
    };

    const csv = [
      'tipo,descricao,valor,data',
      ...state.entradas.map((e) => `entrada,${e.descricao},${e.valor},${e.data}`),
      ...state.saidas.map((s) => `saida,${s.descricao},${s.valor},${s.data}`)
    ].join('\n');

    downloadFile('fechamento-mensal.csv', 'text/csv', csv);

    const pdfLike = `Fechamento do mês\n\n${JSON.stringify(data, null, 2)}`;
    downloadFile('fechamento-mensal.pdf', 'application/pdf', pdfLike);
  });

  document.getElementById('syncSheetsBtn').addEventListener('click', async () => {
    const loading = document.getElementById('loading');
    const logErro = document.getElementById('logErro');
    loading.hidden = false;
    logErro.hidden = true;

    try {
      await fakeSheetsSync();
    } catch (err) {
      logErro.hidden = false;
      logErro.textContent = `Falha ao sincronizar com Google Sheets: ${err.message}`;
    } finally {
      loading.hidden = true;
    }
  });
}

function fakeSheetsSync() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!navigator.onLine) {
        reject(new Error('Sem internet. Verifique sua conexão e tente novamente.'));
      } else {
        resolve(true);
      }
    }, 1200);
  });
}

function downloadFile(name, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

bindLogin();
bindNavigation();
bindEntradasSaidas();
bindEntregas();
initNetflix();
bindCartoes();
bindDevedores();
bindRelatorios();
renderEntradasSaidas();
renderEntregaResumo();
renderDividas();
renderDevedores();
