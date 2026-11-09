import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [controller, task, application, output, requestedMethod='shallow'] = process.argv.slice(2);
const method = requestedMethod === 'baseline' ? 'pi' : requestedMethod;
if (!controller || !task || !application || !output || !['pi','opencode','shallow','arc'].includes(method)) {
  console.error('Usage: node evaluate-project.mjs <ShallowCode directory> <task> <application directory> <new output directory> [pi|opencode|shallow|arc] (baseline is a legacy alias for pi)');
  process.exitCode=2;
} else {
  const root=resolve(controller), benchmark=dirname(fileURLToPath(import.meta.url));
  const loader=createRequire(join(root,'package.json')).resolve('tsx');
  const source=String.raw`
import { readFile,mkdir,writeFile } from 'node:fs/promises';
import { resolve,join,dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
try {
const [controller,bench,name,application,directory,method]=process.argv.slice(1);
const load=path=>import(pathToFileURL(join(controller,path)).href);
const {executeWorker}=await load('src/experiments/worker.ts');
const {discoverArcTasks,implementationDigest,inside}=await load('src/experiments/protocol.ts');
const {snapshotFiles}=await load('src/run-record.ts');
const {sha256,canonicalBytes,matchesFrozenHash}=await import(pathToFileURL(join(bench,'validation/frozen-inputs.mjs')).href);
const revisionBytes=await readFile(join(bench,'revision.json'));
const revision=JSON.parse(revisionBytes);
assert.equal(revision.evaluation.protocol,'application-per-scenario-v1');
for(const [path,expected] of Object.entries(revision.evaluation.controllerFiles))assert.ok(matchesFrozenHash(path,await readFile(join(controller,path)),expected),'Controller changed: '+path);
assert.ok(!inside(application,directory)&&!inside(directory,application),'Evaluation and application directories must be disjoint');
const task=(await discoverArcTasks(bench)).find(task=>task.id===name);
assert.ok(task,'Unknown task: '+name);
for(const [kind,files] of [['requirements',task.requirementFiles],['tests',task.testFiles]]){
 const prefix='arc-bench/'+name+'/'+kind+'/';
 const expected=Object.fromEntries(Object.entries(revision.files).filter(([path])=>path.startsWith(prefix)).map(([path,hash])=>[path.slice(prefix.length),hash]));
 assert.deepEqual(Object.keys(files).sort(),Object.keys(expected).sort(),'Frozen '+kind+' file set changed');
 for(const [path,hash] of Object.entries(expected)){
  if(files[path]!==hash)assert.ok(matchesFrozenHash(path,await readFile(join(bench,prefix,path)),hash),'Frozen file changed: '+prefix+path);
 }
}
const setupScript=join(bench,'setup-playwright.cjs');
assert.ok(matchesFrozenHash(setupScript,await readFile(setupScript),revision.files['setup-playwright.cjs']),'Frozen Playwright setup changed');
await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
const initial=await snapshotFiles(application);
await writeFile(join(directory,'manifest.json'),JSON.stringify({revision:revision.revision,revisionSha256:sha256(canonicalBytes('revision.json',revisionBytes)),
 protocol:revision.evaluation.protocol,controllerDigest:await implementationDigest(),node:process.version,
 task,method,application,applicationFiles:initial},null,2)+'\n');
const catalogDir=join(directory,'catalog'),evaluationDir=join(directory,'evaluation');
await executeWorker({action:'catalog',task,setupScript,directory:catalogDir,timeoutMs:null});
const catalog=JSON.parse(await readFile(join(catalogDir,'catalog.json'),'utf8'));
await executeWorker({action:'evaluate',method,task,setupScript,directory:evaluationDir,projectDir:application,catalog,timeoutMs:null});
assert.deepEqual(await snapshotFiles(application),initial,'Delivered application changed during evaluation');
const evaluation=JSON.parse(await readFile(join(evaluationDir,'evaluation.json'),'utf8'));
console.log(JSON.stringify(evaluation,null,2));
process.exitCode=evaluation.status!=='completed'?2:evaluation.score.failed?1:0;
} catch(error) { console.error(error); process.exitCode=2; }
`;
  const result=spawnSync(process.execPath,['--import',pathToFileURL(loader).href,'--input-type=module','--eval',source,
    root,benchmark,task,resolve(application),resolve(output),method],{stdio:'inherit',windowsHide:true});
  if(result.error)console.error(result.error.message);
  process.exitCode=result.status===1&&!existsSync(join(resolve(output),'evaluation/evaluation.json'))?2:result.status??2;
}
