const fs = require('fs');
const path = require('path');

const nodePath = process.execPath;
const nodeModules = path.join(__dirname, '..', 'node_modules');

function patchFile(filePath, searchValue, replaceValue) {
  if (!fs.existsSync(filePath)) return;
  const original = fs.readFileSync(filePath, 'utf8');
  const patched = original.replace(searchValue, replaceValue);
  if (patched !== original) {
    fs.writeFileSync(filePath, patched);
    console.log('Patched node path in:', path.relative(path.join(__dirname, '..'), filePath));
  }
}

// Patch expo/scripts/autolinking.gradle — uses ["node", "--print", ...]
patchFile(
  path.join(nodeModules, 'expo', 'scripts', 'autolinking.gradle'),
  /\["node",/,
  `["${nodePath}",`
);

// Patch expo-modules-autolinking — uses 'node' in convertOptionsToCommandArgs
patchFile(
  path.join(nodeModules, 'expo-modules-autolinking', 'scripts', 'android', 'autolinking_implementation.gradle'),
  /'node',\n(\s+)'--no-warnings',/,
  `'${nodePath}',\n$1'--no-warnings',`
);
