const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { once } = require('node:events');

test('shared counts, timestamps, retries, validation and persistence', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'extremo-test-'));
  let child;
  async function start() {
    child = spawn(process.execPath, ['server.js'], { cwd: __dirname, env: { ...process.env, PORT: '0', DATA_DIR: dir }, windowsHide: true });
    const [output] = await once(child.stdout, 'data');
    return output.toString().match(/http:\/\/localhost:\d+/)[0];
  }
  async function stop() { const exited = once(child, 'exit'); child.kill(); await exited; }
  try {
    let base = await start();
    const state = () => fetch(base + '/api/state').then(r => r.json());
    const post = (player, id) => fetch(base + '/api/deaths', { method: 'POST', body: JSON.stringify({ player, id }) });
    let initial = await state();
    assert.deepEqual(initial.players, ['Degryh', 'David', 'Dani', 'Alexus', 'Pablo']);
    assert.deepEqual(initial.events.map(e => e.player).sort(), ['Alexus', 'David', 'Degryh']);
    assert.ok(initial.events.every(e => e.at === null));
    assert.equal((await fetch(base)).status, 200);
    const before = Date.now();
    await Promise.all([post('Dani', 'test-click-0001'), post('Pablo', 'test-click-0002')]);
    await post('Dani', 'test-click-0001');
    const updated = await state();
    assert.equal(updated.events.length, 5);
    assert.ok(updated.events.slice(3).every(e => Date.parse(e.at) >= before && Date.parse(e.at) <= Date.now()));
    assert.equal((await post('Invalid', 'test-click-0003')).status, 400);
    await stop();
    base = await start();
    assert.deepEqual(await state(), updated);
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) await stop();
    rmSync(dir, { recursive: true, force: true });
  }
});
