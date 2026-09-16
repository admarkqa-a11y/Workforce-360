import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {state,actor} from './server';
export async function portalSession(role?:'admin'|'foreman'){const s=await state();if(!s)return null;let a;try{a=await actor(new Request('https://workforce360.internal',{headers:await headers()}),s.data);}catch{return null;}if(role&&a.role!==role)return null;return a;}
