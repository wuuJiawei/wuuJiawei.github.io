import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'assets/main.scene',
  'assets/main.scene.meta',
  'assets/scripts/GameTypes.ts',
  'assets/scripts/GameData.ts',
  'assets/scripts/StorageService.ts',
  'assets/scripts/PlatformService.ts',
  'assets/scripts/UIFactory.ts',
  'assets/scripts/QueueMasterApp.ts',
  'settings/v2/packages/project.json',
  'build-templates/wechatgame/game.json',
  'build-templates/bytedance-mini-game/game.json',
];

let failed = false;
for (const file of requiredFiles) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    console.error(`缺少文件: ${file}`);
    failed = true;
  }
}

const scriptDir = path.join(root, 'assets/scripts');
const scriptFiles = fs.readdirSync(scriptDir).filter((file) => file.endsWith('.ts'));
for (const name of scriptFiles) {
  const absolute = path.join(scriptDir, name);
  const source = fs.readFileSync(absolute, 'utf8');
  const output = ts.transpileModule(source, {
    fileName: name,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      strict: true,
      experimentalDecorators: true,
    },
  });
  for (const diagnostic of output.diagnostics ?? []) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    console.error(`${name}: ${message}`);
    failed = true;
  }
}

for (const jsonFile of requiredFiles.filter((file) => file.endsWith('.json') || file.endsWith('.scene'))) {
  try {
    JSON.parse(fs.readFileSync(path.join(root, jsonFile), 'utf8'));
  } catch (error) {
    console.error(`${jsonFile}: JSON 无效`, error);
    failed = true;
  }
}

const appMeta = JSON.parse(fs.readFileSync(path.join(root, 'assets/scripts/QueueMasterApp.ts.meta'), 'utf8'));
const mainScene = JSON.parse(fs.readFileSync(path.join(root, 'assets/main.scene'), 'utf8'));
const compressScriptUuid = (uuid) => {
  const head = uuid.slice(0, 5);
  const body = uuid.slice(5).replaceAll('-', '') + 'f';
  const bytes = [];
  for (let index = 0; index < body.length - 1; index += 2) {
    bytes.push(Number.parseInt(body.slice(index, index + 2), 16));
  }
  return head + Buffer.from(bytes).toString('base64').slice(0, -2);
};
const expectedComponentId = compressScriptUuid(appMeta.uuid);
if (mainScene[3]?.__type__ !== expectedComponentId) {
  console.error(`main.scene 脚本 UUID 不匹配，应为 ${expectedComponentId}`);
  failed = true;
}

if (failed) process.exit(1);
console.log(`校验通过：${requiredFiles.length} 个工程文件，${scriptFiles.length} 个 TypeScript 模块。`);
