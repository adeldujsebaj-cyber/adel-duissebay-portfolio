import {pdfAsset} from '../server/pdf-assets.js';
// Local-only adapter for the current Cloudflare Worker project.
// It listens on loopback and provides development identity, SQLite and file storage.
import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {createReadStream} from 'node:fs';
import {mkdir,readFile,writeFile,copyFile,stat,rm,readdir,appendFile} from 'node:fs/promises';
import {resolve,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createHash,randomUUID} from 'node:crypto';
import worker from '../worker/index.js';
import {defaults} from '../worker/data.js';

const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
function safePath(base,key){const path=resolve(base,key);if(path!==base&&!path.startsWith(base+sep))throw new Error('Invalid local storage path.');return path;}
async function exists(path){try{await stat(path);return true;}catch(error){if(error.code==='ENOENT')return false;throw error;}}
const readJSON=async path=>JSON.parse(await readFile(path,'utf8'));
async function writeJSON(path,value){await mkdir(dirname(path),{recursive:true});await writeFile(path,JSON.stringify(value));}

export async function createLocalEnvironment({root=projectRoot,stateDir=resolve(root,'.local-state')}={}){
 await mkdir(stateDir,{recursive:true});
 const db=new DatabaseSync(resolve(stateDir,'portfolio.sqlite'));
 db.exec('PRAGMA journal_mode=WAL');
 db.exec('CREATE TABLE IF NOT EXISTS __local_schema (name TEXT PRIMARY KEY NOT NULL)');
 const migrations=(await readdir(resolve(root,'drizzle'))).filter(name=>name.endsWith('.sql')).sort();
 for(const name of migrations){
  if(db.prepare('SELECT name FROM __local_schema WHERE name=?').get(name))continue;
  db.exec('BEGIN');
  try{db.exec(await readFile(resolve(root,'drizzle',name),'utf8'));db.prepare('INSERT INTO __local_schema (name) VALUES (?)').run(name);db.exec('COMMIT');}
  catch(error){db.exec('ROLLBACK');db.close();throw error;}
 }
 const objects=resolve(stateDir,'objects');const metadata=resolve(stateDir,'metadata');const multiparts=resolve(stateDir,'multipart');
 await Promise.all([objects,metadata,multiparts].map(path=>mkdir(path,{recursive:true})));
 const objectPath=key=>safePath(objects,key);
 const metaPath=key=>safePath(metadata,key+'.json');
 const multipartPath=id=>{if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Invalid upload ID.');return safePath(multiparts,id);};
 const bucket={
  async put(key,bytes,options={}){const target=objectPath(key);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes);await writeJSON(metaPath(key),options.httpMetadata||{});},
  async head(key){try{const info=await stat(objectPath(key));return {key,size:info.size};}catch(error){if(error.code==='ENOENT')return null;throw error;}},
  async get(key,options={}){
   const info=await bucket.head(key);if(!info)return null;
   const httpMetadata=await exists(metaPath(key))?await readJSON(metaPath(key)):{};
   const range=options.range;const streamOptions=range?{start:range.offset,end:range.offset+range.length-1}:{};
   return {...info,httpMetadata,body:Readable.toWeb(createReadStream(objectPath(key),streamOptions))};
  },
  async delete(key){await Promise.all([rm(objectPath(key),{force:true}),rm(metaPath(key),{force:true})]);},
  async createMultipartUpload(key,options={}){const id=randomUUID();const folder=multipartPath(id);await mkdir(folder,{recursive:true});await writeJSON(resolve(folder,'upload.json'),{key,httpMetadata:options.httpMetadata||{},parts:{}});return multipart(key,id);},
  resumeMultipartUpload(key,id){return multipart(key,id);},
 };
 function multipart(key,id){
  const folder=multipartPath(id);const manifest=resolve(folder,'upload.json');
  async function uploadInfo(){const info=await readJSON(manifest);if(info.key!==key)throw new Error('Upload storage key mismatch.');return info;}
  return {uploadId:id,
   async uploadPart(number,bytes){if(!Number.isSafeInteger(number)||number<1)throw new Error('Invalid upload part.');const info=await uploadInfo();const etag=createHash('md5').update(bytes).digest('hex');await writeFile(resolve(folder,number+'.part'),bytes);info.parts[number]=etag;await writeJSON(manifest,info);return {partNumber:number,etag};},
   async complete(parts){const info=await uploadInfo();const target=objectPath(key);await mkdir(dirname(target),{recursive:true});await writeFile(target,new Uint8Array());for(const part of parts){if(info.parts[part.partNumber]!==part.etag)throw new Error('Upload checksum mismatch.');await appendFile(target,await readFile(resolve(folder,part.partNumber+'.part')));}await writeJSON(metaPath(key),info.httpMetadata);await rm(folder,{recursive:true,force:true});return bucket.head(key);},
   async abort(){await rm(folder,{recursive:true,force:true});},
  };
 }
 const restored=resolve(stateDir,'snapshot-restored.json');
 if(!await exists(restored)){
  const snapshotPath=resolve(root,'backup/snapshot.json');
  const snapshot=await exists(snapshotPath)?await readJSON(snapshotPath):{profile:defaults,records:[],documents:[],portraits:[]};
  const restoreFile=async(file,key,mime)=>{const target=objectPath(key);await mkdir(dirname(target),{recursive:true});await copyFile(safePath(root,file.backup_path),target);await writeJSON(metaPath(key),{contentType:mime});};
  for(const doc of snapshot.documents||[])await restoreFile(doc,doc.storage_key,doc.mime);
  for(const photo of snapshot.portraits||[])await restoreFile(photo,photo.key,photo.mime);
  db.exec('BEGIN');
  try{
   db.prepare('INSERT OR IGNORE INTO site_profile (id,data,owner_id,updated_at) VALUES (?,?,?,?)').run('primary',JSON.stringify(snapshot.profile||defaults),'local-admin',new Date().toISOString());
   for(const record of snapshot.records||[])db.prepare('INSERT OR IGNORE INTO portfolio_record (id,data,updated_at) VALUES (?,?,?)').run(record.id,JSON.stringify(record.data),record.updated_at||new Date().toISOString());
   for(const doc of snapshot.documents||[])db.prepare('INSERT OR IGNORE INTO portfolio_document (id,record_id,name,storage_key,mime,size,created_at) VALUES (?,?,?,?,?,?,?)').run(doc.id,doc.record_id,doc.name,doc.storage_key,doc.mime,doc.size,doc.created_at);
   db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
  await writeJSON(restored,{restored_at:new Date().toISOString()});
 }
 const env={DB:{prepare(sql){const statement=db.prepare(sql);let values=[];return {bind(...args){values=args;return this;},async first(){return statement.get(...values)||null;},async all(){return {results:statement.all(...values)};},async run(){return statement.run(...values);}};}},BUCKET:bucket,close(){db.close();}};
 return env;
}

export async function handleLocalRequest(request,env){
 const url=new URL(request.url);
 if(!['localhost','127.0.0.1'].includes(url.hostname))return new Response('Local development only.',{status:421});
 if(url.pathname.startsWith('/pdfjs/'))return pdfAsset(url.pathname);
 const headers=new Headers(request.headers);headers.set('oai-authenticated-user-id','local-admin');headers.delete('oai-authenticated-user-email');
 const result=await worker.fetch(new Request(request,{headers}),env);
 result.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; worker-src 'self' blob:; font-src 'self' data: blob:; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'self'; media-src 'self'; base-uri 'none'; form-action 'self'");
 if(url.pathname==='/admin'&&result.headers.get('Content-Type')?.includes('text/html'))return new Response((await result.text()).replace('Signed in with ChatGPT','Local administrator · development'),{status:result.status,headers:result.headers});
 return result;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||3000);if(!Number.isSafeInteger(port)||port<1024||port>65535)throw new Error('PORT must be between 1024 and 65535.');
 const env=await createLocalEnvironment();
 const allowedHosts=new Set(['127.0.0.1:'+port,'localhost:'+port]);
 const server=createServer(async(incoming,outgoing)=>{
  try{
   if(!allowedHosts.has(incoming.headers.host)){outgoing.writeHead(421);outgoing.end('Local development only.');return;}
   const headers=new Headers();for(const [name,value]of Object.entries(incoming.headers))if(value!==undefined)headers.set(name,Array.isArray(value)?value.join(', '):value);
   const method=incoming.method||'GET';const options={method,headers};
   if(!['GET','HEAD'].includes(method)){options.body=Readable.toWeb(incoming);options.duplex='half';}
   const request=new Request('http://'+incoming.headers.host+(incoming.url||'/'),options);
   const response=await handleLocalRequest(request,env);outgoing.statusCode=response.status;response.headers.forEach((value,name)=>outgoing.setHeader(name,value));
   if(method==='HEAD'||!response.body){outgoing.end();return;}await pipeline(Readable.fromWeb(response.body),outgoing);
  }catch(error){console.error('Local request failed:',error.message);if(!outgoing.headersSent)outgoing.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});outgoing.end('Local request failed. See the terminal.');}
 });
 server.on('error',error=>{console.error('Local server:',error.message);env.close();process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>console.log('Portfolio: http://127.0.0.1:'+port+'\nLocal administrator: http://127.0.0.1:'+port+'/admin\nPress Ctrl+C to stop.'));
 process.on('SIGINT',()=>{server.close(()=>{env.close();process.exit(0);});server.closeAllConnections();});
}
