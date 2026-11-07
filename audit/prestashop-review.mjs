import { readFileSync, writeFileSync } from 'node:fs';
import { parseDocument } from 'yaml';
import { resolve } from 'node:path';
const root=resolve('outputs/arc-bench-reviewed-20261107');
const path=resolve(root,'arc-bench/prestashop/requirements/requirements.yaml');
const doc=parseDocument(readFileSync(path,'utf8'),{keepSourceTokens:true});
if(doc.errors.length)throw doc.errors;
const data=doc.toJS();
const leaves=[];
function walk(n,parents=[]){
 if(n.children?.length){
  console.log('PARENT',n.id,n.description?.text??'');
  for(const c of n.children)walk(c,[...parents,{id:n.id,text:n.description?.text??''}]);
 } else {
  const testFile=`arc-bench/prestashop/tests/${n.id}.spec.ts`;
  leaves.push({...n,parents,testFile,test:readFileSync(resolve(root,testFile),'utf8')});
 }
}
walk(data);
writeFileSync(resolve(root,'audit/prestashop-source.json'),JSON.stringify(leaves,null,2));
for(let i=0;i<leaves.length;i+=10){
 const txt=leaves.slice(i,i+10).map(n=>`${n.id} ${n.name}\n${n.description?.text}\n${n.scenarios.map(s=>`${s.id} ${s.name}\n${s.steps.map(x=>JSON.stringify(Object.fromEntries(Object.entries(x).filter(([k])=>['Given','When','Then','And','But'].includes(k)).map(([k,v])=>[k,v.split('Seed prerequisites')[0].trim()])))).join('\n')}`).join('\n')}\nTEST\n${n.test.split('\n').filter(x=>!x.startsWith('import ')).join('\n')}`).join('\n\n');
 writeFileSync(resolve(root,`audit/prestashop-batch-${i/10}.txt`),txt);
}
