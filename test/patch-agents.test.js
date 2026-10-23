const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { patchAgent, patchAll } = require('../lib/patch-agents');
const cfg = require('../agents/models.json');

const count = (s, sub) => s.split(sub).length - 1;

test('replaces existing model line', () => {
  const out = patchAgent('---\nname: a\nmodel: sonnet\n---\nbody', 'opus', 'S');
  assert.match(out, /model: opus/);
  assert.strictEqual(count(out, 'model:'), 1);
});

test('adds model when absent', () => {
  const out = patchAgent('---\nname: a\n---\nbody', 'haiku', 'S');
  assert.ok(out.startsWith('---\nname: a\nmodel: haiku\n---\n'));
});

test('inserts stack line once', () => {
  const once = patchAgent('---\nname: a\n---\nbody', 'haiku', 'STACK');
  const twice = patchAgent(once, 'haiku', 'STACK');
  assert.strictEqual(count(twice, 'STACK'), 1);
  assert.strictEqual(once, twice);
});

test('preserves CRLF', () => {
  const out = patchAgent('---\r\nname: a\r\nmodel: x\r\n---\r\nbody', 'opus', 'S');
  assert.ok(!/[^\r]\n/.test(out));
  assert.ok(out.includes('model: opus\r\n---\r\nS\r\n\r\nbody'));
});

test('missing agent file is reported, not fatal', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-'));
  const r = patchAll(dir, cfg.models, cfg.stackLine);
  assert.strictEqual(r.missing.length, 16);
  assert.strictEqual(r.patched.length, 0);
});

test('patchAll patches existing files', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-'));
  fs.writeFileSync(path.join(dir, 'planner.md'), '---\nname: planner\nmodel: sonnet\n---\nbody');
  const r = patchAll(dir, cfg.models, cfg.stackLine);
  assert.deepStrictEqual(r.patched, ['planner']);
  assert.match(fs.readFileSync(path.join(dir, 'planner.md'), 'utf8'), /model: opus/);
});
