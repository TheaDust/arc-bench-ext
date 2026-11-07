import { spawn, execFile } from 'node:child_process';
import { once } from 'node:events';
import { promisify } from 'node:util';
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import assert from 'node:assert/strict';
const root=dirname(fileURLToPath(import.meta.url));
const app=spawn(process.execPath,[join(root,'oracle-app.cjs')],{windowsHide:true,stdio:['ignore','pipe','pipe']});
const [data]=await once(app.stdout,'data');
const port=Number(String(data).trim());
assert.ok(port>0);
const run=promisify(execFile), summary=[];
try {
 for(const mode of ['ok','broken']) {
  const report=join(root,`oracle-${mode}.json`);
  const result=await run(process.execPath,[resolve(root,'../../node_modules/@playwright/test/cli.js'),'test','--config',join(root,'oracle.config.ts')],{
   cwd:resolve(root,'../..'),windowsHide:true,timeout:60000,maxBuffer:4*1024*1024,
   env:{...process.env,ORACLE_BASE_URL:`http://127.0.0.1:${port}/${mode}/`,PLAYWRIGHT_JSON_OUTPUT_NAME:report}
  }).catch(e=>({stdout:e.stdout||'',stderr:e.stderr||'',code:e.code}));
  await writeFile(join(root,`oracle-${mode}.log`),result.stdout+result.stderr);
  const parsed=JSON.parse(await readFile(report,'utf8'));
  summary.push({mode,...parsed.stats});
  console.log(JSON.stringify(summary.at(-1)));
 }
 await writeFile(join(root,'oracle-summary.json'),JSON.stringify(summary,null,2));
 assert.equal(summary[0].expected,5);assert.equal(summary[0].unexpected,0);
 assert.equal(summary[1].unexpected,5);assert.equal(summary[1].expected,0);
} finally {app.kill();}
