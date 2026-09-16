import {state,save,actor,secret,cookie,origin,error,json,bucket} from '../../server';
import {publicData} from '../../model';
import {mutate,allowed,validatePerson} from '../../domain';
import {credentials,verify,seal,unseal} from '../../security';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const s=await state();if(!s)return json({setup:true});const a=await actor(req,s.data);return json(publicData(s.data,a,s.revision));}catch(e){return error(e);}}
export async function POST(req:Request){try{origin(req);const s=await state();if(!s)throw Error('Complete setup first.');const a=await actor(req,s.data);const {action,record:r={},revision}=await req.json() as any;if(revision!==s.revision)throw Error('Records changed. Refresh and try again.');let headers:Record<string,string>={};let deleteAsset:string|undefined;
 if(action==='save_foreman'){allowed(a,'admin');const p=validatePerson(s.data,r,'foreman');const old=r.id?s.data.foremen.find(f=>f.id===r.id):null;if(r.id&&!old)throw Error('Foreman not found.');if(old){if(old.status!==p.status&&old.credentials)old.credentials.version++;Object.assign(old,p);}else s.data.foremen.push({...p,id:crypto.randomUUID(),code:'FM-'+String(++s.data.counters.foreman).padStart(3,'0')});}
 else if(action==='create_user'){allowed(a,'admin');const f=s.data.foremen.find(f=>f.id===r.id);if(!f)throw Error('Choose an existing foreman.');if(f.status!=='Active')throw Error('Activate the foreman before creating login credentials.');if(r.password!==r.confirmPassword)throw Error('Passwords do not match.');f.credentials=await credentials(r.password,(f.credentials?.version||0)+1);f.passwordCipher=await seal(r.password,secret());}
 else if(action==='reveal_password'){allowed(a,'admin');const f=s.data.foremen.find(f=>f.id===r.id);if(!f?.credentials||!f.passwordCipher)throw Error('Create login credentials on the Create User page first.');return json({password:await unseal(f.passwordCipher,secret()),username:f.code});}
 else if(action==='profile'){allowed(a,'admin');if(!r.name?.trim())throw Error('Profile name is required.');s.data.admin.name=r.name.trim();}
 else if(action==='change_password'){allowed(a,'admin');if(!await verify(r.currentPassword,s.data.admin.credentials))throw Error('Current password is incorrect.');if(r.newPassword!==r.confirmPassword)throw Error('New password and confirmation do not match.');s.data.admin.credentials=await credentials(r.newPassword,s.data.admin.credentials.version+1);headers['Set-Cookie']=await cookie({...a,version:s.data.admin.credentials.version});s.data.recovery=undefined;}
 else if(action==='delete_picture'){if(a.role==='admin'){deleteAsset=s.data.admin.picture;s.data.admin.picture=undefined;}else{const f=s.data.foremen.find(f=>f.id===a.id)!;deleteAsset=f.picture;f.picture=undefined;}}
 else mutate(s.data,a,action,r);
 await save(s.data,s.revision);if(deleteAsset)await bucket().delete(deleteAsset);return json({ok:true},headers);
 }catch(e){return error(e);}}
