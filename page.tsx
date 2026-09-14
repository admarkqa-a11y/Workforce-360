import {redirect} from 'next/navigation';
import {portalSession} from './portal-session';
export const dynamic='force-dynamic';
export default async function Page(){const a=await portalSession();redirect('/'+(a?.role||'admin'));}
