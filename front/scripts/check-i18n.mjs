import { readFileSync } from 'node:fs';

function keys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

const ru = new Set(keys(JSON.parse(readFileSync('messages/ru.json', 'utf8'))));
const en = new Set(keys(JSON.parse(readFileSync('messages/en.json', 'utf8'))));

const onlyRu = [...ru].filter((k) => !en.has(k));
const onlyEn = [...en].filter((k) => !ru.has(k));

if (onlyRu.length || onlyEn.length) {
  console.error('Только в ru:', onlyRu);
  console.error('Только в en:', onlyEn);
  process.exit(1);
}
console.log('i18n: ключи совпадают');
