const enc=new TextEncoder();
const hex=(b:ArrayBuffer|Uint8Array)=>Array.from(new Uint8Array(b)).map(v=>v.toString(16).padStart(2,'0')).join('');
const bytes=(s:string)=>Uint8Array.from(s.match(/.{2}/g)||[],x=>parseInt(x,16));
export const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export const digest=async(s:string)=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));
export async function credentials(password:string,version=1){if(typeof password!=='string'||password.length<8||password.length>128)throw Error('Use a password between 8 and 128 characters.');const salt=random();return {salt,hash:await derive(password,salt),version};}
async function derive(password:string,salt:string){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:bytes(salt),iterations:100000},key,256));}
export async function verify(password:string,c:{salt:string;hash:string}){if(typeof password!=='string'||password.length>128)return false;return (await derive(password,c.salt))===c.hash;}
async function key(secret:string,usage:KeyUsage[]){if(!secret||secret.length<32)throw Error('Authentication is unavailable. Please contact the administrator.');return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',enc.encode(secret)),{name:'AES-GCM'},false,usage);}
export async function seal(value:string,secret:string){const iv=crypto.getRandomValues(new Uint8Array(12));const body=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(secret,['encrypt']),enc.encode(value));return hex(iv)+'.'+hex(body);}
export async function unseal(value:string,secret:string){const [iv,body]=value.split('.');return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv)},await key(secret,['decrypt']),bytes(body)));}
