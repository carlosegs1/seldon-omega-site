/* =====================================================
   SELDON-OMEGA — JAVASCRIPT
   ===================================================== */

// ============ TAB SWITCHING ============
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Init charts on first visit
    if (tabName === 'dashboard' && !window._dashChartsInit) { initMacroCharts(); window._dashChartsInit = true; }
    if (tabName === 'nlp' && !window._nlpChartsInit) { initZscoreCharts(); window._nlpChartsInit = true; }
    if (tabName === 'auditoria' && !window._auditChartsInit) { initPerformanceChart(); window._auditChartsInit = true; }
    if (tabName === 'calendario' && !window._calInit) { renderCalendar(); window._calInit = true; }
}

// ============ THEME TOGGLE ============
function toggleTheme() {
    const html = document.documentElement;
    const btn = document.getElementById('theme-btn');
    if (html.getAttribute('data-theme') === 'dark') {
        html.setAttribute('data-theme', 'light');
        btn.textContent = '☀️';
    } else {
        html.setAttribute('data-theme', 'dark');
        btn.textContent = '🌙';
    }
}

// ============ REAL-TIME CLOCKS ============
function updateClocks() {
    const now = new Date();
    const zones = [
        { id: 'colombia', tz: 'America/Bogota', offset: -5 },
        { id: 'ny', tz: 'America/New_York', offset: null },
        { id: 'paris', tz: 'Europe/Paris', offset: null },
        { id: 'saudi', tz: 'Asia/Riyadh', offset: null }
    ];

    zones.forEach(z => {
        const opts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: z.tz };
        const dateOpts = { weekday: 'short', day: 'numeric', month: 'short', timeZone: z.tz };
        document.getElementById('time-' + z.id).textContent = now.toLocaleTimeString('es-CO', opts);
        document.getElementById('date-' + z.id).textContent = now.toLocaleDateString('es-CO', dateOpts);
    });
}
setInterval(updateClocks, 1000);
updateClocks();

// ============ MARKET STATUS ============
function updateMarketStatus() {
    const now = new Date();
    const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const nyHour = nyTime.getHours();
    const nyDay = nyTime.getDay(); // 0=Sun, 6=Sat

    const isWeekday = nyDay >= 1 && nyDay <= 5;
    const isMarketHours = nyHour >= 9 && (nyHour < 16 || (nyHour === 16 && nyTime.getMinutes() === 0));
    const isUSOpen = isWeekday && isMarketHours;

    // LSE: 3-11:30 AM ET approximately
    const londonTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    const lonHour = londonTime.getHours();
    const lonDay = londonTime.getDay();
    const isLSEOpen = (lonDay >= 1 && lonDay <= 5) && lonHour >= 8 && lonHour < 16;

    function setStatus(id, dotId, open, label) {
        const dot = document.getElementById(dotId);
        const status = document.getElementById(id);
        if (dot && status) {
            dot.style.background = open ? 'var(--positive)' : 'var(--negative)';
            dot.style.animation = open ? 'pulse 2s infinite' : 'none';
            status.textContent = open ? '● Abierto' : '○ Cerrado';
            status.className = 'market-status ' + (open ? 'positive' : 'negative');
        }
    }

    setStatus('nyse-status', 'nyse-dot', isUSOpen, 'NYSE');
    setStatus('nasdaq-status', 'nasdaq-dot', isUSOpen, 'NASDAQ');
    setStatus('lse-status', 'lse-dot', isLSEOpen, 'LSE');
    setStatus('tsx-status', 'tsx-dot', isUSOpen, 'TSX');
}
setInterval(updateMarketStatus, 60000);
updateMarketStatus();

// ============ VIX SIMULATION ============
let vixBase = 14.23;
function updateVIX() {
    vixBase += (Math.random() - 0.5) * 0.08;
    vixBase = Math.max(10, Math.min(35, vixBase));
    const vixEl = document.getElementById('vix-value');
    const regimeEl = document.getElementById('regime-badge');
    const regimeText = document.getElementById('regime-text');
    const fill = document.getElementById('vix-scale-fill');

    if (vixEl) vixEl.textContent = vixBase.toFixed(2);
    if (fill) fill.style.width = Math.min(100, (vixBase / 80) * 100) + '%';
    if (regimeEl && regimeText) {
        if (vixBase < 20) {
            regimeEl.className = 'regime-badge risk-on';
            regimeText.textContent = 'RISK ON';
        } else {
            regimeEl.className = 'regime-badge risk-off';
            regimeText.textContent = 'RISK OFF';
        }
    }
}
setInterval(updateVIX, 5000);

// ============ PRICE SIMULATION ============
const mockPrices = { nvda: 881.86, gold: 2341.60, nke: 94.32 };
function simulatePrices() {
    const fields = [
        { key: 'nvda', elId: 'nvda-price' },
        { key: 'gold', elId: 'gold-price' },
        { key: 'nke', elId: 'nke-price' }
    ];
    fields.forEach(f => {
        mockPrices[f.key] *= (1 + (Math.random() - 0.5) * 0.0005);
        const el = document.getElementById(f.elId);
        if (el) {
            el.textContent = '$' + mockPrices[f.key].toFixed(2);
            el.classList.add('price-updating');
            setTimeout(() => el.classList.remove('price-updating'), 600);
        }
    });
}
setInterval(simulatePrices, 4000);

// ============ MINI CHARTS (DASHBOARD) ============
function generateSparklineData(base, n, trend, volatility) {
    const data = [];
    let val = base;
    for (let i = 0; i < n; i++) {
        val += (Math.random() - 0.5) * volatility + trend * 0.01;
        data.push(parseFloat(val.toFixed(2)));
    }
    return data;
}

const chartDefaults = {
    type: 'line',
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { point: { radius: 0 }, line: { tension: 0.4, borderWidth: 2 } },
        animation: { duration: 500 }
    }
};

function makeChart(canvasId, data, color) {
    const el = document.getElementById(canvasId);
    if (!el) return;
    new Chart(el, {
        ...chartDefaults,
        data: {
            labels: data.map((_, i) => i),
            datasets: [{ data, borderColor: color, fill: true, backgroundColor: color + '20' }]
        }
    });
}

function initMacroCharts() {
    makeChart('chart-sp500', generateSparklineData(5100, 20, 2, 15), '#10b981');
    makeChart('chart-nasdaq', generateSparklineData(16000, 20, 3, 50), '#10b981');
    makeChart('chart-dxy', generateSparklineData(104.2, 20, -0.1, 0.3), '#ef4444');
    makeChart('chart-wti', generateSparklineData(76.8, 20, 0.2, 0.5), '#10b981');
    makeChart('chart-gold', generateSparklineData(2300, 20, 2, 8), '#f59e0b');
}
initMacroCharts();

// ============ Z-SCORE CHARTS (NLP TAB) ============
function initZscoreCharts() {
    const assets = [
        { id: 'zscore-nvda', nlp: 1.82, vol: 2.14, positive: true },
        { id: 'zscore-gold', nlp: 1.41, vol: 1.70, positive: true },
        { id: 'zscore-nke', nlp: -0.89, vol: -0.34, positive: false },
        { id: 'zscore-msft', nlp: 1.92, vol: 1.20, positive: true }
    ];
    assets.forEach(a => {
        const el = document.getElementById(a.id);
        if (!el) return;
        const days = Array.from({ length: 30 }, (_, i) => `D-${30 - i}`);
        const nlpData = generateSparklineData(a.nlp, 30, 0, 0.3);
        const volData = generateSparklineData(a.vol, 30, 0, 0.25);
        new Chart(el, {
            type: 'line',
            data: {
                labels: days,
                datasets: [
                    {
                        label: 'Z_NLP', data: nlpData,
                        borderColor: a.positive ? '#10b981' : '#ef4444',
                        backgroundColor: (a.positive ? '#10b981' : '#ef4444') + '20',
                        fill: true, tension: 0.4, borderWidth: 2,
                        pointRadius: 0
                    },
                    {
                        label: 'Z_Vol', data: volData,
                        borderColor: '#3b82f6', backgroundColor: '#3b82f620',
                        fill: false, tension: 0.4, borderWidth: 1.5, borderDash: [4, 2],
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, labels: { color: '#8899b4', font: { size: 10 }, boxWidth: 12 } },
                    tooltip: {
                        backgroundColor: '#161f31',
                        titleColor: '#e2e8f0', bodyColor: '#8899b4',
                        borderColor: '#1e2d42', borderWidth: 1
                    }
                },
                scales: {
                    x: { display: false },
                    y: {
                        display: true, grid: { color: '#1e2d42' },
                        ticks: { color: '#4a6080', font: { size: 9 } }
                    }
                }
            }
        });
    });
}

// ============ PERFORMANCE CHART (AUDITORÍA) ============
function initPerformanceChart() {
    const el = document.getElementById('performance-chart');
    if (!el) return;
    const labels = ['Oct', 'Nov', 'Dic', 'Ene', 'Feb'];
    const protocolData = [0, 4.2, 9.8, 16.1, 22.7];
    const sp500Data = [0, 2.1, 5.4, 8.9, 12.3];

    new Chart(el, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Seldon-Omega Protocol',
                    data: protocolData,
                    borderColor: '#10b981', backgroundColor: '#10b98120',
                    fill: true, tension: 0.4, borderWidth: 2.5,
                    pointBackgroundColor: '#10b981', pointRadius: 4
                },
                {
                    label: 'S&P 500 (Benchmark)',
                    data: sp500Data,
                    borderColor: '#3b82f6', backgroundColor: 'transparent',
                    fill: false, tension: 0.4, borderWidth: 1.5,
                    borderDash: [5, 3], pointRadius: 2
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#8899b4', font: { size: 11 }, boxWidth: 16 } },
                tooltip: {
                    backgroundColor: '#161f31',
                    titleColor: '#e2e8f0', bodyColor: '#8899b4',
                    borderColor: '#1e2d42', borderWidth: 1,
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: +${ctx.parsed.y.toFixed(1)}%`
                    }
                }
            },
            scales: {
                x: { grid: { color: '#1e2d42' }, ticks: { color: '#4a6080' } },
                y: {
                    grid: { color: '#1e2d42' }, ticks: { color: '#4a6080', callback: v => v + '%' }
                }
            }
        }
    });
}

// ============ REPORT TABS ============
function switchReport(id) {
    document.querySelectorAll('.report-content').forEach(r => r.classList.remove('active'));
    document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('report-' + id).classList.add('active');
    event.target.classList.add('active');
}

// ============ COPY TICKET ============
function copyTicket() {
    const text = `SELDON-OMEGA TICKET\n-----------------------\nActivo: NVDA (NVIDIA Corp)\nAcción: BUY (Long)\nApalancamiento: X5\nStop Loss: $857.00\nTake Profit: $920.00\nMonto: $500 USD\nGatillo: CONFLUENCIA ✅\nRégimen: RISK ON\n-----------------------\nGenerado: ${new Date().toLocaleString('es-CO')}`;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = '✅ ¡Copiado!';
        setTimeout(() => btn.textContent = '📋 Copiar', 2000);
    });
}

// ============ CHECKLIST ============
function checkItem(checkbox) {
    const label = checkbox.closest('.check-item');
    if (checkbox.checked) {
        label.classList.add('checked');
    } else {
        label.classList.remove('checked');
    }
    updateChecklistProgress();
}

function updateChecklistProgress() {
    const checkboxes = document.querySelectorAll('#etoro-checklist input[type="checkbox"]');
    const total = checkboxes.length;
    const checked = Array.from(checkboxes).filter(c => c.checked).length;
    const pct = (checked / total) * 100;
    document.getElementById('checklist-fill').style.width = pct + '%';
    document.getElementById('checklist-count').textContent = `${checked}/${total} completados`;
    const fill = document.getElementById('checklist-fill');
    if (pct < 50) fill.style.background = 'var(--negative)';
    else if (pct < 100) fill.style.background = 'var(--neutral)';
    else fill.style.background = 'var(--positive)';
}

function resetChecklist() {
    document.querySelectorAll('#etoro-checklist input[type="checkbox"]').forEach(c => {
        c.checked = false;
        c.closest('.check-item').classList.remove('checked');
    });
    updateChecklistProgress();
}

// ============ GURU DETAILS ============
const guruData = {
    buffett: {
        name: 'Warren Buffett',
        holdings: [
            { action: 'Mantiene', ticker: 'AAPL', position: '40.9%', change: '↔ Sin cambio' },
            { action: 'Aumenta', ticker: 'OXY', position: '4.2%', change: '▲ +2.1%' },
            { action: 'Reduce', ticker: 'HP', position: '1.4%', change: '▼ -0.8%' },
            { action: 'Nueva', ticker: 'SFM', position: '0.3%', change: '★ Nueva pos.' }
        ],
        today: `En el contexto actual con VIX en 14.23 (RISK ON) y mercados en niveles históricos, Buffett probablemente mantendría su posición concentrada en AAPL y aprovecharía para adicionar a su posición en OXY dado el entorno de tasas. Su máxima: "Sea codicioso cuando los demás tienen miedo" — con VIX bajo, él esperaría una corrección antes de desplegar capital fresco. Mantendría efectivo en Berkshire (~$100B+) como pólvora seca para la próxima oportunidad.`
    },
    dalio: {
        name: 'Ray Dalio',
        holdings: [
            { action: 'Mantiene', ticker: 'GLD', position: '15.1%', change: '↔ Sin cambio' },
            { action: 'Aumenta', ticker: 'IAU', position: '8.3%', change: '▲ +1.2%' },
            { action: 'Mantiene', ticker: 'SPY', position: '12.4%', change: '↔ Sin cambio' },
            { action: 'Reduce', ticker: 'EEM', position: '6.2%', change: '▼ -1.4%' }
        ],
        today: `Dalio con su estrategia All-Weather observaría la correlación rota entre bonos y acciones. Con el dólar (DXY 103.82) mostrando debilidad, aumentaría su exposición al oro (GOLD) como cobertura. Su portafolio de paridad de riesgo sugeriría rebalancear hacia commodities dado el entorno inflacionario persistente. Alertaría sobre el riesgo de deuda soberana a largo plazo y mantendría exposición a mercados emergentes de bajo apalancamiento.`
    },
    soros: {
        name: 'George Soros',
        holdings: [
            { action: 'Nueva', ticker: 'GLD', position: '5.4%', change: '★ Nueva pos.' },
            { action: 'Reduce', ticker: 'NVDA', position: '2.1%', change: '▼ -3.2%' },
            { action: 'Aumenta', ticker: 'TLT', position: '8.8%', change: '▲ +5.1%' },
            { action: 'Nueva', ticker: 'FXI', position: '4.3%', change: '★ Nueva pos.' }
        ],
        today: `Soros aplicaría su teoría de reflexividad: los mercados crean narrativas que se autoperpetúan, luego colapsan. Vería la narrativa de la IA (impulsada por NVDA) como en fase tardía y comenzaría a reducir posiciones. Apostaría por bonos largos (TLT) anticipando que la Fed recortará tasas más de lo esperado. Su posición en China sería contrarian — buscando el rebote cuando "todos" son negativos.`
    },
    lynch: {
        name: 'Peter Lynch',
        holdings: [
            { action: 'Mantiene', ticker: 'NKE', position: '3.2%', change: '↔ Espera recuperación' },
            { action: 'Aumenta', ticker: 'NVDA', position: '5.8%', change: '▲ +1.4%' },
            { action: 'Nueva', ticker: 'AMZN', position: '4.1%', change: '★ Nueva pos.' },
            { action: 'Mantiene', ticker: 'META', position: '3.9%', change: '↔ Sin cambio' }
        ],
        today: `Lynch con su filosofía "invierte en lo que conoces" seguiría apostando por NVDA ya que la demanda de chips de IA es visible y tangible para cualquier consumidor de tecnología. En NKE sería paciente — empresas de gran marca con problemas temporales son sus favoritas para el largo plazo. Identificaría "tenbaggers" potenciales en empresas mid-cap de IA aplicada. Clave: buscaría el PEG ratio < 1 en el sector tecnológico.`
    },
    bogle: {
        name: 'John Bogle',
        holdings: [
            { action: 'Mantiene', ticker: 'VTI', position: '60%', change: '↔ Always hold' },
            { action: 'Mantiene', ticker: 'BND', position: '40%', change: '↔ Rebalance' },
            { action: 'Evita', ticker: 'NVDA', position: '—', change: '❌ No timing' },
            { action: 'Evita', ticker: 'NKE', position: '—', change: '❌ No stock pick' }
        ],
        today: `Bogle no haría NADA diferente hoy. Su consejo sería el de siempre: no toques tu portafolio de índices. Con mercados en máximos históricos, advierte contra el trading activo. El protocolo Seldon-Omega le parecería sofisticado pero innecesario — "el costo del trading es el verdadero enemigo del inversor". Sugeriría VTI + BND en proporción 80/20 y olvidarse del mercado. "El tiempo en el mercado supera al timing del mercado."`
    }
};

function showGuruDetail(guruKey) {
    const data = guruData[guruKey];
    if (!data) return;
    const detail = document.getElementById('guru-detail');
    document.getElementById('guru-detail-title').textContent = `📊 ${data.name} — Análisis & 13F`;
    const tbody = document.getElementById('guru-13f-body');
    tbody.innerHTML = data.holdings.map(h => `
    <tr>
      <td>${h.action}</td>
      <td><span class="asset-badge nvda" style="font-size:0.7rem">${h.ticker}</span></td>
      <td>${h.position}</td>
      <td class="${h.change.includes('▲') || h.change.includes('★') ? 'positive' : h.change.includes('▼') ? 'negative' : ''}">${h.change}</td>
    </tr>
  `).join('');
    document.getElementById('guru-today-text').innerHTML = `<p>${data.today}</p>`;
    detail.style.display = 'block';
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeGuruDetail() {
    document.getElementById('guru-detail').style.display = 'none';
}

// ============ CHAT R2D2 ============
const r2d2Responses = {
    'vix': '📉 **Estado VIX — Tiempo Real**\n\nVIX actual: **14.23** (actualizado hace 2 min)\n\n• Nivel: Bajo → Mercado complaciente\n• Régimen: **RISK ON** ✅\n• Umbral Seldon-Omega: < 20 = operar normalmente\n• Umbral alerta: > 25 = reducir exposición 50%\n\nEl VIX por debajo de 20 indica condiciones favorables para el protocolo.',
    'gold': '🥇 **Análisis GOLD (Barrick Gold)**\n\n• **Precio actual:** $2,341.60 (+0.72%)\n• **Gatillo Confluencia:** 🟢 LUZ VERDE\n• **Z_NLP:** 1.41 | **Z_Vol:** 1.70\n• **Score:** 2.41 — Señal moderada\n• **Catalizador:** Demanda de cobertura geopolítica\n\nEl oro mantiene momentum positivo. Ticket vigente: BUY GOLD con SL en $2,290.',
    'buffett': '🏛️ **¿Qué haría Warren Buffett hoy?**\n\nCon el VIX en mínimos y mercados en máximos históricos, Buffett probablemente:\n\n1. **Mantendría** su posición en AAPL (40.9% del portafolio)\n2. **Esperaría** una corrección para desplegar capital fresco\n3. **Acumularía** efectivo en Berkshire como "pólvora seca"\n4. **Advertiría** contra el FOMO en acciones de IA\n\n*"El precio es lo que pagas, el valor es lo que obtienes"*',
    'reporte': '📋 **Reporte de Hoy — 22 Feb 2026**\n\n**8:00 AM:** Régimen RISK ON confirmado. NVDA y GOLD con Luz Verde.\n\n**12:00 PM:** Z-Scores mantienen señal. NVDA Score=3.98 (subió).\n\n**5:00 PM:** Cierre positivo. NVDA +1.23%, GOLD +0.72%. Kill Switch INACTIVO.\n\nMañana (Mié): Día operable. Preparar plan para posible entrada en NVDA si confirma apertura positiva.',
    'default': '🤖 Analizando tu consulta...\n\nBasándome en el estado actual del protocolo Seldon-Omega:\n\n• **Régimen:** RISK ON (VIX 14.23)\n• **Activos con Luz Verde:** NVDA, GOLD, MSFT, AMZN, META, TSM\n• **Kill Switch:** INACTIVO\n\n¿Quieres que analice un activo específico del TOP 8 o el estado del protocolo en detalle?'
};

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    appendMessage(text, 'user');
    input.value = '';
    setTimeout(() => {
        const lw = text.toLowerCase();
        let response = r2d2Responses.default;
        if (lw.includes('vix')) response = r2d2Responses.vix;
        else if (lw.includes('gold') || lw.includes('oro')) response = r2d2Responses.gold;
        else if (lw.includes('buffett')) response = r2d2Responses.buffett;
        else if (lw.includes('reporte') || lw.includes('hoy')) response = r2d2Responses.reporte;
        appendMessage(response, 'bot');
    }, 700);
}

function sendSuggestion(btn) {
    document.getElementById('chat-input').value = btn.textContent;
    sendMessage();
}

function handleChatKey(e) {
    if (e.key === 'Enter') sendMessage();
}

function appendMessage(text, role) {
    const msgs = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'message ' + (role === 'user' ? 'user-message' : 'bot-message');
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    div.innerHTML = role === 'user'
        ? `<div class="message-content"><div class="message-text">${formatted}</div><div class="message-time">${timeStr}</div></div><div class="message-avatar user">CE</div>`
        : `<div class="message-avatar">R2</div><div class="message-content"><div class="message-text">${formatted}</div><div class="message-time">${timeStr}</div></div>`;
    msgs.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
}

function newChat() {
    const msgs = document.getElementById('chat-messages');
    msgs.innerHTML = `<div class="message bot-message">
    <div class="message-avatar">R2</div>
    <div class="message-content">
      <div class="message-text">Nueva conversación iniciada. ¿En qué te puedo ayudar, Carlos?</div>
      <div class="message-time">${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}</div>
    </div>
  </div>`;
}

function loadChat(id) {
    document.querySelectorAll('.history-item').forEach(h => h.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// ============ CALENDAR ============
let currentDate = new Date(2026, 1, 22); // Feb 2026
const eventDates = {
    '2026-02-24': 'high', '2026-02-26': 'high', '2026-02-28': 'medium',
    '2026-03-01': 'high', '2026-03-07': 'high'
};

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    document.getElementById('cal-month-title').textContent = `${months[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const grid = document.getElementById('cal-grid');
    // Remove old day cells (keep headers)
    const headers = grid.querySelectorAll('.cal-day-name');
    grid.innerHTML = '';
    headers.forEach(h => grid.appendChild(h.cloneNode(true)));

    // Add blank cells
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = 'cal-day other-month';
        grid.appendChild(blank);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.textContent = d;
        const day = new Date(year, month, d).getDay();
        if (day === 0 || day === 6) cell.classList.add('weekend');
        if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            cell.classList.add('today');
        }
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (eventDates[dateKey]) {
            cell.classList.add(eventDates[dateKey] === 'high' ? 'has-event' : 'has-event-low');
        }
        grid.appendChild(cell);
    }
}

function changeMonth(dir) {
    currentDate.setMonth(currentDate.getMonth() + dir);
    renderCalendar();
}

// ============ KILL SWITCH ============
let killSwitchActive = false;
function toggleKillSwitch() {
    killSwitchActive = !killSwitchActive;
    const banner = document.getElementById('killswitch-banner');
    const statusText = document.getElementById('ks-status-text');
    const toggleBtn = document.getElementById('ks-toggle');
    const desc = banner.querySelector('.ks-desc');

    if (killSwitchActive) {
        banner.classList.add('active-ks');
        statusText.textContent = '⛔ ACTIVO';
        statusText.className = 'ks-status active';
        toggleBtn.textContent = 'Desactivar Kill Switch';
        toggleBtn.className = 'ks-toggle active';
        desc.textContent = '⚠️ KILL SWITCH ACTIVADO. Todas las operaciones están suspendidas. No ejecutar ninguna señal.';
    } else {
        banner.classList.remove('active-ks');
        statusText.textContent = 'INACTIVO';
        statusText.className = 'ks-status inactive';
        toggleBtn.textContent = 'Activar Kill Switch';
        toggleBtn.className = 'ks-toggle inactive';
        desc.textContent = 'El protocolo está operativo. Todas las señales son válidas.';
    }
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    initMacroCharts();
    updateClocks();
    updateMarketStatus();
    renderCalendar();
    window._dashChartsInit = true;
    window._calInit = true;
});
