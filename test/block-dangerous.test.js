const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const hookPath = path.join(__dirname, '..', 'hooks', 'block-dangerous.js');
const { isDangerous } = require(hookPath);

const yes = [
  'rm -rf /', 'rm -rf ~', 'rm -rf ~/', 'git reset --hard HEAD~1',
  'DROP TABLE users', 'drop database x',
  'Remove-Item -Recurse -Force C:\\', 'Remove-Item C:\\ -Recurse -Force',
  'Remove-Item -Recurse -Force ~', 'Remove-Item -Recurse -Force $HOME',
  'Format-Volume -DriveLetter D', 'Clear-Disk -Number 1',
  'rm -rf /*', 'rm -rf ~/*', 'rm -rf C:/', 'rm -rf "$HOME"', 'rm -rf $HOME/*',
  'Remove-Item -Recurse -Force C:\\*', 'git clean -fdx', 'git clean -d -f',
];
const no = ['rm -rf ./build', 'git reset --soft HEAD~1',
  'Remove-Item -Recurse -Force .\\dist', 'git status', '',
  'rm -rf /tmp/x', 'rm -rf ~/proj/build', 'git clean -n'];

for (const c of yes) test(`danger: ${c}`, () => assert.strictEqual(isDangerous(c), true));
for (const c of no) test(`safe: "${c}"`, () => assert.strictEqual(isDangerous(c), false));

const run = (input) => spawnSync('node', [hookPath], { input, encoding: 'utf8' });

test('process: dangerous blocks', () => {
  const r = run('{"tool_input":{"command":"rm -rf /"}}');
  assert.strictEqual(r.status, 2);
  assert.ok(r.stderr.includes('차단됨'));
});
test('process: safe passes', () => assert.strictEqual(run('{"tool_input":{"command":"git status"}}').status, 0));
test('process: invalid json blocks', () => assert.strictEqual(run('not json').status, 2));
test('process: no command passes', () => assert.strictEqual(run('{"tool_input":{}}').status, 0));
