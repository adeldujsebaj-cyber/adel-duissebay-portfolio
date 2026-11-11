import {pdfViewerCSS} from './pdf-viewer.js';
import { defaults,knownRecord,loadProfile,loadPortfolio,loadDocuments,administrator,HttpError,validate,validateRecord,escapeHtml,initials } from './data.js';
import * as render from './render.js';
import CSS from './styles.js';
import ABOUT_CSS from './about-styles.js';
import COMPANIES_CSS from './company-styles.js';
import ACTION_CSS from './action-styles.js';
import COMPANY_MEDIA from './company-media.js';
import {publicJS,adminJS} from './client.js';
import {handleVideoUpload,videoMime,validateVideo} from './video-uploads.js';
import VIDEO_CSS from './video-styles.js';
import {selectDeclarationPdf} from './declaration.js';
import DECLARATION_PREVIEW from './declaration-current-preview.js';
import DECLARATION_CSS from './declaration-styles.js';
import {bundledFile,serveBundledFile} from './bundled-files.js';
import CAPSTONE_ASSETS from './capstone-assets.js';
import CAPSTONE_CSS from './capstone-styles.js';
import EVIDENCE_CSS from './evidence-styles.js';
import ARTIFACT_CSS from './artifact-styles.js';
import {loadEvidenceSources,saveEvidenceSource} from './evidence.js';
export {defaults,validate,escapeHtml};

export function response(body,type='text/html; charset=utf-8',status=200,extra={}){
 return new Response(body,{status,headers:{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'self'; base-uri 'none'; form-action 'self'",...extra}});
}
const json=(data,status=200)=>response(JSON.stringify(data),'application/json; charset=utf-8',status);
async function boundedBody(request,limit){
 if(Number(request.headers.get('Content-Length'))>limit)throw new HttpError(413,'The file or request exceeds the allowed size.');
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new HttpError(413,'The uploaded file is too large.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}
async function readJSON(request){if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new HttpError(415,'Expected JSON data.');const bytes=await boundedBody(request,60000);try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new HttpError(400,'Invalid JSON data.');}}
const fileTypes={pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',mov:'video/quicktime',mp4:'video/mp4'};
function fileName(request){let name;try{name=decodeURIComponent(request.headers.get('X-File-Name')||'');}catch{throw new HttpError(400,'Invalid file name.');}name=name.replace(/[\\/]/g,'_').trim();if(!name||name.length>180||/[\u0000-\u001f\u007f]/.test(name))throw new HttpError(400,'Choose a file with a valid name (up to 180 characters).');return name;}
function validateFile(name,bytes,portrait=false){
 const ext=name.split('.').pop().toLowerCase();const mime=fileTypes[ext];if(!mime||(portrait&&!mime.startsWith('image/')))throw new HttpError(415,portrait?'Choose a JPG, PNG or WebP photograph.':'Supported files: PDF, DOCX, PPTX, XLSX, JPG, PNG, WebP, MOV and MP4.');
 if(videoMime(name))return validateVideo(name,bytes);
 const start=new TextDecoder('latin1').decode(bytes.slice(0,12));
 const valid=ext==='pdf'?start.startsWith('%PDF-'):['docx','pptx','xlsx'].includes(ext)?bytes[0]===80&&bytes[1]===75&&bytes[2]===3&&bytes[3]===4:['jpg','jpeg'].includes(ext)?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:ext==='png'?bytes[0]===137&&start.slice(1,4)==='PNG':start.startsWith('RIFF')&&start.slice(8,12)==='WEBP';
 if(!valid)throw new HttpError(400,'The file contents do not match its file extension.');return mime;
}
async function handleAPI(request,env,url){
 const path=url.pathname;const write=!['GET','HEAD'].includes(request.method);
 const userId=await administrator(request,env,false);
 if(write&&request.headers.get('Origin')!==url.origin)throw new HttpError(403,'Submit changes from this website’s administrator dashboard.');
 if(path==='/api/video-uploads'||path.startsWith('/api/video-uploads/'))return handleVideoUpload(request,env,url,userId,{json,readJSON,boundedBody});
 if(path.startsWith('/api/evidence/sources/')){
  if(request.method!=='PUT')throw new HttpError(405,'Use PUT to update a resource.');
  const value=await readJSON(request);await administrator(request,env,true);
  return json({source:await saveEvidenceSource(env,path.slice('/api/evidence/sources/'.length),value)});
 }
 if(path==='/api/profile'){
  if(request.method==='GET')return json({profile:await loadProfile(env)});
  if(request.method!=='PUT')throw new HttpError(405,'Use PUT to update the profile.');
  const profile=validate(await readJSON(request));await administrator(request,env,true);
  await env.DB.prepare("UPDATE site_profile SET data=?, updated_at=? WHERE id='primary' AND owner_id=?").bind(JSON.stringify(profile),new Date().toISOString(),userId).run();return json({profile});
 }
 if(path.startsWith('/api/records/')){
  if(request.method!=='PUT')throw new HttpError(405,'Use PUT to update a record.');
  const id=path.slice('/api/records/'.length);const record=validateRecord(id,await readJSON(request));await administrator(request,env,true);
  await env.DB.prepare('INSERT INTO portfolio_record (id,data,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at').bind(id,JSON.stringify(record),new Date().toISOString()).run();return json({record});
 }
 if(path==='/api/portrait'){
  if(request.method!=='PUT')throw new HttpError(405,'Use PUT to upload a photograph.');if(!env.BUCKET)throw new HttpError(503,'File storage is not ready.');
  const name=fileName(request);const bytes=await boundedBody(request,8*1024*1024);const mime=validateFile(name,bytes,true);await administrator(request,env,true);
  const target=url.searchParams.get('target')||'home';if(!['home','about'].includes(target))throw new HttpError(400,'Choose Home or About Me for this photograph.');
  await env.BUCKET.put(target==='about'?'site/about-portrait':'site/portrait',bytes,{httpMetadata:{contentType:mime}});return json({saved:true,target});
 }
 if(path==='/api/documents'){
  if(request.method==='GET'){const documents=await loadDocuments(env);return json({documents,html:render.adminDocuments(documents)});}
  if(request.method!=='POST')throw new HttpError(405,'Use POST to upload documents.');if(!env.BUCKET)throw new HttpError(503,'File storage is not ready.');
  const recordId=url.searchParams.get('record');if(!knownRecord(recordId))throw new HttpError(400,'Choose a valid portfolio record.');
  const name=fileName(request);const bytes=await boundedBody(request,20*1024*1024);const mime=validateFile(name,bytes);await administrator(request,env,true);
  const id=crypto.randomUUID();const key='documents/'+id;const createdAt=new Date().toISOString();
  await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:mime}});
  try{await env.DB.prepare('INSERT INTO portfolio_document (id,record_id,name,storage_key,mime,size,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,recordId,name,key,mime,bytes.length,createdAt).run();}catch(error){await env.BUCKET.delete(key);throw error;}
  return json({document:{id,record_id:recordId,name,mime,size:bytes.length,created_at:createdAt}},201);
 }
 if(path.startsWith('/api/documents/')){
  if(request.method!=='DELETE')throw new HttpError(405,'Use DELETE to remove a document.');const id=path.slice('/api/documents/'.length);
  const doc=await env.DB.prepare('SELECT * FROM portfolio_document WHERE id=?').bind(id).first();if(!doc)throw new HttpError(404,'Document not found.');
  await administrator(request,env,true);await env.DB.prepare('DELETE FROM portfolio_document WHERE id=?').bind(id).run();await env.BUCKET.delete(doc.storage_key);return json({deleted:true});
 }
 throw new HttpError(404,'API route not found.');
}

async function serveFile(request,env,url){
 const id=url.pathname.slice('/files/'.length);const supplied=bundledFile(id);if(supplied)return serveBundledFile(request,url,supplied,response);
 const doc=await env.DB.prepare('SELECT * FROM portfolio_document WHERE id=?').bind(id).first();if(!doc)throw new HttpError(404,'Document not found.');
 const inline=doc.mime.startsWith('image/')||doc.mime.startsWith('video/')||doc.mime==='application/pdf';
 const disposition=url.searchParams.get('download')==='1'||!inline?'attachment':'inline';
 const headers={'Content-Disposition':`${disposition}; filename*=UTF-8''${encodeURIComponent(doc.name).replaceAll("'",'%27')}`,'Content-Length':String(doc.size),'Content-Security-Policy':'sandbox','Accept-Ranges':'bytes'};
 if(request.method==='HEAD'){const info=await env.BUCKET.head(doc.storage_key);if(!info)throw new HttpError(404,'The original file is unavailable.');return response(null,doc.mime,200,headers);}
 const rangeHeader=request.headers.get('Range');let range=null;
 if(rangeHeader){
  const match=rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
  const invalid=()=>response(null,doc.mime,416,{'Content-Range':'bytes */'+doc.size,'Accept-Ranges':'bytes'});
  if(!match||(!match[1]&&!match[2]))return invalid();
  let start,end;
  if(!match[1]){const length=Number(match[2]);if(!Number.isSafeInteger(length)||length<=0)return invalid();start=Math.max(0,doc.size-length);end=doc.size-1;}
  else{start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),doc.size-1):doc.size-1;}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=doc.size||end<start)return invalid();
  range={offset:start,length:end-start+1};headers['Content-Length']=String(range.length);headers['Content-Range']=`bytes ${start}-${end}/${doc.size}`;
 }
 const object=await env.BUCKET.get(doc.storage_key,range?{range}:undefined);if(!object)throw new HttpError(404,'The original file is unavailable.');
 return response(object.body,doc.mime,range?206:200,headers);
}
export default{async fetch(request,env){
 const url=new URL(request.url);let path=url.pathname;
 try{
  if(path==='/style.css')return response(CSS+ABOUT_CSS+COMPANIES_CSS+ACTION_CSS+VIDEO_CSS+DECLARATION_CSS+CAPSTONE_CSS+EVIDENCE_CSS+ARTIFACT_CSS+pdfViewerCSS,'text/css; charset=utf-8');
  if(path==='/app.js')return response(publicJS,'text/javascript; charset=utf-8');
  if(path==='/admin.js')return response(adminJS,'text/javascript; charset=utf-8');
  if(path.startsWith('/company-media/')){
   if(!['GET','HEAD'].includes(request.method))throw new HttpError(405,'Method not allowed.');
   const id=path.slice('/company-media/'.length);const asset=Object.hasOwn(COMPANY_MEDIA,id)?COMPANY_MEDIA[id]:null;if(!asset)throw new HttpError(404,'Image not found.');
   const bytes=request.method==='HEAD'?null:Uint8Array.from(atob(asset.base64),char=>char.charCodeAt(0));
   return response(bytes,asset.type,200,{'Cache-Control':'private, max-age=86400','Content-Security-Policy':'sandbox'});
  }
  if(path.startsWith('/api/'))return await handleAPI(request,env,url);
  if(!['GET','HEAD'].includes(request.method))throw new HttpError(405,'Method not allowed.');
  if(path===DECLARATION_PREVIEW.path){const bytes=request.method==='HEAD'?null:Uint8Array.from(atob(DECLARATION_PREVIEW.base64),char=>char.charCodeAt(0));return response(bytes,'image/jpeg',200,{'Cache-Control':'private, max-age=86400','Content-Security-Policy':'sandbox'});}
  if(path==='/ai-declaration/source.pdf'){
   const file=selectDeclarationPdf(await loadDocuments(env));if(!file)throw new HttpError(404,'No declaration PDF has been uploaded yet.');
   return await serveFile(request,env,new URL('/files/'+encodeURIComponent(file.id)+url.search,url.origin));
  }
  if(path==='/capstone/presentation.pdf')return serveBundledFile(request,url,bundledFile('provided-capstone-presentation'),response);
  if(path.startsWith('/capstone/slides/')){
   const match=path.match(/^\/capstone\/slides\/(\d+)\.jpg$/);const number=match?Number(match[1]):0;
   if(number<1||number>CAPSTONE_ASSETS.slides.length)throw new HttpError(404,'Slide not found.');
   const bytes=request.method==='HEAD'?null:Uint8Array.from(atob(CAPSTONE_ASSETS.slides[number-1]),char=>char.charCodeAt(0));
   return response(bytes,'image/jpeg',200,{'Cache-Control':'private, max-age=86400','Content-Security-Policy':'sandbox'});
  }
  if(path==='/portrait'||path==='/about-portrait'){const image=await env.BUCKET?.get(path==='/about-portrait'?'site/about-portrait':'site/portrait');if(!image)throw new HttpError(404,'Photograph not uploaded.');return response(request.method==='HEAD'?null:image.body,image.httpMetadata.contentType,200,{'Content-Security-Policy':'sandbox'});}
  if(path.startsWith('/files/'))return await serveFile(request,env,url);
  if(path==='/robots.txt')return response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${render.ORIGIN}/sitemap.xml\n`,'text/plain; charset=utf-8');
  if(path==='/sitemap.xml')return response(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...render.nav.map(([u])=>u),'/research','/contact'].map(u=>`<url><loc>${render.ORIGIN}${u}</loc></url>`).join('')}</urlset>`,'application/xml; charset=utf-8');
  const aliases={'/about-me':'/about','/assignments':'/attestations','/attestation-syntheses':'/attestations','/weekly-reports':'/weekly-records','/evidence-folder':'/evidence','/capstone-project':'/capstone','/records/AI':'/ai-declaration','/records/CAPSTONE':'/capstone'};
  if(aliases[path])return response(null,'text/plain',302,{Location:aliases[path]});
  if(path!=='/'&&path.endsWith('/'))return response(null,'text/plain',302,{Location:path.slice(0,-1)+url.search});
  const data=await loadPortfolio(env);const p=data.profile;
  if(path==='/admin'||path==='/evidence')data.evidenceSources=await loadEvidenceSources(env);
  if(path==='/favicon.svg')return response(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#101c2c"/><rect x="7" y="7" width="50" height="50" fill="none" stroke="#c5a46d"/><text x="30" y="43" fill="#c5a46d" text-anchor="middle" font-family="Georgia,serif" font-size="31" letter-spacing="-3">${escapeHtml(initials(p.displayName))}</text></svg>`,'image/svg+xml');
  if(path==='/og.svg')return response(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#101c2c"/><rect x="35" y="35" width="1130" height="560" fill="none" stroke="#c5a46d"/><text x="85" y="130" fill="#c5a46d" font-family="Georgia,serif" font-size="18" letter-spacing="5">PERSONAL &amp; ACADEMIC PORTFOLIO</text><text x="85" y="295" fill="#e8e6e1" font-family="Georgia,serif" font-size="76">${escapeHtml(p.displayName)}</text><text x="85" y="385" fill="#c5a46d" font-family="Georgia,serif" font-size="29">${escapeHtml(p.program)}</text><text x="85" y="455" fill="#e8e6e1" font-family="Arial,sans-serif" font-size="22">${escapeHtml(p.university)} · Group ${escapeHtml(p.group)}</text></svg>`,'image/svg+xml');
  if(path==='/admin'){
   try{await administrator(request,env,false);return response(render.admin(data,request.headers.get('oai-authenticated-user-email')),undefined,200,{'X-Robots-Tag':'noindex'});}catch(error){if([401,403].includes(error.status))return response(render.access(data,error.status),undefined,error.status,{'X-Robots-Tag':'noindex'});throw error;}
  }
  if(path==='/')return response(render.home(data));
  if(path==='/about')return response(render.about(data));
  if(path==='/companies')return response(render.companies(data));
  if(path==='/research')return response(render.research(data));
  if(path==='/weekly-records')return response(render.collection(data,'weekly',path,'Weekly <em>Records.</em>','Nine weekly records connecting the learning process to the comparative banking study.'));
  if(path==='/artifacts')return response(render.artifacts(data,url));
  if(path==='/attestations')return response(render.collection(data,'assignment',path,'Attestation <em>Syntheses.</em>','The A1–A4 assignment records and their supporting academic materials.'));
  if(path==='/contact')return response(render.contact(data));
  if(path==='/evidence')return response(render.evidence(data,url));
  if(path==='/ai-declaration')return response(render.aiDeclaration(data));
  if(path==='/capstone')return response(render.capstone(data));
  const fixed={'/companies/bank-of-america':'COMPANY-A','/companies/freedom-bank-kazakhstan':'COMPANY-B'};
  const id=fixed[path]||(path.startsWith('/records/')?path.slice('/records/'.length):null);
  if(id){const record=data.records.find(r=>r.id===id);if(record)return response(render.detail(data,record,path));}
  if(path.startsWith('/documents/')){const doc=data.documents.find(d=>d.id===path.slice('/documents/'.length));if(doc)return response(render.documentPage(data,doc,url));}
  throw new HttpError(404,'This page could not be found.');
 }catch(error){
  const status=error.status||503;if(path.startsWith('/api/'))return json({error:error.status?error.message:'The service is temporarily unavailable. Please try again shortly.'},status);
  if(!error.status)console.error('Site request failed:',error.message);
  const data={profile:defaults,records:[],documents:[],portrait:false};
  return response(render.shell(data,`<section class="access-page container"><p class="eyebrow">${status===404?'404 / PAGE NOT FOUND':'PLEASE TRY AGAIN'}</p><h1>${status===404?'Let’s head back.':'A brief pause.'}</h1><p>${status===404?'This page is unavailable.':'The portfolio is temporarily unavailable. Please refresh in a moment.'}</p><a class="button button-gold" href="/">Return to homepage</a></section>`,{path,title:status===404?'Page not found':'Temporarily unavailable',admin:true}),undefined,status);
 }
}};
