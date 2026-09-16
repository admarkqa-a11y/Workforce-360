import Workforce from '../workforce';
import AuthForm from '../auth-form';
import {portalSession} from '../portal-session';
export const dynamic='force-dynamic';
export default async function Page(){const a=await portalSession('foreman');return a?<Workforce role="foreman"/>:<AuthForm mode="login" portal="foreman"/>;}
