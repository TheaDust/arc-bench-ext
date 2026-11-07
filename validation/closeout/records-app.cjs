const http=require('node:http');
const html=String.raw`<!doctype html><html><head><style>[role=gridcell]{min-width:100px;min-height:24px}section{min-height:20px}</style></head><body><main id="app"></main><script>
const mode=__ORACLE_MODE__,kind=mode.split('-')[0],base='/'+mode+'/';
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const field=(name,type='text')=>'<label>'+esc(name)+'<input aria-label="'+esc(name)+'" type="'+type+'"></label>';
const val=name=>document.querySelector('[aria-label="'+name+'"]').value;
const link=(name,route)=>'<a href="#'+esc(route)+'">'+esc(name)+'</a>';
const button=(name,command,extra='')=>'<button '+extra+' onclick="act(\''+command+'\')">'+esc(name)+'</button>';
const region=(name,body)=>'<section aria-label="'+name+'">'+body+'</section>';
const record=(name,route)=>'<div role="listitem">'+link(name,route)+'</div>';
const nav=route=>{if(location.hash.slice(1)===route)render();else location.hash=route;};
let state=JSON.parse(localStorage.getItem('state')||'null')||{user:'',books:[],pages:[],shelves:['Benchmark Bootstrap Shelf'],views:[]},data={workbooks:[],members:['existing-member']};
let popup='',error='';
const save=()=>localStorage.setItem('state',JSON.stringify(state));
async function shared(action,payload){data=await(await fetch(base+'state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,payload})})).json();}
async function render(){
 const route=location.hash.slice(1)||'home',parts=route.split('/');
 let out='';
 if(kind==='sheet'){
  const book=data.workbooks.find(b=>b.id===parts[1]);
  if(parts[0]==='workbook'&&book&&!(mode==='sheet-direct'&&!sessionStorage.visited)){
   out='<h1>'+esc(book.name)+'</h1><p>Last updated: 2026-11-06T10:00:00Z</p>'+button('Rename workbook','rename')+'<button role="tab" aria-selected="true">Sheet1</button><div role="grid" aria-label="Worksheet grid" aria-multiselectable="true"><div role="gridcell" aria-label="A1" aria-selected="true">'+esc(book.value)+'</div></div>'+field('Formula bar');
   if(popup==='rename')out+=field('Workbook name')+button('Save','renameSave');
  }else{
   out=button('New blank workbook','blank');if(popup==='blank')out+=button('Create','createWorkbook');
   for(const b of data.workbooks){const time='<span>Last updated: 2026-11-06T10:00:00Z</span>';out+='<div role="group" aria-label="Workbook '+esc(b.name)+'"><a href="#workbook/'+b.id+'" aria-label="'+esc(b.name)+'">'+esc(b.name)+(mode==='sheet-nested'?time:'')+'</a>'+(mode==='sheet-nested'?'':time)+'</div>';}
   sessionStorage.visited='yes';
  }
 }else if(kind==='member'){
  out=state.user?'<span>'+esc(state.user)+'</span>'+button('Account menu','account'):link('Sign in','login');
  if(route==='login')out+=field('Username or email')+field('Password','password')+button('Sign in','memberLogin');
  else if(route==='organizations')out+=link('Acme Demo','organization');
  else if(route==='organization')out+=link('People','people')+link('Repositories','repositories');
  else if(route==='repositories')out+=link('secret-research','secret');
  else if(route==='secret')out+=state.user==='org-owner'||mode==='member-access'?'<h1>secret-research</h1>':'<p>Access denied</p>';
  else if(route==='people'){
   out+=link('Repositories','repositories')+button('Add member','addMember');
   for(const member of data.members)out+='<div role="group" aria-label="Member '+esc(member)+'"><span>'+esc(member)+'</span><span>'+(member==='new-member'&&mode==='member-role'?'Owner':'Member')+'</span></div>';
   if(popup==='member')out+='<div role="group" aria-label="Add member form">'+field('Username or email')+'<label>Role<select aria-label="Role"><option>Member</option></select></label>'+button('Add member','submitMember')+'<p>'+esc(error)+'</p></div>';
  }
  if(popup==='account')out+=link('Your organizations','organizations');
 }else{
  out='<nav>'+link('Shelves','shelves')+link('Books','books')+link('Login','login')+'</nav>';
  if(state.user)out+='<span>BookStack User</span>'+region('My Recent Drafts','');
  if(route==='login')out+=field('Email')+field('Password','password')+'<label><input type="checkbox">Remember Me</label>'+button('Login','bookLogin');
  else if(route==='shelves')out+=region('Shelf list',state.shelves.map(n=>record(n,'shelf/'+encodeURIComponent(n))).join(''));
  else if(route==='books')out+=link('Create New Book','newbook')+region('Book list',state.books.map(b=>record(b.name,'book/'+encodeURIComponent(b.name))).join(''));
  else if(route==='newshelf'||route==='newbook')out+=field('Name')+field('Description')+field('Tags')+button(route==='newshelf'?'Save Shelf':'Save Book',route==='newshelf'?'saveShelf':'saveBook');
  else if(parts[0]==='shelf')out+='<h1>'+esc(decodeURIComponent(parts[1]))+'</h1>'+link('New Shelf','newshelf');
  else if(parts[0]==='book'){
   const name=decodeURIComponent(parts[1]),b=state.books.find(b=>b.name===name);
   out+='<h1>'+esc(name)+'</h1>'+button(b.favorite?'Unfavorite':'Favorite','favorite','aria-pressed="'+!!b.favorite+'"')+button('New Page','newpage')+region('Page list',state.pages.filter(p=>p.book===name).map(p=>record(p.name,'page/'+encodeURIComponent(p.name))).join(''));
  }else if(parts[0]==='newpage')out+=field('Page title')+field('Write your page content here...')+button('Save Page','savePage');
  else if(parts[0]==='page'){const p=state.pages.find(p=>p.name===decodeURIComponent(parts[1]));out+='<h1>'+esc(p.name)+'</h1><p>'+esc(p.body)+'</p>';}
  else if(route==='home'){
   const cap=(items,n)=>mode==='book-uncapped'?items:items.slice(0,n);
   out+=region('My Recently Viewed',cap(state.views,10).map(v=>record(v.name,v.route)).join('')+button('View all','noop'));
   out+=region('My Most Viewed Favorites',cap(state.books.filter(b=>b.favorite),4).map(b=>record(b.name,'book/'+encodeURIComponent(b.name))).join('')+link('Help','help'));
   out+=region('Recently Updated Pages',cap([...state.pages].reverse(),5).map(p=>record(p.name,'page/'+encodeURIComponent(p.name))).join(''));
  }
 }
 document.querySelector('#app').innerHTML=out;
 if(kind==='sheet'&&parts[0]==='workbook'){
  const input=document.querySelector('[aria-label="Formula bar"]');
  if(input)input.addEventListener('keydown',async e=>{if(e.key==='Enter'){await shared('edit',{id:parts[1],value:input.value});render();}});
 }
}
async function act(command){
 const route=location.hash.slice(1)||'home',parts=route.split('/');
 if(command==='blank'){popup='blank';render();return;}
 if(command==='createWorkbook'){await shared('create');popup='';nav('workbook/'+data.workbooks.at(-1).id);return;}
 if(command==='rename'){popup='rename';render();return;}
 if(command==='renameSave'){await shared('rename',{id:parts[1],name:val('Workbook name')});popup='';render();return;}
 if(command==='memberLogin'){state.user=val('Username or email').split('@')[0];popup='';save();nav('home');return;}
 if(command==='account'){popup='account';render();return;}
 if(command==='addMember'){popup='member';error='';render();return;}
 if(command==='submitMember'){
  const username=val('Username or email');
  if(data.members.includes(username))error='Account is already a member';
  else if(username==='unknown-reviewer')error='Account not found';
  else {await shared('member',{username});if(mode==='member-persist')data.members.push(username);popup='';}
  render();return;
 }
 if(command==='bookLogin'){state.user='BookStack User';save();nav('home');return;}
 if(command==='saveShelf'){state.shelves.push(val('Name'));save();nav('shelves');return;}
 if(command==='saveBook'){const name=val('Name');state.books.push({name,favorite:false});save();nav('book/'+encodeURIComponent(name));return;}
 if(command==='favorite'){const b=state.books.find(b=>b.name===decodeURIComponent(parts[1]));b.favorite=!b.favorite;save();render();return;}
 if(command==='newpage'){nav('newpage/'+parts[1]);return;}
 if(command==='savePage'){state.pages.push({name:val('Page title'),body:val('Write your page content here...'),book:decodeURIComponent(parts[1])});save();nav('book/'+parts[1]);return;}
 render();
}
async function routeChanged(){
 if(kind==='book'){
  const route=location.hash.slice(1),parts=route.split('/');
  if(['shelf','book','page'].includes(parts[0])){const name=decodeURIComponent(parts[1]);state.views=[{name,route},...state.views.filter(v=>v.route!==route)];save();}
 }
 if(kind==='sheet'||kind==='member')await shared('read');
 render();
}
window.addEventListener('hashchange',routeChanged);routeChanged();
</script></body></html>`;
const stores=new Map();
const server=http.createServer(async(req,res)=>{
 const mode=req.url.split('/')[1];
 if(req.url.endsWith('/state')){
  let body='';for await(const chunk of req)body+=chunk;
  const {action,payload}=JSON.parse(body||'{}');
  const state=stores.get(mode)||{workbooks:[],members:['existing-member']};stores.set(mode,state);
  if(action==='create')state.workbooks.push({id:String(state.workbooks.length+1),name:'Untitled workbook',value:''});
  if(action==='rename')state.workbooks.find(b=>b.id===payload.id).name=payload.name;
  if(action==='edit'&&mode!=='sheet-persist')state.workbooks.find(b=>b.id===payload.id).value=payload.value;
  if(action==='member'&&mode!=='member-persist')state.members.push(payload.username);
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify(state));return;
 }
 res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html.replace('__ORACLE_MODE__',JSON.stringify(req.headers['x-oracle-mode']||mode||'book-ok')));
});
if(require.main===module)server.listen(0,'127.0.0.1',()=>console.log(server.address().port));
