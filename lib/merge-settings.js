const fs = require('node:fs');

function mergeSettings(existing, pkg, hookPath) {
  const out = structuredClone(existing);
  const p = structuredClone(pkg);
  if ('model' in p) out.model = p.model;
  if ('permissions' in p) out.permissions = p.permissions;
  for (const k of ['env', 'enabledPlugins', 'extraKnownMarketplaces']) {
    if (k in p) out[k] = { ...out[k], ...p[k] };
  }
  const pre = (out.hooks && out.hooks.PreToolUse) || [];
  const has = pre.some((e) => (e.hooks || []).some((h) => (h.args || []).includes(hookPath)));
  if (!has) {
    pre.push({ matcher: 'Bash|PowerShell',
      hooks: [{ type: 'command', command: 'node', args: [hookPath], onFailure: 'block' }] });
  }
  out.hooks = { ...out.hooks, PreToolUse: pre };
  return out;
}

if (require.main === module) {
  const [existingPath, pkgPath, hookPath, outPath] = process.argv.slice(2);
  if (!outPath) { console.error('usage: merge-settings <existing> <pkg> <hookPath> <out>'); process.exit(2); }
  const existing = fs.existsSync(existingPath) ? JSON.parse(fs.readFileSync(existingPath, 'utf8')) : {};
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  fs.writeFileSync(outPath, JSON.stringify(mergeSettings(existing, pkg, hookPath), null, 2) + '\n');
}

module.exports = { mergeSettings };
