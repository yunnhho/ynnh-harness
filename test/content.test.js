const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const FILES = ['CLAUDE.md', 'rules/override.md', 'rules/agents.md'];

test('CLAUDE.md under 100 lines', () => {
  assert.ok(read('CLAUDE.md').split('\n').length < 100);
});

test('override declares priority', () => {
  const text = read('rules/override.md');
  assert.match(text.split('\n')[0], /우선/);
  for (const word of ['ponytail', 'superpowers', 'OLAP', 'OLTP']) assert.ok(text.includes(word), word);
});

test('agents.md has no proactive rule', () => {
  const text = read('rules/agents.md');
  for (const word of ['Immediate', 'PROACTIVELY', '요청 없이']) assert.ok(!text.includes(word), word);
  for (const word of ['opus', 'haiku']) assert.ok(text.includes(word), word);
});

test('no shouting', () => {
  for (const f of FILES) assert.doesNotMatch(read(f), /\b(ALWAYS|MUST|NEVER)\b/, f);
});
