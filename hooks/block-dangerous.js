// PreToolUse(Bash) hook: 되돌릴 수 없는 명령 차단. exit 2 = 차단, 0 = 통과.
// Root/home path, optionally quoted or globbed: /, /*, ~/*, "$HOME", C:\, C:/*
const ROOT = String.raw`["']?(?:\/|~\/?|\$HOME\/?|[A-Za-z]:[\\\/]?)\*?["']?(?=\s|$)`;
const DANGEROUS = new RegExp([
  String.raw`\brm\s+(?:-\S+\s+)*-\S*r\S*\s+(?:-\S+\s+)*${ROOT}`,
  String.raw`\bgit\s+reset\s+--hard\b`,
  String.raw`\bgit\s+clean\s+(?:-\S+\s+)*-\S*f`,
  String.raw`\bdrop\s+(?:table|database)\b`,
  String.raw`\bRemove-Item\b(?=.*-Recurse)(?=.*\s${ROOT})`,
  String.raw`\b(?:Format-Volume|Clear-Disk)\b`,
].join('|'), 'i');

const isDangerous = (cmd) => DANGEROUS.test(cmd);

if (require.main === module) {
  process.on('uncaughtException', (e) => {
    process.stderr.write(`hook 오류: ${e.message}\n`);
    process.exit(2);
  });
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (raw += d));
  process.stdin.on('end', () => {
    const cmd = (JSON.parse(raw).tool_input || {}).command || '';
    if (isDangerous(cmd)) {
      process.stderr.write(`차단됨: ${cmd}\n되돌릴 수 없는 명령이다. 사람에게 실행을 요청하라.\n`);
      process.exit(2);
    }
    process.exit(0);
  });
}

module.exports = { isDangerous };
