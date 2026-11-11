import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { Script } from 'node:vm';
import {createHash} from 'node:crypto';
import {reviewedFiles,extractedSources} from '../worker/evidence-data.js';
import {evidenceModel} from '../worker/evidence.js';
import worker, { defaults } from '../worker/index.js';

function environment() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter(f => f.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(new URL('../drizzle/' + file, import.meta.url), 'utf8'));
  }
  const objects = new Map();
  const uploads=new Map();let etagCounter=0;
  const multipart=(key,id)=>({
    uploadId:id,
    async uploadPart(partNumber,bytes){const upload=uploads.get(id);if(!upload)throw new Error('No active upload');const etag='part-'+(++etagCounter);upload.parts.set(partNumber,{bytes:new Uint8Array(bytes),etag});return {partNumber,etag};},
    async complete(parts){const upload=uploads.get(id);if(!upload)throw new Error('No active upload');const chunks=parts.map(part=>{const value=upload.parts.get(part.partNumber);assert.equal(value.etag,part.etag);return value.bytes;});const bytes=new Uint8Array(chunks.reduce((sum,part)=>sum+part.length,0));let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}objects.set(key,{bytes,httpMetadata:upload.httpMetadata});uploads.delete(id);return {key,size:bytes.length};},
    async abort(){uploads.delete(id);},
  });
  return {
    DB: { prepare(sql) { const statement=sqlite.prepare(sql);let values=[];return {bind(...args){values=args;return this;},async first(){return statement.get(...values)||null;},async all(){return {results:statement.all(...values)};},async run(){return statement.run(...values);}};} },
    BUCKET: {
      async put(key,bytes,options){objects.set(key,{bytes:new Uint8Array(bytes),httpMetadata:options?.httpMetadata||{}});},
      async get(key,options){const item=objects.get(key);if(!item)return null;const range=options?.range;const bytes=range?item.bytes.slice(range.offset,range.offset+range.length):item.bytes;return {body:new Response(bytes).body,httpMetadata:item.httpMetadata,size:item.bytes.length};},
      async head(key){const item=objects.get(key);return item?{key,size:item.bytes.length}:null;},
      async delete(key){objects.delete(key);},
      async createMultipartUpload(key,options){const id=crypto.randomUUID();uploads.set(id,{key,httpMetadata:options.httpMetadata,parts:new Map()});return multipart(key,id);},
      resumeMultipartUpload(key,id){return multipart(key,id);},
      objects,
      uploads,
    },
  };
}
const origin = 'https://adel-duissebay.loyalsouffle.chatgpt.site';
const request = (path, options = {}) => new Request(origin + path, options);
const ownerHeaders = { 'oai-authenticated-user-id': 'test-owner', 'oai-authenticated-user-email': 'owner@example.org', Origin: origin, 'Content-Type': 'application/json' };

test('homepage contains the verified identity, both mail links and requested palette', async () => {
  const env = environment();
  const res = await worker.fetch(request('/'), env);
  assert.equal(res.status, 200);
  const html = await res.text();
  for (const value of Object.values(defaults)) assert.ok(html.includes(value.replaceAll('&', '&amp;')) || html.includes(value), value);
  assert.match(html, /<title>Adel Duissebay \| AI Business<\/title>/);
  assert.match(html, /<h1>Adel<br><span>Duissebay<\/span><\/h1>/);
  assert.ok(html.includes('mailto:adeldujsebaj@gmail.com'));
  assert.ok(html.includes('mailto:262603@astanait.edu.kz'));
  assert.ok(!html.includes('Adel Duysebay'));
  for (const path of ['/about', '/companies', '/weekly-records', '/artifacts', '/attestations', '/evidence', '/capstone']) assert.ok(html.includes('href="' + path + '"'));
  const css = await (await worker.fetch(request('/style.css'), env)).text();
  for (const color of ['#101c2c', '#1d3557', '#c5a46d', '#e8e6e1']) assert.ok(css.includes(color));
});

test('MOV video uploads in parts, appears on Assignment 2, streams byte ranges and retains the original',async()=>{
  const env=environment();const bytes=new Uint8Array(readFileSync(new URL('./fixtures/sample.mov',import.meta.url)));
  const start=await worker.fetch(request('/api/video-uploads',{method:'POST',headers:ownerHeaders,body:JSON.stringify({recordId:'A2',name:'Assignment 2.MOV',size:bytes.length})}),env);assert.equal(start.status,201);
  const session=await start.json();
  const premature=await worker.fetch(request('/api/video-uploads/'+session.id+'/complete',{method:'POST',headers:ownerHeaders}),env);assert.equal(premature.status,409);
  const send=await worker.fetch(request('/api/video-uploads/'+session.id+'/parts/1',{method:'PUT',headers:{...ownerHeaders,'Content-Type':'application/octet-stream'},body:bytes}),env);assert.equal(send.status,200);
  const finish=await worker.fetch(request('/api/video-uploads/'+session.id+'/complete',{method:'POST',headers:ownerHeaders}),env);assert.equal(finish.status,201);const doc=(await finish.json()).document;assert.equal(doc.mime,'video/quicktime');
  const repeat=await worker.fetch(request('/api/video-uploads/'+session.id+'/complete',{method:'POST',headers:ownerHeaders}),env);assert.equal(repeat.status,200);assert.equal((await repeat.json()).document.id,doc.id);
  const page=await(await worker.fetch(request('/records/A2'),env)).text();assert.ok(page.includes('<video'));assert.ok(page.includes('Assignment 2 video'));assert.ok(page.includes('/files/'+doc.id));
  const preview=await(await worker.fetch(request('/documents/'+doc.id),env)).text();assert.ok(preview.includes('data-portfolio-video'));assert.ok(preview.includes('Download original video'));
  const original=await worker.fetch(request('/files/'+doc.id+'?download=1'),env);assert.match(original.headers.get('Content-Disposition'),/^attachment/);assert.deepEqual(new Uint8Array(await original.arrayBuffer()),bytes);
  const partial=await worker.fetch(request('/files/'+doc.id,{headers:{Range:'bytes=4-15'}}),env);assert.equal(partial.status,206);assert.equal(partial.headers.get('Content-Range'),'bytes 4-15/'+bytes.length);assert.deepEqual(new Uint8Array(await partial.arrayBuffer()),bytes.slice(4,16));
  const suffix=await worker.fetch(request('/files/'+doc.id,{headers:{Range:'bytes=-10'}}),env);assert.equal(suffix.status,206);assert.deepEqual(new Uint8Array(await suffix.arrayBuffer()),bytes.slice(-10));
  const badRange=await worker.fetch(request('/files/'+doc.id,{headers:{Range:'bytes='+bytes.length+'-'}}),env);assert.equal(badRange.status,416);
  const head=await worker.fetch(request('/files/'+doc.id,{method:'HEAD'}),env);assert.equal(head.headers.get('Content-Length'),String(bytes.length));assert.equal((await head.arrayBuffer()).byteLength,0);
  assert.equal(env.BUCKET.uploads.size,0);
});

test('video sessions enforce owner access, validate the container, support cancellation and assemble multiple parts',async()=>{
  const env=environment();const start=async(name,size,headers=ownerHeaders)=>worker.fetch(request('/api/video-uploads',{method:'POST',headers,body:JSON.stringify({recordId:'A2',name,size})}),env);
  assert.equal((await start('video.mov',100,{})).status,401);
  assert.equal((await start('video.mov',1024*1024*1024+1)).status,413);
  assert.equal((await start('video.svg',100)).status,415);
  const {id}=await(await start('video.mov',12)).json();
  assert.equal((await worker.fetch(request('/api/video-uploads/'+id+'/parts/1',{method:'PUT',headers:ownerHeaders,body:'not a movie!'}),env)).status,400);
  assert.equal((await worker.fetch(request('/api/video-uploads/'+id,{method:'DELETE',headers:{...ownerHeaders,'oai-authenticated-user-id':'someone-else'}}),env)).status,403);
  assert.equal((await worker.fetch(request('/api/video-uploads/'+id,{method:'DELETE',headers:ownerHeaders}),env)).status,200);assert.equal(env.BUCKET.uploads.size,0);
  const size=8*1024*1024+123;const payload=new Uint8Array(size);payload.set(new Uint8Array(readFileSync(new URL('./fixtures/sample.mov',import.meta.url))));
  const session=await(await start('large.mov',size)).json();
  for(let number=1,offset=0;offset<size;number++,offset+=session.partSize){const sent=await worker.fetch(request('/api/video-uploads/'+session.id+'/parts/'+number,{method:'PUT',headers:ownerHeaders,body:payload.slice(offset,offset+session.partSize)}),env);assert.equal(sent.status,200);}
  const done=await worker.fetch(request('/api/video-uploads/'+session.id+'/complete',{method:'POST',headers:ownerHeaders}),env);assert.equal(done.status,201);
  const doc=(await done.json()).document;assert.equal(doc.size,size);const result=await worker.fetch(request('/files/'+doc.id,{headers:{Range:'bytes=8388600-8388620'}}),env);assert.deepEqual(new Uint8Array(await result.arrayBuffer()),payload.slice(8388600,8388621));
});

test('anonymous users cannot open the editor or change any record', async () => {
  const env = environment();
  assert.equal((await worker.fetch(request('/admin'), env)).status, 401);
  assert.equal((await worker.fetch(request('/api/profile', { method: 'PUT', body: JSON.stringify(defaults) }), env)).status, 401);
  assert.equal((await worker.fetch(request('/api/profile'), env)).status, 401);
});

test('save persists every personal field, updates SSR metadata, and locks the record to its administrator', async () => {
  const env = environment();
  const changed = { legalName: 'Verified Legal Name', displayName: 'Updated Student', university: 'Updated University', universityShort: 'UU', program: 'Updated Program', group: 'NEW GROUP', personalEmail: 'personal@example.com', universityEmail: 'academic@example.edu', tagline: 'A verified updated statement.' };
  const save = await worker.fetch(request('/api/profile', { method: 'PUT', headers: ownerHeaders, body: JSON.stringify(changed) }), env);
  assert.equal(save.status, 200);
  assert.deepEqual((await save.json()).profile, changed);
  const html = await (await worker.fetch(request('/'), env)).text();
  for (const value of Object.values(changed)) assert.ok(html.includes(value), value);
  assert.ok(html.includes('<title>Updated Student | Updated Program</title>'));
  assert.ok(!html.includes(defaults.displayName));
  assert.ok(!html.includes(defaults.personalEmail));
  assert.ok(!html.includes(defaults.universityEmail));
  assert.equal((await worker.fetch(request('/admin', { headers: { 'oai-authenticated-user-id': 'other-user' } }), env)).status, 403);
  assert.equal((await worker.fetch(request('/api/profile', { method: 'PUT', headers: { ...ownerHeaders, 'oai-authenticated-user-id': 'other-user' }, body: JSON.stringify(defaults) }), env)).status, 403);
  const edit = await worker.fetch(request('/admin', { headers: ownerHeaders }), env);
  assert.equal(edit.status, 200);
  assert.match(await edit.text(), /name="universityEmail"/);
});

test('cross-origin, invalid and oversized updates fail without modifying content', async () => {
  const env = environment();
  const put = (body, headers = ownerHeaders) => worker.fetch(request('/api/profile', { method: 'PUT', headers, body }), env);
  assert.equal((await put(JSON.stringify(defaults), { ...ownerHeaders, Origin: 'https://other.example' })).status, 403);
  assert.equal((await put(JSON.stringify({ ...defaults, personalEmail: 'invalid' }))).status, 400);
  assert.equal((await put(JSON.stringify({ ...defaults, displayName: '' }))).status, 400);
  assert.equal((await put('invalid-json')).status, 400);
  assert.equal((await put('x'.repeat(70000))).status, 413);
  assert.equal((await put(JSON.stringify(defaults))).status, 200);
});

test('every required section and W1–W9, A1–A4 records has a separate page', async()=>{
  const env=environment();
  const paths=['/about','/companies','/companies/bank-of-america','/companies/freedom-bank-kazakhstan','/weekly-records','/artifacts','/attestations','/evidence','/capstone','/ai-declaration','/research','/contact',...Array.from({length:9},(_,i)=>'/records/W'+(i+1)),...Array.from({length:4},(_,i)=>'/records/A'+(i+1))];
  for(const path of paths){const res=await worker.fetch(request(path),env);assert.equal(res.status,200,path);const html=await res.text();assert.ok(html.includes('Adel Duissebay'),path);assert.ok(!html.includes('Adel Duysebay'),path);assert.ok(!html.includes('Nuray Dumankyzy'),path);assert.ok(!html.includes('Delta Air Lines'),path);}
  assert.equal((await worker.fetch(request('/missing'),env)).status,404);
});

test('research text and source links persist independently of identity',async()=>{
  const env=environment();const body={title:'Verified weekly work',summary:'Student-provided summary',content:'First paragraph.\n\nSecond paragraph.',sources:['https://example.org/evidence']};
  const save=await worker.fetch(request('/api/records/W1',{method:'PUT',headers:ownerHeaders,body:JSON.stringify(body)}),env);assert.equal(save.status,200);
  const html=await(await worker.fetch(request('/records/W1'),env)).text();assert.ok(html.includes(body.title));assert.ok(html.includes(body.sources[0]));assert.ok(html.includes('<p>First paragraph.</p><p>Second paragraph.</p>'));
  assert.equal((await worker.fetch(request('/api/records/W1',{method:'PUT',headers:ownerHeaders,body:JSON.stringify({...body,sources:['javascript:alert(1)']})}),env)).status,400);
  assert.equal((await worker.fetch(request('/api/records/UNKNOWN',{method:'PUT',headers:ownerHeaders,body:JSON.stringify(body)}),env)).status,404);
});

test('PDF upload, evidence search, inline preview, download and deletion retain original bytes',async()=>{
  const env=environment();const bytes='%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF';
  const upload=await worker.fetch(request('/api/documents?record=CAPSTONE',{method:'POST',headers:{...ownerHeaders,'Content-Type':'application/pdf','X-File-Name':encodeURIComponent('Capstone presentation.pdf')},body:bytes}),env);
  assert.equal(upload.status,201);const doc=(await upload.json()).document;assert.equal(doc.record_id,'CAPSTONE');
  const page=await(await worker.fetch(request('/documents/'+doc.id),env)).text();assert.ok(page.includes('type="application/pdf"'));assert.ok(page.includes('/files/'+doc.id+'?download=1'));
  const file=await worker.fetch(request('/files/'+doc.id),env);assert.equal(file.headers.get('Content-Type'),'application/pdf');assert.match(file.headers.get('Content-Disposition'),/^inline/);assert.equal(await file.text(),bytes);
  const download=await worker.fetch(request('/files/'+doc.id+'?download=1'),env);assert.match(download.headers.get('Content-Disposition'),/^attachment/);
  const evidence=await(await worker.fetch(request('/evidence?view=documents&category=capstone&q=present'),env)).text();assert.ok(evidence.includes(doc.name));
  const wrong=await(await worker.fetch(request('/evidence?view=documents&category=weekly'),env)).text();assert.ok(!wrong.includes(doc.name));
  const capstone=await(await worker.fetch(request('/capstone'),env)).text();assert.ok(capstone.includes(doc.name));
  const otherHeaders={...ownerHeaders,'oai-authenticated-user-id':'other-user'};
  assert.equal((await worker.fetch(request('/api/documents/'+doc.id,{method:'DELETE',headers:otherHeaders}),env)).status,403);
  assert.equal((await worker.fetch(request('/api/documents/'+doc.id,{method:'DELETE',headers:ownerHeaders}),env)).status,200);
  assert.equal(env.BUCKET.objects.size,0);assert.equal((await worker.fetch(request('/files/'+doc.id),env)).status,404);
});

test('uploads reject missing identity, forged origins, invalid file types and oversized requests',async()=>{
  const env=environment();const send=(name,body,headers=ownerHeaders)=>worker.fetch(request('/api/documents?record=W1',{method:'POST',headers:{...headers,'X-File-Name':encodeURIComponent(name)},body}),env);
  assert.equal((await send('file.pdf','%PDF-1.4',{})).status,401);
  assert.equal((await send('file.pdf','%PDF-1.4',{...ownerHeaders,Origin:'https://other.example'})).status,403);
  assert.equal((await send('file.svg','<svg/>')).status,415);
  assert.equal((await send('file.pdf','<html/>')).status,400);
  assert.equal((await send('file.pdf','%PDF-1.4',{...ownerHeaders,'Content-Length':String(21*1024*1024)})).status,413);
  assert.equal(env.BUCKET.objects.size,0);
});

test('homepage portrait upload is protected and displayed on Home',async()=>{
  const env=environment();const png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
  const upload=await worker.fetch(request('/api/portrait',{method:'PUT',headers:{...ownerHeaders,'Content-Type':'image/png','X-File-Name':'portrait.png'},body:png}),env);assert.equal(upload.status,200);
  const html=await(await worker.fetch(request('/'),env)).text();assert.ok(html.includes('src="/portrait"'));
  const image=await worker.fetch(request('/portrait'),env);assert.equal(image.headers.get('Content-Type'),'image/png');assert.deepEqual(new Uint8Array(await image.arrayBuffer()),png);
  assert.equal((await worker.fetch(request('/api/portrait',{method:'PUT',headers:{...ownerHeaders,'oai-authenticated-user-id':'someone-else','X-File-Name':'portrait.png'},body:png}),env)).status,403);
});

test('About Me uses the supplied biography, verified spelling and independently stored photograph',async()=>{
  const env=environment();
  const homeImage=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,1]);
  const aboutImage=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,2]);
  const headers={...ownerHeaders,'Content-Type':'image/png','X-File-Name':'photo.png'};
  assert.equal((await worker.fetch(request('/api/portrait',{method:'PUT',headers,body:homeImage}),env)).status,200);
  assert.equal((await worker.fetch(request('/api/portrait?target=about',{method:'PUT',headers,body:aboutImage}),env)).status,200);
  const html=await(await worker.fetch(request('/about'),env)).text();
  assert.ok(html.includes('My name is Adel Duissebay, and I am an AI Business student at Astana IT University.'));
  for(const phrase of ['business development, finance, strategic management','analytical, communication, and problem-solving skills','innovation and digital technologies can improve business performance','develop into a knowledgeable and responsible business professional'])assert.ok(html.includes(phrase));
  assert.ok(html.includes('src="/about-portrait"'));
  assert.ok(!html.includes('Adel Duysebay'));
  assert.deepEqual(new Uint8Array(await(await worker.fetch(request('/portrait'),env)).arrayBuffer()),homeImage);
  assert.deepEqual(new Uint8Array(await(await worker.fetch(request('/about-portrait'),env)).arrayBuffer()),aboutImage);
  const body={title:'About Me',summary:'An updated introduction.',content:'Student-edited biography.',sources:[]};
  assert.equal((await worker.fetch(request('/api/records/ABOUT',{method:'PUT',headers:ownerHeaders,body:JSON.stringify(body)}),env)).status,200);
  const updated=await(await worker.fetch(request('/about'),env)).text();assert.ok(updated.includes(body.content));assert.ok(updated.includes(body.summary));
});

test('stored text is escaped in HTML and both browser scripts parse', async () => {
  const env = environment();
  const unsafe = { ...defaults, tagline: '</script><script>alert(1)</script>' };
  await worker.fetch(request('/api/profile', { method: 'PUT', headers: ownerHeaders, body: JSON.stringify(unsafe) }), env);
  const html = await (await worker.fetch(request('/'), env)).text();
  assert.ok(!html.includes(unsafe.tagline));
  assert.ok(html.includes('&lt;/script&gt;'));
  for (const path of ['/app.js', '/admin.js']) new Script(await (await worker.fetch(request(path), env)).text());
});

test('AI Declaration presents only the supplied PDF with open/download controls and preserves original bytes',async()=>{
 const env=environment();const page=await worker.fetch(request('/ai-declaration'),env);assert.equal(page.status,200);const html=await page.text();
 for(const value of ['AI <em>Declaration.</em>','/ai-declaration/preview-4d23d467.jpg','Open PDF','Download PDF','PDF · 1 page','Adel Duissebay','AI Business'])assert.ok(html.includes(value),value);
 for(const value of ['<table','Section-by-section coverage','Student statement','Student attestation','ChatGPT','Claude','9.58%','Adel Duysebay'])assert.ok(!html.includes(value),value);
 const source=await worker.fetch(request('/ai-declaration/source.pdf?download=1'),env);assert.equal(source.status,200);assert.match(source.headers.get('Content-Disposition'),/^attachment/);assert.equal(createHash('sha256').update(new Uint8Array(await source.arrayBuffer())).digest('hex'),'4d23d467ff7efa033e141c64afc08eb8052eb89c4a09897e8d97900b2666286e');
 const image=await worker.fetch(request('/ai-declaration/preview-4d23d467.jpg'),env);assert.equal(image.status,200);assert.deepEqual(new Uint8Array(await image.arrayBuffer()).slice(0,3),new Uint8Array([255,216,255]));
 const archived=await worker.fetch(request('/files/provided-ai-declaration'),env);assert.equal(createHash('sha256').update(new Uint8Array(await archived.arrayBuffer())).digest('hex'),'c63a28076397402cd76c7e47b5140e353e299a531a8b4c42ebeb2d3773051bb6');
 const range=await worker.fetch(request('/ai-declaration/source.pdf',{headers:{Range:'bytes=0-7'}}),env);assert.equal(range.status,206);assert.ok((await range.text()).startsWith('%PDF-'));
 const admin=await(await worker.fetch(request('/admin',{headers:ownerHeaders}),env)).text();assert.ok(admin.includes('Upload declaration PDF'));assert.ok(admin.includes('/admin?record=AI#uploads'));assert.ok(!admin.includes('id="declaration-form"'));
});

test('new protected PDF uploads update the AI Declaration viewer, source alias and current-file badge',async()=>{
 const env=environment();const bytes='%PDF-1.4\nLatest student declaration';
 const res=await worker.fetch(request('/api/documents?record=AI',{method:'POST',headers:{...ownerHeaders,'Content-Type':'application/pdf','X-File-Name':'Revised%20declaration.pdf'},body:bytes}),env);assert.equal(res.status,201);const doc=(await res.json()).document;
 let html=await(await worker.fetch(request('/ai-declaration'),env)).text();assert.ok(html.includes('<object data="/ai-declaration/source.pdf#view=FitH'));assert.ok(!html.includes('/ai-declaration/preview-4d23d467.jpg'));assert.ok(!html.includes('PDF · 1 page'));
 const source=await worker.fetch(request('/ai-declaration/source.pdf?download=1'),env);assert.equal(await source.text(),bytes);
 const artifacts=await(await worker.fetch(request('/artifacts?section=declaration'),env)).text();assert.equal((artifacts.match(/Current declaration/g)||[]).length,1);const start=artifacts.indexOf('data-artifact-id="'+doc.id+'"');assert.ok(artifacts.slice(start,artifacts.indexOf('</article>',start)).includes('Current declaration'));
 assert.equal((await worker.fetch(request('/api/documents/'+doc.id,{method:'DELETE',headers:ownerHeaders}),env)).status,200);
 html=await(await worker.fetch(request('/ai-declaration'),env)).text();assert.ok(html.includes('/ai-declaration/preview-4d23d467.jpg'));
});

test('capstone shows one supplied presentation with sixteen slide previews and preserves the exact original PDF',async()=>{
  const env=environment();const page=await worker.fetch(request('/capstone'),env);assert.equal(page.status,200);const html=await page.text();
  assert.ok(html.includes('data-slide-count="16"'));assert.ok(html.includes('1 presentation file'));assert.ok(html.includes('data-slide-previous'));assert.ok(html.includes('data-slide-next'));assert.ok(html.includes('data-slide="16"'));assert.ok(html.includes('Group 2603 AIB'));
  for(const number of [1,8,16]){const slide=await worker.fetch(request('/capstone/slides/'+number+'.jpg'),env);assert.equal(slide.status,200);const bytes=new Uint8Array(await slide.arrayBuffer());assert.deepEqual(bytes.slice(0,3),new Uint8Array([255,216,255]));}
  assert.equal((await worker.fetch(request('/capstone/slides/17.jpg'),env)).status,404);
  const original=await worker.fetch(request('/capstone/presentation.pdf?download=1'),env);assert.equal(createHash('sha256').update(new Uint8Array(await original.arrayBuffer())).digest('hex'),'0508df5cbce7c571e545ec5f20b16da65dc527e808000f1aacaf81a1cdf9b0df');
  const partial=await worker.fetch(request('/files/provided-capstone-presentation',{headers:{Range:'bytes=0-7'}}),env);assert.equal(partial.status,206);assert.ok((await partial.text()).startsWith('%PDF-'));
  const library=await(await worker.fetch(request('/evidence'),env)).text();assert.ok(library.includes('Freedom_Bank_AI_Capstone_Clean_Adel_Duissebay.pdf'));assert.ok(library.includes('AI-Use_Declaration_Form.pdf'));
});


function seedReviewedFiles(env){
 for(const file of reviewedFiles.filter(file=>!file.id.startsWith('provided-'))){
  const mime=file.name.endsWith('.docx')?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':file.name.endsWith('.pptx')?'application/vnd.openxmlformats-officedocument.presentationml.presentation':'application/pdf';
  env.DB.prepare('INSERT INTO portfolio_document (id,record_id,name,storage_key,mime,size,created_at) VALUES (?,?,?,?,?,?,?)').bind(file.id,file.recordId,file.name,'documents/'+file.id,mime,100,'2026-11-10T13:00:00Z').run();
 }
}
test('evidence catalogue joins all reviewed files to extracted sources, deduplicates resources and filters independently',async()=>{
 const env=environment();seedReviewedFiles(env);
 const html=await(await worker.fetch(request('/evidence'),env)).text();
 assert.equal((html.match(/class="reference-card"/g)||[]).length,29);
 for(const expected of ['<strong>29</strong> sources','<strong>5</strong> collections','<strong>14</strong> citing records','<strong>14</strong> distinct documents','<strong>17</strong> reviewed file entries','No bibliography, source URLs or numbered reference list found','duplicated .html suffix','stat.gov.kz','Reference collection','Original files'])assert.ok(html.includes(expected),expected);
 const filtered=await(await worker.fetch(request('/evidence?work=W3'),env)).text();
 assert.equal((filtered.match(/class="reference-card"/g)||[]).length,4);
 assert.ok(filtered.includes('Forms of Business Ownership'));
 const search=await(await worker.fetch(request('/evidence?q=Generative+AI+and+Jobs&work=A4&category=careers'),env)).text();
 assert.equal((search.match(/class="reference-card"/g)||[]).length,1);
 assert.ok(search.includes('ILO')||search.includes('International Labour Organization'));
 assert.ok(search.includes('p. 3 · [7]'));
 assert.ok(search.includes('/documents/3d1e0e83-1b25-451d-971d-bbd198bb60a6?page=3#document-preview'));
 const empty=await(await worker.fetch(request('/evidence?q=unfindable-citation-xyz&category=bofa'),env)).text();
 assert.equal((empty.match(/class="reference-card"/g)||[]).length,0);assert.ok(empty.includes('No matching resources.'));
 const ids=new Set(extractedSources.map(source=>source.id));assert.equal(ids.size,29);
 const works=new Set(reviewedFiles.map(file=>file.recordId));for(const source of extractedSources)for(const cite of source.citations)assert.ok(works.has(cite.work));
});
test('new uploads await review and removed files do not retain active citation claims',async()=>{
 const env=environment();seedReviewedFiles(env);
 const upload=await worker.fetch(request('/api/documents?record=W2',{method:'POST',headers:{...ownerHeaders,'X-File-Name':'New resources.pdf','Content-Type':'application/pdf'},body:'%PDF-1.4\nNew uploaded bibliography'}),env);assert.equal(upload.status,201);
 let html=await(await worker.fetch(request('/evidence'),env)).text();assert.ok(html.includes('New resources.pdf'));assert.ok(html.includes('Awaiting source review'));assert.ok(html.includes('<strong>29</strong> sources'));assert.ok(html.includes('<strong>1</strong> awaiting review'));
 await env.DB.prepare('DELETE FROM portfolio_document WHERE record_id=?').bind('W3').run();
 html=await(await worker.fetch(request('/evidence?work=W3'),env)).text();assert.equal((html.match(/class="reference-card"/g)||[]).length,0);
 assert.equal(evidenceModel({documents:reviewedFiles.map(file=>({id:file.id})),evidenceSources:extractedSources}).uniqueFiles,14);
});
test('evidence edits persist behind owner and origin protection without changing original citations',async()=>{
 const env=environment();const source=extractedSources.find(source=>source.id==='wef-future-jobs-2025');
 const value={title:'Updated research resource',publisher:'Publisher <script>bad()</script>',scope:'Verified role',notes:'Edited source note',url:'https://www.weforum.org/publications/the-future-of-jobs-report-2025',linkLabel:'Read report'};
 const path='/api/evidence/sources/'+source.id;
 assert.equal((await worker.fetch(request(path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)}),env)).status,401);
 assert.equal((await worker.fetch(request(path,{method:'PUT',headers:{...ownerHeaders,Origin:'https://forged.example'},body:JSON.stringify(value)}),env)).status,403);
 const saved=await worker.fetch(request(path,{method:'PUT',headers:ownerHeaders,body:JSON.stringify(value)}),env);assert.equal(saved.status,200);assert.deepEqual((await saved.json()).source.citations,source.citations);
 const html=await(await worker.fetch(request('/evidence'),env)).text();assert.ok(html.includes(value.title));assert.ok(html.includes('Publisher &lt;script&gt;bad()&lt;/script&gt;'));assert.ok(!html.includes('<script>bad()</script>'));
 assert.equal((await worker.fetch(request(path,{method:'PUT',headers:ownerHeaders,body:JSON.stringify({...value,url:'javascript:alert(1)'})}),env)).status,400);
 assert.equal((await worker.fetch(request(path,{method:'PUT',headers:{...ownerHeaders,'oai-authenticated-user-id':'someone-else'},body:JSON.stringify(value)}),env)).status,403);
 assert.equal((await worker.fetch(request('/api/evidence/sources/missing',{method:'PUT',headers:ownerHeaders,body:JSON.stringify(value)}),env)).status,404);
 const edit=await(await worker.fetch(request('/admin',{headers:ownerHeaders}),env)).text();assert.ok(edit.includes('id="evidence-source-form"'));assert.ok(edit.includes(value.title));
});
test('citation page links open the PDF preview at a bounded requested page',async()=>{
 const env=environment();const html=await(await worker.fetch(request('/documents/provided-capstone-presentation?page=16'),env)).text();assert.ok(html.includes('id="document-preview"'));assert.ok(html.includes('#page=16&view=FitH'));
 const bad=await(await worker.fetch(request('/documents/provided-capstone-presentation?page=%22%3E%3Cscript%3E'),env)).text();assert.ok(bad.includes('#page=1&view=FitH'));assert.ok(!bad.includes('id="document-preview" data="/files/provided-capstone-presentation#page="'));
});

test('Artifacts includes every original file across all portfolio sections with preview and download links',async()=>{
 const env=environment();seedReviewedFiles(env);
 const html=await(await worker.fetch(request('/artifacts'),env)).text();
 assert.equal((html.match(/data-artifact-id=/g)||[]).length,17);
 for(const file of reviewedFiles){
  assert.equal(html.split('data-artifact-id="'+file.id+'"').length-1,1,file.id);
  assert.ok(html.includes('href="/documents/'+file.id+'"'),file.name);
  assert.ok(html.includes('href="/files/'+file.id+'?download=1"'),file.name);
 }
 for(const text of ['<strong>17</strong><span>original files','<strong>5</strong><span>portfolio sections','<strong>3</strong><span>file formats','Weekly Records','Assignments','Research Materials','Capstone Project','AI Declaration','/capstone/slides/1.jpg','Group 2603 AIB'])assert.ok(html.includes(text),text);
 assert.ok(html.indexOf('id="artifacts-weekly"')<html.indexOf('id="artifacts-assignment"'));
 const filter=async(path,count)=>{const page=await(await worker.fetch(request(path),env)).text();assert.equal((page.match(/data-artifact-id=/g)||[]).length,count,path);return page;};
 const weekly=await filter('/artifacts?section=weekly',9);assert.ok(!weekly.includes('data-artifact-id="provided-ai-declaration"'));
 await filter('/artifacts?format=word',2);
 await filter('/artifacts?section=assignment&format=pdf',2);
 const governance=await filter('/artifacts?q=governance',2);assert.ok(governance.includes('Assignment 3'));
 const empty=await filter('/artifacts?section=weekly&format=slides',0);assert.ok(empty.includes('No matching files.'));assert.ok(empty.includes('Clear filters'));
});

test('Artifacts automatically reflects new uploads and deletions while keeping the original record attachment',async()=>{
 const env=environment();seedReviewedFiles(env);
 const res=await worker.fetch(request('/api/documents?record=ART2',{method:'POST',headers:{...ownerHeaders,'Content-Type':'application/pdf','X-File-Name':'Additional%20workshop.pdf'},body:'%PDF-1.4\nOriginal workshop document'}),env);assert.equal(res.status,201);const doc=(await res.json()).document;
 let html=await(await worker.fetch(request('/artifacts'),env)).text();assert.equal((html.match(/data-artifact-id=/g)||[]).length,18);assert.ok(html.includes('Additional workshop'));assert.ok(html.includes('Supporting Artifacts'));assert.ok(html.includes('/records/ART2'));
 const original=await(await worker.fetch(request('/records/ART2'),env)).text();assert.ok(original.includes('/documents/'+doc.id));
 const returned=await worker.fetch(request('/files/'+doc.id+'?download=1'),env);assert.equal(await returned.text(),'%PDF-1.4\nOriginal workshop document');
 assert.equal((await worker.fetch(request('/api/documents/'+doc.id,{method:'DELETE',headers:ownerHeaders}),env)).status,200);
 html=await(await worker.fetch(request('/artifacts'),env)).text();assert.equal((html.match(/data-artifact-id=/g)||[]).length,17);assert.ok(!html.includes('data-artifact-id="'+doc.id+'"'));
});

test('Artifacts retains uncategorized files and escapes edited document titles and searches',async()=>{
 const env=environment();seedReviewedFiles(env);
 await env.DB.prepare('INSERT INTO portfolio_document (id,record_id,name,storage_key,mime,size,created_at) VALUES (?,?,?,?,?,?,?)').bind('uncategorized-file','old-record','Archived notes.pdf','documents/uncategorized-file','application/pdf',50,'2026-11-10T14:00:00Z').run();
 const edit=await worker.fetch(request('/api/records/W1',{method:'PUT',headers:ownerHeaders,body:JSON.stringify({title:'Updated <script>bad()</script>',summary:'A revised introduction.',content:'',sources:[]})}),env);assert.equal(edit.status,200);
 const html=await(await worker.fetch(request('/artifacts'),env)).text();assert.equal((html.match(/data-artifact-id=/g)||[]).length,18);assert.ok(html.includes('Additional Documents'));assert.ok(html.includes('data-artifact-id="uncategorized-file"'));assert.ok(html.includes('Updated &lt;script&gt;bad()&lt;/script&gt;'));assert.ok(!html.includes('<script>bad()</script>'));
 const search=await(await worker.fetch(request('/artifacts?q=%22%3E%3Cscript%3Ebad()%3C%2Fscript%3E'),env)).text();assert.ok(!search.includes('<script>bad()</script>'));assert.ok(search.includes('&lt;script&gt;bad()&lt;/script&gt;'));
});


test('program update persists AI Business across a legacy saved profile without changing other identity fields',async()=>{
 const env=environment();const old={...defaults,program:'Business Administration',tagline:'A preserved personal statement.'};
 await env.DB.prepare('INSERT INTO site_profile (id,data,owner_id,updated_at) VALUES (?,?,?,?)').bind('primary',JSON.stringify(old),'test-owner','2026-11-10T12:54:27.977Z').run();
 for(const path of ['/','/about','/contact','/artifacts','/capstone','/ai-declaration','/og.svg']){
  const html=await(await worker.fetch(request(path),env)).text();assert.ok(html.includes('AI Business'),path);assert.ok(!html.includes('Business Administration'),path);
 }
 const row=await env.DB.prepare("SELECT data,owner_id FROM site_profile WHERE id='primary'").first();assert.deepEqual(JSON.parse(row.data),{...old,program:'AI Business'});assert.equal(row.owner_id,'test-owner');
 const admin=await(await worker.fetch(request('/admin',{headers:ownerHeaders}),env)).text();assert.ok(admin.includes('name="program" type="text" value="AI Business"'));
 const next={...old};assert.equal((await worker.fetch(request('/api/profile',{method:'PUT',headers:ownerHeaders,body:JSON.stringify(next)}),env)).status,200);
 const profile=await(await worker.fetch(request('/api/profile',{headers:ownerHeaders}),env)).json();assert.equal(profile.profile.program,next.program,'A later explicit administrator edit remains editable.');
});


test('the new declaration appears in Artifacts and has its own citation-free source review',async()=>{
 const env=environment();seedReviewedFiles(env);
 const artifacts=await(await worker.fetch(request('/artifacts?section=declaration'),env)).text();assert.ok(artifacts.includes('data-artifact-id="provided-ai-declaration-signed-2026-11-10"'));assert.ok(artifacts.includes('Current declaration'));assert.ok(artifacts.includes('1 page'));
 const evidence=await(await worker.fetch(request('/evidence'),env)).text();assert.ok(evidence.includes('No bibliography or source URLs are supplied.'));assert.ok(evidence.includes('AI declaration · current revision'));
 const marker=evidence.indexOf('Latest supplied revision: nine coverage rows');assert.ok(marker>0);const end=evidence.indexOf('</article>',marker);const review=evidence.slice(marker,end);assert.ok(review.includes('No cited sources found'));assert.ok(!review.includes('Sources in AI declaration'));
 const current=reviewedFiles.find(file=>file.id==='provided-ai-declaration-signed-2026-11-10');assert.equal(current.citationWorkId,'AI-CURRENT');assert.ok(!extractedSources.some(source=>source.citations.some(cite=>cite.work==='AI-CURRENT')));
});

test('weekly PDFs render in the record without requiring a download and preserve citation pages',async()=>{
 const env=environment();const id='weekly-preview-check';await env.DB.prepare('INSERT INTO portfolio_document (id,record_id,name,storage_key,mime,size,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,'W4','Weekly report.pdf','documents/'+id,'application/pdf',100,new Date().toISOString()).run();
 const weekly=await(await worker.fetch(request('/records/W4'),env)).text();assert.ok(weekly.includes('data-pdf-viewer'));assert.ok(weekly.includes('data-pdf-url="/files/'+id+'"'));assert.ok(weekly.includes('Previous page'));assert.ok(weekly.includes('Next page'));
 const document=await(await worker.fetch(request('/documents/'+id+'?page=3'),env)).text();assert.ok(document.includes('data-pdf-page="3"'));assert.ok(document.includes('/files/'+id+'?download=1'));
});
