const fs = require('fs');
const path = require('path');

const nodePath = process.execPath;
const nodeModules = path.join(__dirname, '..', 'node_modules');

let patchCount = 0;

function patchFile(filePath) {
  try {
    const original = fs.readFileSync(filePath, 'utf8');
    let patched = original;

    // commandLine("node", ...) or commandLine('node', ...)
    patched = patched.replace(/commandLine\("node",/g, `commandLine("${nodePath}",`);
    patched = patched.replace(/commandLine\('node',/g, `commandLine('${nodePath}',`);

    // ["node", ...] or ['node', ...] as array literal (exec list or default)
    patched = patched.replace(/\["node",/g, `["${nodePath}",`);
    patched = patched.replace(/\['node',/g, `['${nodePath}',`);

    // ["node"] or ['node'] as standalone default value
    patched = patched.replace(/\["node"\]/g, `["${nodePath}"]`);
    patched = patched.replace(/\['node'\]/g, `['${nodePath}']`);

    // 'node', as first element in a multi-line array (e.g. String[] args = [\n  'node',)
    patched = patched.replace(/(\[\s*\n\s*)'node',/g, `$1'${nodePath}',`);

    // "node", as first element in a multi-line Kotlin listOf() (e.g. listOf(\n    "node",)
    patched = patched.replace(/(listOf\(\s*\n\s*)"node",/g, `$1"${nodePath}",`);

    if (patched !== original) {
      fs.writeFileSync(filePath, patched);
      patchCount++;
      console.log('Patched:', path.relative(path.join(__dirname, '..'), filePath));
    }
  } catch (_) {}
}

function scan(dir, depth) {
  if (depth > 15) return;
  let entries;
  try { entries = fs.readdirSync(dir); } catch (_) { return; }
  for (const entry of entries) {
    if (entry === '.git') continue;
    const full = path.join(dir, entry);
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        scan(full, depth + 1);
      } else if (entry.endsWith('.gradle') || entry.endsWith('.kt')) {
        patchFile(full);
      }
    } catch (_) {}
  }
}

scan(nodeModules, 0);
console.log(`Done. Patched ${patchCount} gradle/kotlin file(s).`);
