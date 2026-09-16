import Workforce from '../workforce';
import AuthForm from '../auth-form';
import {portalSession} from '../portal-session';
export const dynamic='force-dynamic';
export default async function Page(){const a=await portalSession('admin');return a?<Workforce role="admin"/>:<AuthForm mode="login" portal="admin"/>;}
