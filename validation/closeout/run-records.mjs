import { spawn,execFile } from 'node:child_process';
import { once } from 'node:events';
import { promisify } from 'node:util';
import { readFile,writeFile } from 'node:fs/promises';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const directory=dirname(fileURLToPath(import.meta.url)),root=resolve(directory,'../..');
const server=spawn(process.execPath,[resolve(directory,'records-app.cjs')],{windowsHide:true,stdio:['ignore','pipe','pipe']});
const [data]=await once(server.stdout,'data'),port=Number(String(data).trim());assert.ok(port>0);
try{
 const report=resolve(directory,'records-report.json');
 const result=await promisify(execFile)(process.execPath,[resolve(root,'node_modules/@playwright/test/cli.js'),'test','--config',resolve(directory,'records.config.ts')],{
  cwd:root,windowsHide:true,timeout:120000,maxBuffer:5*1024*1024,env:{...process.env,CLOSEOUT_BASE_URL:'http://127.0.0.1:'+port,PLAYWRIGHT_JSON_OUTPUT_NAME:report}
 }).catch(error=>({stdout:error.stdout||'',stderr:error.stderr||''}));
 await writeFile(resolve(directory,'records.log'),result.stdout+result.stderr);
 const parsed=JSON.parse(await readFile(report,'utf8')),rows=[];
 const walk=suites=>{for(const suite of suites){for(const spec of suite.specs)for(const test of spec.tests){const r=test.results.at(-1);rows.push({title:spec.title,project:test.projectName,status:r?.status,error:r?.error?.message});}walk(suite.suites||[]);}};walk(parsed.suites);
 const good=rows.filter(row=>['sheet-sibling','sheet-nested','member-ok','book-ok'].includes(row.project)),bad=rows.filter(row=>!good.includes(row));
 const summary={positive:{total:good.length,passed:good.filter(row=>row.status==='passed').length},mutants:{total:bad.length,rejected:bad.filter(row=>row.status==='failed').length},rows};
 await writeFile(resolve(directory,'records-summary.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify({positive:summary.positive,mutants:summary.mutants}));
 assert.equal(good.length,10);assert.ok(good.every(row=>row.status==='passed'));
 assert.equal(bad.length,7);assert.ok(bad.every(row=>row.status==='failed'));
 assert.ok(bad.every(row=>row.error?.includes('expect(')),'Every mutant must fail a business assertion');
}finally{server.kill();await once(server,'exit');}
