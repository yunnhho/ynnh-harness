const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { mergeSettings } = require('../lib/merge-settings.js');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'settings.json'), 'utf8'));
const H = 'C:/h/block-dangerous.js';
const CR = 'code-review@claude-plugins-official';

test('empty existing gets package values', () => {
  const r = mergeSettings({}, pkg, H);
  assert.strictEqual(r.enabledPlugins[CR], false);
  assert.strictEqual(r.hooks.PreToolUse.length, 1);
  assert.strictEqual(r.hooks.PreToolUse[0].hooks[0].onFailure, 'block');
});

test('preserves unknown keys and user hooks', () => {
  const e = { theme: 'dark', env: { FOO: '1' }, enabledPlugins: { 'x@y': true },
    hooks: { PreToolUse: [{ matcher: 'Edit', hooks: [{ type: 'command', command: 'x' }] }] } };
  const r = mergeSettings(e, pkg, H);
  assert.strictEqual(r.theme, 'dark');
  assert.strictEqual(r.env.FOO, '1');
  assert.strictEqual(r.enabledPlugins['x@y'], true);
  assert.strictEqual(r.hooks.PreToolUse.length, 2);
});

test('package wins on conflicts', () => {
  const r = mergeSettings({ enabledPlugins: { [CR]: true }, model: 'sonnet' }, pkg, H);
  assert.strictEqual(r.enabledPlugins[CR], false);
  assert.strictEqual(r.model, 'opus');
});

test('idempotent', () => {
  const e = { theme: 'dark' };
  const once = mergeSettings(e, pkg, H);
  assert.deepStrictEqual(mergeSettings(once, pkg, H), once);
});

test('does not mutate inputs', () => {
  const e = { env: { A: '1' }, hooks: { PreToolUse: [] } };
  const ec = structuredClone(e), pc = structuredClone(pkg);
  mergeSettings(e, pkg, H);
  assert.deepStrictEqual(e, ec);
  assert.deepStrictEqual(pkg, pc);
});

test('package settings.json is valid', () => {
  assert.ok(pkg.permissions.deny.includes('Read(./.env)'));
  assert.strictEqual(Object.keys(pkg.enabledPlugins).length, 13);
});
