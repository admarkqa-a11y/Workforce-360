import {digest} from './security';
export async function setupOwner(value:unknown,email:unknown){
 const expected=process.env.WORKFORCE360_SETUP_KEY;
 if(!expected||expected.length<32)throw Error('Owner setup is not configured. Contact the deployment owner.');
 if(typeof value!=='string'||value.length>256||await digest(value)!==await digest(expected))throw Error('The owner setup / recovery key is incorrect.');
 return {email:String(email||'').trim().toLowerCase()};
}
