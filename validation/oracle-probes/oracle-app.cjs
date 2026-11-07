const http = require('node:http');
const html = String.raw`<!doctype html><html><body><main id="app"></main><script>
const broken = location.pathname.startsWith('/broken/');
const state = JSON.parse(localStorage.getItem('business') || '{}');
let view = state.view || 'workspace', popup = '';
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const button = (name, command) => '<button onclick="act(\''+command+'\')">'+escape(name)+'</button>';
const link = (name, command) => '<a href="#" onclick="event.preventDefault();act(\''+command+'\')">'+escape(name)+'</a>';
const field = (name, type='text') => '<label>'+name+'<input type="'+type+'" aria-label="'+name+'"></label>';
const value = name => document.querySelector('[aria-label="'+name+'"]').value;
const save = () => {state.view=view;localStorage.setItem('business',JSON.stringify(state));};
function render() {
 const username = document.cookie.split('; ').find(c=>c.startsWith('user='))?.slice(5);
 let body = username ? '<span>'+escape(username)+'</span>'+button('Account menu','account') : link('Sign in','login');
 if(view==='login') body += field('Username or email')+field('Password','password')+button('Sign in','signIn');
 else if(view==='workspace') {
  for(const name of ['acme-docs','visibility-demo','file-management-demo','Assignable onboarding issue','Reviewable onboarding PR']) body+=link(name,name);
 } else if(['acme-docs','visibility-demo','file-management-demo'].includes(view)) {
  body+='<h1>'+view+'</h1>';
  if(view==='visibility-demo'&&state.public)body+='<span>Public</span>';
  body+=link('Settings','settings')+button('Add file','addFile');
 } else if(view==='settings')body+=link('Manage access','access')+link('General','general');
 else if(view==='access') {
  body+=button('Add people or teams','addGrant');
  if(state.grant)body+='<table><tr><td>frontend-team</td><td>Write</td></tr></table>';
  if(popup==='grant')body+=field('Search')+'<button role="option" onclick="act(\'team\')">frontend-team</button><label>Role<select aria-label="Role"><option>Read</option><option>Write</option></select></label>'+button('Add','grant');
 } else if(view==='general') {
  body+=button('Change visibility','visibility');
  if(popup==='visibility')body+='<label><input type="radio" name="visibility">Public</label>'+button('Confirm visibility','confirmVisibility');
 } else if(view==='fileMenu')body+='<button role="menuitem" onclick="act(\'newFile\')">Create new file</button>';
 else if(view==='newFile')body+=field('File name')+field('File contents')+field('Commit message')+button('Commit changes','commit');
 else if(view==='file')body+='<p>'+escape(state.content||'')+'</p>'+link('Commits','history');
 else if(view==='history')body+='<p>'+escape(state.message||'')+'</p>';
 else if(view==='Assignable onboarding issue') {
  body+='<h1>Assignable onboarding issue</h1>'+button('Assignees','assignees');
  if(state.assigned)body+='<span>bob-reviewer</span>';
  if(popup==='assignees')body+=field('Search assignees')+'<button role="option" onclick="act(\'assign\')">bob-reviewer</button>';
 } else if(view==='Reviewable onboarding PR')body+='<h1>Reviewable onboarding PR</h1>'+link('Files changed','diff');
 else if(view==='diff') {
  body+=button('Add comment','comment');
  if(popup==='comment')body+=field('Comment')+button('Add single comment','publish');
  body+='<p>'+escape(state.comment||'')+'</p>';
 }
 document.querySelector('#app').innerHTML=body;
}
function act(command) {
 if(command==='login')view='login';
 else if(command==='signIn'){document.cookie='user='+value('Username or email')+';path=/';view='workspace';}
 else if(command==='account'){}
 else if(command==='addGrant')popup='grant';
 else if(command==='team'){}
 else if(command==='grant'){if(!broken)state.grant=true;popup='';}
 else if(command==='visibility')popup='visibility';
 else if(command==='confirmVisibility'){if(!broken)state.public=true;popup='';view='visibility-demo';}
 else if(command==='addFile')view='fileMenu';
 else if(command==='commit'){if(!broken){state.content=value('File contents');state.message=value('Commit message');}view='file';}
 else if(command==='assignees')popup='assignees';
 else if(command==='assign'){if(!broken)state.assigned=!state.assigned;popup='';}
 else if(command==='comment')popup='comment';
 else if(command==='publish'){if(!broken)state.comment=value('Comment');popup='';}
 else view=command;
 save();render();
}
render();
</script></body></html>`;
const server = http.createServer((_request,response)=>{response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});response.end(html);});
module.exports = html;
if (require.main === module) server.listen(0,'127.0.0.1',()=>console.log(server.address().port));
