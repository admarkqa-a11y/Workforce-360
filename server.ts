import {database,storage} from './postgres';
import {Actor,State} from './model';
import {unseal,seal} from './security';
export const db=()=>database;
export const secret=()=> process.env.WORKFORCE360_SECRET||'';
export const bucket=()=>storage;
export async function state(){const row=await db().prepare('SELECT body,revision,owner FROM workforce360 WHERE id=1').first();return row?{data:JSON.parse(row.body) as State,revision:row.revision as number,owner:row.owner as string}:null;}
export async function save(data:State,revision:number){const result=await db().prepare('UPDATE workforce360 SET body=?,revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(data),revision).run();if(!result.meta.changes)throw Error('Records changed in another session. Refresh and try again.');}
export async function actor(req:Request,s:State):Promise<Actor>{const token=req.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('wf360='))?.slice(6);if(!token)throw Error('UNAUTHORIZED');let a:any;try{a=JSON.parse(await unseal(token,secret()));}catch{throw Error('UNAUTHORIZED');}if(a.expires<Date.now())throw Error('UNAUTHORIZED');const user=a.role==='admin'?s.admin:s.foremen.find(f=>f.id===a.id&&f.status==='Active');if(!user||user.id!==a.id||!user.credentials||user.credentials.version!==a.version)throw Error('UNAUTHORIZED');return a;}
export async function cookie(a:Actor){return 'wf360='+await seal(JSON.stringify({...a,expires:Date.now()+12*3600000}),secret())+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200';}
export function origin(req:Request){const o=req.headers.get('origin');if(o&&new URL(o).host!==new URL(req.url).host)throw Error('Invalid request origin.');}
export function error(e:unknown){const message=e instanceof Error?e.message:'Request failed. Try again.';console.error('Workforce360 request failed:',message);return Response.json({error:message==='UNAUTHORIZED'?'Please sign in to continue.':message},{status:message==='UNAUTHORIZED'?401:400,headers:{'Cache-Control':'no-store'}});}
export const json=(data:unknown,headers:Record<string,string>={})=>Response.json(data,{headers:{'Cache-Control':'no-store',...headers}});
