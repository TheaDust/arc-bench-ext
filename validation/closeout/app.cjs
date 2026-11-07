const http = require('node:http');
const html = String.raw`<!doctype html><html><body><main id="app"></main><script>
const mode=location.pathname.split('/')[1]||'ok';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const original={owner:'repo-owner',branch:'main',head:'source-2',files:[['README.md','Acme docs'],['src/README.md','Document search flow']],commits:[['source-1','','alice-dev','Initialize acme docs'],['source-2','source-1','alice-dev','Document search flow']]};
const base={owner:'repo-owner',branch:'main',head:'base-1',files:[['base-only.md','Base branch content'],['shared.md','Common content']],commits:[['base-1','','alice-dev','Initialize merge demo']]};
const compare={...structuredClone(base),branch:'feature-search',head:'compare-1',files:[...base.files,['feature-only.md','Feature branch content']],commits:[...base.commits,['compare-1','base-1','alice-dev','Add feature']]};
let state=JSON.parse(localStorage.getItem('state')||'null')||{user:'',repos:{'acme-docs':{main:original},'merge-demo':{main:base,'feature-search':compare}},merged:false};
let popup='';
const save=()=>localStorage.setItem('state',JSON.stringify(state));
const nav=route=>{if(location.hash.slice(1)===route)render();else location.hash=route;};
const link=(name,route)=>'<a href="#'+escape(route)+'">'+escape(name)+'</a>';
const button=(name,command,extra='')=>'<button '+extra+' onclick="act(\''+command+'\')">'+escape(name)+'</button>';
const field=(name,type='text')=>'<label>'+escape(name)+'<input aria-label="'+escape(name)+'" type="'+type+'"></label>';
const value=name=>document.querySelector('[aria-label="'+name+'"]').value;
const status=(name,text)=>'<span role="status" aria-label="'+name+'">'+escape(text)+'</span>';
const table=(name,heads,rows)=>'<table aria-label="'+name+'"><thead><tr>'+heads.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(c=>'<td>'+escape(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
function branch(b){return '<section aria-label="Branch state">'+status('Repository owner',b.owner)+status('Branch name',b.branch)+status('Branch head',b.head)+'</section>'+table('Branch files',['Path','Content'],b.files)+table('Commit history',['Commit','Parents','Author','Message'],b.commits);}
function render(){
 const route=location.hash.slice(1)||'home',parts=route.split('/');
 let out=state.user?'<span>'+escape(state.user)+'</span>'+button('Account menu','account'):link('Sign in','login');
 if(route==='login')out+=field('Username or email')+field('Password','password')+button('Sign in','signin');
 else if(route==='home')out+=link('New repository','newrepo')+link('acme-docs','repo/acme-docs/main')+link('Mergeable onboarding PR','pr/eligible')+link('Blocked onboarding PR','pr/blocked');
 else if(route==='newrepo')out+=field('Repository name')+field('Description')+'<label><input type="radio" name="visibility">Private</label><label><input type="checkbox">Add a README file</label>'+button('Create repository','create');
 else if(parts[0]==='repo'){
  const name=parts[1],b=state.repos[name][parts[2]];
  out+='<h1>'+escape(name)+'</h1>'+(name.startsWith('pw-repository-')?'<span>Private</span>'+link('README.md','readme/'+name):'');
  if(state.repos[name].source)out+='<div>Forked from '+link('acme-docs','repo/acme-docs/main')+'</div>';
  out+=branch(b)+button('Fork','fork')+button('Add file','addfile')+link('Owner repositories','owner/'+b.owner);
 }else if(parts[0]==='owner'){
  for(const [name,repo]of Object.entries(state.repos))if(repo.main.owner===parts[1]&&!(mode==='init-list'&&name.startsWith('pw-repository-')))out+=link(name,'repo/'+name+'/main');
 }else if(route==='forkform')out+=field('Repository name')+button('Create fork','createfork');
 else if(parts[0]==='filemenu')out+='<button role="menuitem" onclick="act(\'newfile\')">Create new file</button>';
 else if(parts[0]==='newfile')out+=field('File name')+field('File contents')+field('Commit message')+button('Commit changes','commit');
 else if(parts[0]==='pr'){
  const eligible=parts[1]==='eligible';
  out+='<h1>'+(eligible?'Mergeable onboarding PR':'Blocked onboarding PR')+'</h1>'+link('Base branch','repo/merge-demo/main')+link('Compare branch','repo/merge-demo/feature-search');
  out+='<span>'+(state.merged&&eligible?'Merged':'Open')+'</span><label>Merge method<select aria-label="Merge method"><option>Create a merge commit</option></select></label>';
  out+=button('Merge pull request','merge',!eligible||state.merged?'disabled':'');
  if(!eligible)out+='<span>Review required by branch protection</span>';
  if(popup==='merge')out+=button('Confirm merge','confirm');
  if(state.merged&&eligible)out+='<section aria-label="Merge result">'+status('Merge commit','merge-1')+status('Merged by','pr-maintainer')+status('Merged at','2026-11-06T10:00:00Z')+'</section>';
  if(!eligible&&mode==='refusal-write'){state.blockedVisits=(state.blockedVisits||0)+1;if(state.blockedVisits>=3){state.repos['merge-demo'].main.files.push(['leaked.md','wrong write']);save();}}
 }
 document.querySelector('#app').innerHTML=out;
}
function act(command){
 const route=location.hash.slice(1),parts=route.split('/');
 if(command==='signin'){state.user=value('Username or email');save();nav('home');return;}
 if(command==='create'){
  const name=value('Repository name');
  state.repos[name]={main:{owner:state.user,branch:'main',head:'initial-1',files:[['README.md','# '+name]],commits:mode==='init-history'?[]:[['initial-1','',state.user,'Initial commit']]}};save();nav('repo/'+name+'/main');return;
 }if(command==='fork'){nav('forkform');return;}
 if(command==='createfork'){
  const name=value('Repository name'),copy=structuredClone(state.repos['acme-docs'].main);copy.owner=state.user;
  if(mode==='fork-files')copy.files=copy.files.slice(0,1);
  state.repos[name]={main:copy,source:'acme-docs'};save();nav('repo/'+name+'/main');return;
 }if(command==='addfile'){nav('filemenu/'+parts[1]);return;}
 if(command==='newfile'){nav('newfile/'+parts[1]);return;}
 if(command==='commit'){
  const b=state.repos[parts[1]].main,prev=b.head;
  b.head='fork-3';b.files.push([value('File name'),value('File contents')]);b.commits.push([b.head,prev,state.user,value('Commit message')]);
  if(mode==='fork-writeback'){const src=structuredClone(b);src.owner='repo-owner';state.repos['acme-docs'].main=src;}
  save();nav('repo/'+parts[1]+'/main');return;
 }if(command==='merge'){popup='merge';render();return;}
 if(command==='confirm'){
  state.merged=true;popup='';
  if(mode!=='merge-status'){
   const b=state.repos['merge-demo'].main,c=state.repos['merge-demo']['feature-search'];
   const parents=mode==='merge-parents'?c.head+','+b.head:b.head+','+c.head;
   b.head='merge-1';b.files=structuredClone(c.files);b.commits=[...structuredClone(c.commits),['merge-1',parents,state.user,'Merge onboarding']];
  }save();render();return;
 }
 render();
}
window.addEventListener('hashchange',render);render();
</script></body></html>`;
module.exports=html;
if(require.main===module)http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);}).listen(0,'127.0.0.1',function(){console.log(this.address().port);});
