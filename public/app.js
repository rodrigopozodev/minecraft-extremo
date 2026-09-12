const palette = ['#b9bf8a', '#9cb8d0', '#d6ae79', '#ba9ccb', '#94b99a', '#cf9687'];
const pending = new Map();
let state;
let toastTimer;
const dateFormat = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: 'short', year: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
}
function render() {
  if (!state) return;
  const counts = Object.fromEntries(state.players.map(player => [player, state.events.filter(event => event.player === player).length]));
  document.querySelector('#total').textContent = state.events.length;
  document.querySelector('#survivors').textContent = state.players.filter(player => !counts[player]).length;
  document.querySelector('#last').textContent = state.events.filter(event => event.at).at(-1)?.player || 'Sin nuevos registros';
  if (!document.querySelector('#players').children.length) {
    document.querySelector('#players').innerHTML = state.players.map((player, i) => `<article class="player"><span class="number">0${i + 1}</span><div class="avatar" style="--avatar:${palette[i]}">${player[0]}</div><h3>${player}</h3><span class="status"></span><div class="count"><strong>0</strong><span>muertes</span></div><button data-player="${player}" aria-label="Registrar una muerte de ${player}">＋ Muerte</button></article>`).join('');
  }
  document.querySelectorAll('.player').forEach(card => {
    const player = card.querySelector('button').dataset.player;
    const count = counts[player];
    card.querySelector('.count strong').textContent = count;
    card.querySelector('.count span').textContent = count === 1 ? 'muerte' : 'muertes';
    card.querySelector('.status').textContent = count ? 'Ya conoce el otro lado' : 'Superviviente intacto';
    card.querySelector('.status').className = `status ${count ? '' : 'alive'}`;
  });
  const rows = state.events.map((event, index) => ({ ...event, number: index + 1 }));
  if (document.querySelector('#order').value === 'desc') rows.reverse();
  document.querySelector('#events').innerHTML = rows.map(event => `<tr><td>${String(event.number).padStart(2, '0')}</td><td>${event.player}</td><td><span class="badge ${event.initial ? 'initial' : ''}">${event.initial ? 'Muerte inicial' : 'Muerte registrada'}</span></td><td class="date">${event.at ? dateFormat.format(new Date(event.at)) : 'Sin fecha'}</td><td class="time">${event.at ? timeFormat.format(new Date(event.at)) : 'Sin hora'}</td></tr>`).join('');
  document.querySelector('#records').textContent = `${state.events.length} muertes en el registro`;
}
async function refresh() {
  try {
    const response = await fetch('/api/state');
    if (!response.ok) throw new Error();
    const next = await response.json();
    if (!state || next.events.length >= state.events.length) state = next;
    render();
    document.querySelector('#connection').textContent = 'Servidor conectado';
  } catch { document.querySelector('#connection').textContent = 'Sin conexión · Reintentando'; }
}
document.querySelector('#players').addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  const player = button.dataset.player;
  if (!pending.has(player)) pending.set(player, `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  button.disabled = true;
  button.textContent = 'Guardando…';
  try {
    const response = await fetch('/api/deaths', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player, id: pending.get(player) }) });
    if (!response.ok) throw new Error();
    const next = await response.json();
    if (!state || next.events.length >= state.events.length) state = next;
    pending.delete(player);
    render();
    notify(`Muerte de ${player} registrada`);
  } catch { notify('No se pudo confirmar el registro. Pulsa de nuevo para reintentar.'); }
  finally { button.disabled = false; button.textContent = pending.has(player) ? 'Reintentar' : '＋ Muerte'; }
});
document.querySelector('#order').addEventListener('change', render);
refresh();
setInterval(refresh, 3000);
