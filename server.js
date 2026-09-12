const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const players = ['Degryh', 'David', 'Dani', 'Alexus', 'Pablo'];
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const file = path.join(dataDir, 'deaths.json');
function save(value) {
  fs.writeFileSync(file + '.tmp', JSON.stringify(value, null, 2));
  fs.renameSync(file + '.tmp', file);
}
let events;
if (fs.existsSync(file)) {
  events = JSON.parse(fs.readFileSync(file, 'utf8'));
} else {
  events = ['David', 'Alexus', 'Degryh'].map(player => ({ id: randomUUID(), player, at: null, initial: true }));
  save(events);
}
const assets = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8']
};
const server = http.createServer(async (req, res) => {
  const send = (status, value) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(value));
  };
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/state' && req.method === 'GET') return send(200, { players, events });
    if (url.pathname === '/api/deaths' && req.method === 'POST') {
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return send(403, { error: 'Origen no permitido.' });
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 2048) return send(413, { error: 'Petición demasiado grande.' });
      }
      let input;
      try { input = JSON.parse(body); } catch { return send(400, { error: 'Petición no válida.' }); }
      if (!players.includes(input.player) || typeof input.id !== 'string' || !/^[a-zA-Z0-9-]{10,80}$/.test(input.id)) return send(400, { error: 'Jugador o identificador no válido.' });
      if (!events.some(event => event.id === input.id)) {
        const next = [...events, { id: input.id, player: input.player, at: new Date().toISOString(), initial: false }];
        save(next);
        events = next;
      }
      return send(200, { players, events });
    }
    const asset = assets[url.pathname];
    if (req.method === 'GET' && asset) {
      res.writeHead(200, { 'Content-Type': asset[1], 'Cache-Control': 'no-cache' });
      return res.end(fs.readFileSync(path.join(__dirname, 'public', asset[0])));
    }
    send(404, { error: 'No encontrado.' });
  } catch (error) {
    console.error(error);
    send(500, { error: 'No se pudo guardar. Inténtalo de nuevo.' });
  }
});
server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Minecraft Extremo: http://localhost:${server.address().port}`));
