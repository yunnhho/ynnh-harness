const fs = require('node:fs');
const path = require('node:path');

function patchAgent(text, model, stackLine) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const m = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(text);
  if (!m) return text;
  // Routing lives in rules/override.md; drop ECC's auto-invoke triggers.
  let fm = m[1].replace(/^(description:.*)$/m, (d) => d.replace(/ (MUST BE USED|Use immediately after|Use PROACTIVELY)[^.]*\./g, ''));
  fm = /^model:.*$/m.test(fm)
    ? fm.replace(/^model:.*$/m, `model: ${model}`)
    : `${fm}${eol}model: ${model}`;
  let rest = text.slice(m[0].length);
  if (!text.includes(stackLine)) rest = `${stackLine}${eol}${eol}${rest}`;
  return `---${eol}${fm}${eol}---${eol}${rest}`;
}

function patchAll(agentsDir, map, stackLine) {
  const patched = [];
  const missing = [];
  for (const [name, model] of Object.entries(map)) {
    const file = path.join(agentsDir, `${name}.md`);
    if (!fs.existsSync(file)) { missing.push(name); continue; }
    fs.writeFileSync(file, patchAgent(fs.readFileSync(file, 'utf8'), model, stackLine));
    patched.push(name);
  }
  return { patched, missing };
}

if (require.main === module) {
  const [dir, jsonPath] = process.argv.slice(2);
  if (!jsonPath) { console.error('usage: patch-agents <agentsDir> <modelsJson>'); process.exit(2); }
  const cfg = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(JSON.stringify(patchAll(dir, cfg.models, cfg.stackLine)));
}

module.exports = { patchAgent, patchAll };
