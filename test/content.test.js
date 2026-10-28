const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const FILES = ['CLAUDE.md', 'rules/override.md', 'rules/agents.md'];
const TIERS = {
  opus: ['planner', 'architect', 'security-reviewer'],
  sonnet: ['code-reviewer', 'java-reviewer', 'typescript-reviewer', 'react-reviewer', 'database-reviewer',
    'java-build-resolver', 'react-build-resolver', 'build-error-resolver', 'silent-failure-hunter', 'tdd-guide'],
  haiku: ['code-explorer', 'doc-updater', 'refactor-cleaner'],
};

test('CLAUDE.md under 100 lines', () => {
  assert.ok(read('CLAUDE.md').split('\n').length < 100);
});

test('CLAUDE.md has three report headings', () => {
  const text = read('CLAUDE.md');
  for (const h of ['내가 할 일', '바꾼 것', '발견한 것']) assert.ok(text.includes(h), h);
});

test('override declares priority', () => {
  const text = read('rules/override.md');
  assert.match(text.split('\n')[0], /우선/);
  for (const word of ['ponytail', 'superpowers', 'OLAP', 'OLTP']) assert.ok(text.includes(word), word);
});

test('override has three routing rows', () => {
  const rows = read('rules/override.md').split('\n').filter((l) => l.startsWith('|'));
  assert.ok(rows.some((r) => r.includes('1~2개 파일') && r.includes('ponytail')), 'row 1');
  assert.ok(rows.some((r) => r.includes('여러 파일') && r.includes('superpowers')), 'row 2');
  assert.ok(rows.some((r) => r.includes('5개 이상') && r.includes('ECC 에이전트')), 'row 3');
  assert.match(read('rules/override.md'), /세 번째 줄이 이긴다/, 'tie-break');
});

test('agents.md has no proactive rule', () => {
  const text = read('rules/agents.md');
  for (const word of ['Immediate', 'PROACTIVELY', '요청 없이']) assert.ok(!text.includes(word), word);
});

test('agents.md maps every agent to its tier', () => {
  const lines = read('rules/agents.md').split('\n');
  for (const [tier, agents] of Object.entries(TIERS)) {
    const row = lines.find((l) => l.startsWith(`| ${tier} |`));
    assert.ok(row, tier);
    const names = row.split('|')[2].split(',').map((s) => s.trim());
    assert.deepStrictEqual(names.sort(), [...agents].sort(), tier);
  }
});

test('no shouting', () => {
  for (const f of FILES) assert.doesNotMatch(read(f), /\b(ALWAYS|MUST|NEVER|CRITICAL)\b/, f);
});

test('ecc-common copies do not fight override.md', () => {
  // Severity labels (CRITICAL, HIGH) stay; shouting, auto-agent and 80% mandates go.
  for (const f of fs.readdirSync(path.join(__dirname, '..', 'rules', 'ecc-common'))) {
    assert.doesNotMatch(read(`rules/ecc-common/${f}`), /\b(MANDATORY|ALWAYS|MUST|NEVER|STOP|PROACTIVELY)\b|80%/, f);
  }
});
