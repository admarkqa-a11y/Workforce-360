const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test'),ts=require('typescript'),{PGlite}=require('@electric-sql/pglite');
const root=path.resolve(__dirname,'..');
test('PostgreSQL integration: empty start, protected setup, login, profiles, foreman attendance and concurrency',async()=>{
 const pg=new PGlite();await pg.exec(fs.readFileSync(root+'/database/schema.sql','utf8'));
 process.env.DATABASE_URL='postgres://test';process.env.WORKFORCE360_SECRET='s'.repeat(64);process.env.WORKFORCE360_SETUP_KEY='k'.repeat(64);
 const cache=new Map();function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const req=name=>name==='@neondatabase/serverless'?{neon:()=>({query:async(sql,params)=>{const r=await pg.query(sql,params);return {...r,rowCount:r.affectedRows??r.rows.length};}})}:name.startsWith('.')?load(path.resolve(path.dirname(file),name)+'.ts'):require(name);new Function('require','module','exports',js)(req,m,m.exports);return m.exports;}
 const auth=load(root+'/app/api/auth/route.ts'),api=load(root+'/app/api/workforce/route.ts'),server=load(root+'/app/server.ts'),storage=load(root+'/app/postgres.ts').storage,model=load(root+'/app/model.ts');
 async function call(mod,method,payload,cookie=''){const req=new Request('https://workforce.test/api',{method,headers:{origin:'https://workforce.test',cookie,'content-type':'application/json'},...(method==='GET'?{}:{body:JSON.stringify(payload)})});const r=await mod[method](req);return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]||''};}
 assert.equal((await call(auth,'GET')).body.setup,true);assert.equal(await server.state(),null);
 assert.equal((await call(auth,'POST',{action:'signup',email:'admin@test.com',password:'Admin!1234',confirm:'Admin!1234'})).status,400);
 const setup={action:'signup',email:'admin@test.com',password:'Admin!1234',confirm:'Admin!1234',setupKey:process.env.WORKFORCE360_SETUP_KEY};assert.equal((await call(auth,'POST',setup)).status,200);assert.equal((await call(auth,'POST',setup)).status,400);
 // Exercise PostgreSQL ON CONFLICT counting twice (including the table-qualified CASE).
 for(let i=0;i<2;i++)assert.equal((await call(auth,'POST',{action:'login',username:'admin@test.com',password:'wrong'})).status,400);
 const admin=(await call(auth,'POST',{action:'login',username:'admin@test.com',password:'Admin!1234',portal:'admin'})).cookie;assert.ok(admin);
 const get=async(c=admin)=>(await call(api,'GET',null,c)).body;
 for(const key of ['employees','foremen','work','sessions','selections'])assert.equal((await get())[key].length,0);
 const mutate=async(action,record,c=admin)=>call(api,'POST',{action,record,revision:(await get(c)).revision},c);
 assert.equal((await mutate('save_employee',{name:'Worker',qid:'20000000001',mobile:'50000001',status:'Active'})).status,200);
 assert.equal((await mutate('save_foreman',{name:'Foreman',qid:'30000000001',mobile:'60000001',status:'Active'})).status,200);
 let d=await get();const emp=d.employees[0],foreman=d.foremen[0];assert.equal((await mutate('create_user',{id:foreman.id,password:'Foreman!123',confirmPassword:'Foreman!123'})).status,200);
 const fm=(await call(auth,'POST',{action:'login',username:foreman.code,password:'Foreman!123',portal:'foreman'})).cookie;assert.ok(fm);assert.equal((await mutate('save_employee',{},fm)).status,400);
 assert.equal((await mutate('save_work',{kind:'project',name:'Project test',location:'Doha',startDate:'2026-09-01',status:'Active'})).status,200);
 assert.equal((await mutate('save_work',{kind:'maintenance',name:'Maintenance test',location:'Doha',propertyName:'Building',status:'Active'})).status,200);
 const w=(await get()).work[0];assert.equal((await mutate('selection',{work:w.id,employees:[emp.id]},fm)).status,200);
 assert.equal((await mutate('checkin',{work:w.id,employees:[emp.id],datetime:'2026-09-10T22:00'},fm)).status,200);
 assert.equal((await mutate('checkout',{work:w.id,employees:[emp.id],datetime:'2026-09-11T02:00'},fm)).status,200);
 d=await get(fm);assert.equal(model.reportRows(d.sessions,'2026-09-10','2026-09-11','daily').reduce((n,r)=>n+r.hours,0),4);
 const image=new Uint8Array([137,80,78,71]);await storage.put('picture',image.buffer,{httpMetadata:{contentType:'image/png'}});assert.deepEqual([...((await storage.get('picture')).body)],[...image]);await storage.delete('picture');assert.equal(await storage.get('picture'),null);
 const s=await server.state();await server.save(s.data,s.revision);await assert.rejects(()=>server.save(s.data,s.revision),/Records changed/);
 assert.equal((await call(auth,'POST',{action:'forgot',email:'admin@test.com',setupKey:'bad'})).status,400);
 const mail=(await call(auth,'POST',{action:'forgot',email:'admin@test.com',setupKey:process.env.WORKFORCE360_SETUP_KEY})).body.dummyMail;assert.ok(mail);const token=new URL(mail.link,'https://test').searchParams.get('token');assert.equal((await call(auth,'POST',{action:'reset',token,password:'Changed!123',confirm:'Changed!123'})).status,200);assert.equal((await call(api,'GET',null,admin)).status,401);
 await pg.exec(fs.readFileSync(root+'/database/schema.sql','utf8'));assert.equal((await pg.query('SELECT count(*) AS n FROM workforce360')).rows[0].n,1,'schema rerun preserves records');await pg.close();
});
