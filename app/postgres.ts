import {neon} from '@neondatabase/serverless';
export async function query(text:string,params:unknown[]=[]){
 const url=process.env.DATABASE_URL;if(!url)throw Error('Database is not connected. Complete the deployment setup.');
 return neon(url).query(text,params,{fullResults:true});
}
// Preserve the existing parameterised state repository API while using PostgreSQL.
// Only application-owned SQL is translated; user input is always bound.
function translate(source:string){
 let sql=source,index=0;
 const insert=sql.startsWith('INSERT OR IGNORE INTO workforce360 ');
 if(insert)sql=sql.replace('INSERT OR IGNORE','INSERT')+' ON CONFLICT (id) DO NOTHING';
 sql=sql.replace(/\bwindow\b/g,'"window"').replace(/\?/g,()=>'$'+(++index));
 if(sql.includes('ON CONFLICT(key)'))sql=sql.replace('WHEN "window"=excluded."window" THEN count+1','WHEN workforce360_attempts."window"=excluded."window" THEN workforce360_attempts.count+1');
 return sql;
}
export const database={prepare(source:string){let params:unknown[]=[];return {bind(...values:unknown[]){params=values;return this;},async first(){const r=await query(translate(source),params);return r.rows[0]||null;},async run(){const r=await query(translate(source),params);return {meta:{changes:r.rowCount||0}};}};}};
export const storage={
 async put(key:string,data:ArrayBuffer,options:{httpMetadata:{contentType:string}}){await query('INSERT INTO workforce360_assets (key,body,content_type) VALUES ($1,$2,$3) ON CONFLICT(key) DO UPDATE SET body=excluded.body,content_type=excluded.content_type',[key,Buffer.from(data).toString('base64'),options.httpMetadata.contentType]);},
 async get(key:string){const r=await query('SELECT body,content_type FROM workforce360_assets WHERE key=$1',[key]);const row=r.rows[0];return row?{body:new Uint8Array(Buffer.from(row.body,'base64')),httpMetadata:{contentType:row.content_type}}:null;},
 async delete(key:string){await query('DELETE FROM workforce360_assets WHERE key=$1',[key]);}
};
