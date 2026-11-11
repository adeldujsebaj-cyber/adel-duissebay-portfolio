import {HttpError,knownRecord,administrator} from './data.js';
export const VIDEO_MAX_BYTES=1024*1024*1024;
export const VIDEO_PART_BYTES=8*1024*1024;

export function videoMime(name){const extension=name.split('.').pop().toLowerCase();return extension==='mov'?'video/quicktime':extension==='mp4'?'video/mp4':null;}
export function validateVideo(name,bytes,totalSize=bytes.length){
 const mime=videoMime(name);if(!mime)throw new HttpError(415,'Choose a MOV or MP4 video.');
 if(bytes.length<12)throw new HttpError(400,'The video file is incomplete.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);const atomSize=view.getUint32(0);const ascii=new TextDecoder('latin1');const atom=ascii.decode(bytes.slice(4,8));
 const validSize=atomSize===0||(atomSize===1&&bytes.length>=16)||(atomSize>=8&&atomSize<=totalSize);
 const brand=ascii.decode(bytes.slice(8,12));
 const modern=atom==='ftyp'&&['qt  ','isom','iso2','iso3','iso4','iso5','iso6','mp41','mp42','avc1','M4V ','MSNV','dash'].includes(brand);
 const legacy=mime==='video/quicktime'&&['moov','mdat','wide','free','skip'].includes(atom);
 if(!validSize||(!modern&&!legacy))throw new HttpError(400,'The file does not have a supported MOV or MP4 container.');return mime;
}

export async function handleVideoUpload(request,env,url,userId,helpers){
 const {json,readJSON,boundedBody}=helpers;
 if(!env.BUCKET)throw new HttpError(503,'File storage is not ready.');
 if(url.pathname==='/api/video-uploads'){
  if(request.method!=='POST')throw new HttpError(405,'Use POST to start a video upload.');
  const data=await readJSON(request);
  if(!data||typeof data!=='object')throw new HttpError(400,'Enter valid video details.');
  if(!knownRecord(data.recordId))throw new HttpError(400,'Choose a portfolio record for the video.');
  if(typeof data.name!=='string'||!data.name.trim()||data.name.length>180||/[\\/\u0000-\u001f\u007f]/.test(data.name))throw new HttpError(400,'Choose a video with a valid file name.');
  const name=data.name.trim();const mime=videoMime(name);if(!mime)throw new HttpError(415,'Supported video formats: MOV and MP4.');
  if(!Number.isSafeInteger(data.size)||data.size<12||data.size>VIDEO_MAX_BYTES)throw new HttpError(413,'Videos must be no larger than 1 GB.');
  await administrator(request,env,true);
  const id=crypto.randomUUID();const key='documents/'+id;const upload=await env.BUCKET.createMultipartUpload(key,{httpMetadata:{contentType:mime}});
  try{await env.DB.prepare('INSERT INTO portfolio_video_upload (id,owner_id,record_id,name,mime,size,storage_key,upload_id,parts_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,userId,data.recordId,name,mime,data.size,key,upload.uploadId,'{}',new Date().toISOString()).run();}
  catch(error){await upload.abort();throw error;}
  // R2 aborts unfinished uploads after seven days; discard their expired session metadata.
  await env.DB.prepare('DELETE FROM portfolio_video_upload WHERE owner_id=? AND created_at<?').bind(userId,new Date(Date.now()-7*86400000).toISOString()).run();
  return json({id,partSize:VIDEO_PART_BYTES,size:data.size},201);
 }
 const match=url.pathname.match(/^\/api\/video-uploads\/([a-f0-9-]{36})(?:\/(parts\/(\d+)|complete))?$/);
 if(!match)throw new HttpError(404,'Video upload not found.');
 const id=match[1];const action=match[2];
 if(action==='complete'&&request.method!=='POST')throw new HttpError(405,'Use POST to finish the video upload.');
 const saved=await env.DB.prepare('SELECT id,record_id,name,mime,size,created_at FROM portfolio_document WHERE id=?').bind(id).first();
 if(saved&&(action==='complete'||(!action&&request.method==='DELETE')))return json({document:saved});
 const row=await env.DB.prepare('SELECT * FROM portfolio_video_upload WHERE id=?').bind(id).first();
 if(!row)throw new HttpError(404,'This video upload is no longer active. Please start again.');
 if(row.owner_id!==userId)throw new HttpError(403,'Only the administrator who started this upload can change it.');
 const upload=env.BUCKET.resumeMultipartUpload(row.storage_key,row.upload_id);
 if(action?.startsWith('parts/')){
  if(request.method!=='PUT')throw new HttpError(405,'Use PUT to send a video part.');
  if(row.state!=='uploading')throw new HttpError(409,'This upload is already finishing or has been cancelled.');
  const number=Number(match[3]);const count=Math.ceil(row.size/VIDEO_PART_BYTES);
  if(!Number.isSafeInteger(number)||number<1||number>count)throw new HttpError(400,'Invalid video part.');
  const expected=Math.min(VIDEO_PART_BYTES,row.size-(number-1)*VIDEO_PART_BYTES);
  const bytes=await boundedBody(request,VIDEO_PART_BYTES);
  if(bytes.length!==expected)throw new HttpError(400,'This video part is incomplete. Please retry the upload.');
  if(number===1)validateVideo(row.name,bytes,row.size);
  const part=await upload.uploadPart(number,bytes);
  await env.DB.prepare('UPDATE portfolio_video_upload SET parts_json=json_set(parts_json,?,?) WHERE id=? AND owner_id=?').bind('$.'+number,part.etag,id,userId).run();
  return json({partNumber:number});
 }
 if(action==='complete'){
  if(request.method!=='POST')throw new HttpError(405,'Use POST to finish the video upload.');
  const completed=JSON.parse(row.parts_json);const count=Math.ceil(row.size/VIDEO_PART_BYTES);const parts=[];
  for(let number=1;number<=count;number++){if(typeof completed[number]!=='string')throw new HttpError(409,'Some video parts have not arrived yet.');parts.push({partNumber:number,etag:completed[number]});}
  const state=await env.DB.prepare("UPDATE portfolio_video_upload SET state='completing' WHERE id=? AND owner_id=? AND state IN ('uploading','completing')").bind(id,userId).run();
  if(!state.changes&&!state.meta?.changes)throw new HttpError(409,'The video upload has been cancelled.');
  const existing=await env.BUCKET.head(row.storage_key);
  if(!existing){try{await upload.complete(parts);}catch(error){const recovered=await env.BUCKET.head(row.storage_key);if(!recovered||recovered.size!==row.size)throw error;}}
  else if(existing.size!==row.size)throw new HttpError(409,'The stored video has an unexpected size. Please upload it again.');
  const createdAt=new Date().toISOString();
  await env.DB.prepare('INSERT INTO portfolio_document (id,record_id,name,storage_key,mime,size,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(id,row.record_id,row.name,row.storage_key,row.mime,row.size,createdAt).run();
  await env.DB.prepare('DELETE FROM portfolio_video_upload WHERE id=? AND owner_id=?').bind(id,userId).run();
  return json({document:{id,record_id:row.record_id,name:row.name,mime:row.mime,size:row.size,created_at:createdAt}},201);
 }
 if(!action&&request.method==='DELETE'){
  const cancelled=await env.DB.prepare("UPDATE portfolio_video_upload SET state='cancelled' WHERE id=? AND owner_id=? AND state='uploading'").bind(id,userId).run();
  if(!cancelled.changes&&!cancelled.meta?.changes)return json({processing:true},202);
  try{await upload.abort();}catch(error){console.error('Video multipart cancellation:',error.message);}
  await env.BUCKET.delete(row.storage_key);
  await env.DB.prepare('DELETE FROM portfolio_video_upload WHERE id=? AND owner_id=?').bind(id,userId).run();
  return json({cancelled:true});
 }
 throw new HttpError(405,'Unsupported video upload operation.');
}
