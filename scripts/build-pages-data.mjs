import {readFile, writeFile, mkdir, rm} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import path from 'node:path';
import {loadData, lookup} from '../lib/receipts.mjs';
import {recordPath, encryptRecord} from '../lib/receipt-codec.mjs';

const output = path.resolve('dist-pages');
let data;
if (process.env.EC_DATA_JSON) data = JSON.parse(process.env.EC_DATA_JSON);
else {
  const runtime = parseEnv(await readFile('.dev.vars', 'utf8'));
  const loaded = loadData(runtime);
  if (loaded.demo) throw new Error('Publishing requires the actual records; demo mode is not allowed.');
  data = loaded.data;
}
if (!data?.asOf || !data?.definitions || !data?.students || !Object.keys(data.students).length) throw new Error('Submission data is missing.');
await rm(path.join(output,'records'), {recursive:true,force:true});
await mkdir(path.join(output,'records'), {recursive:true});
for (const id of Object.keys(data.students)) {
  const filename = await recordPath(id);
  const payload = {asOf:data.asOf,demo:false,courses:lookup(data,id)};
  const encrypted = await encryptRecord(id,payload);
  await writeFile(path.join(output,'records',filename), JSON.stringify(encrypted));
}
await writeFile(path.join(output,'status.json'), JSON.stringify({asOf:data.asOf,demo:false}));
await writeFile(path.join(output,'.nojekyll'),'');
await writeFile(path.join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
console.log(`Prepared ${Object.keys(data.students).length} individual encrypted records for GitHub Pages.`);
