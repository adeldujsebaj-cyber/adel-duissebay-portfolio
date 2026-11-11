import {escapeHtml as e,HttpError} from './data.js';
import {evidenceCategories,extractedSources,reviewedFiles,evidenceReviewDate} from './evidence-data.js';

const STORE_ID='EVIDENCE_SOURCE_EDITS';
const editable=['title','publisher','scope','notes','url','linkLabel'];
export async function loadEvidenceSources(env){
 const row=await env.DB.prepare('SELECT data FROM portfolio_record WHERE id=?').bind(STORE_ID).first();
 const edits=row?JSON.parse(row.data):{};
 return extractedSources.map(source=>({...source,...edits[source.id]}));
}
export async function saveEvidenceSource(env,id,value){
 if(!extractedSources.some(source=>source.id===id))throw new HttpError(404,'This resource could not be found.');
 if(!value||typeof value!=='object'||Array.isArray(value))throw new HttpError(400,'Enter valid resource details.');
 const data={};
 for(const key of editable){
  const max=['scope','notes'].includes(key)?4000:key==='url'?2000:300;
  if(typeof value[key]!=='string'||value[key].length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value[key]))throw new HttpError(400,'Enter valid text for '+key+'.');
  data[key]=value[key].trim();
 }
 if(!data.title||!data.publisher)throw new HttpError(400,'A title and publisher are required.');
 if(data.url){
  if(/\s/.test(data.url))throw new HttpError(400,'Use a URL without spaces or line breaks.');
  if(data.url.startsWith('/')){
   if(!/^\/records\/(?:W[1-9]|A[1-4])$/.test(data.url))throw new HttpError(400,'Use a portfolio record link or a complete HTTPS URL.');
  }else{
   let url;try{url=new URL(data.url);}catch{throw new HttpError(400,'Enter a complete HTTPS URL.');}
   if(url.protocol!=='https:'||url.username||url.password)throw new HttpError(400,'Use a complete HTTPS URL without credentials.');
  }
  if(!data.linkLabel)throw new HttpError(400,'Add a label for the resource link.');
 }
 const row=await env.DB.prepare('SELECT data FROM portfolio_record WHERE id=?').bind(STORE_ID).first();
 const edits=row?JSON.parse(row.data):{};edits[id]=data;
 await env.DB.prepare('INSERT INTO portfolio_record (id,data,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at').bind(STORE_ID,JSON.stringify(edits),new Date().toISOString()).run();
 return {...extractedSources.find(source=>source.id===id),...data};
}

const workLabel=id=>id==='CAPSTONE'?'Capstone presentation':id==='AI'?'AI declaration · earlier form':id==='AI-CURRENT'?'AI declaration · current revision':id==='RESEARCH'?'Research document':/^W\d$/.test(id)?'Weekly Record '+id.slice(1):/^A\d$/.test(id)?'Assignment '+id.slice(1):id;
const categories=new Map(evidenceCategories);
const statusText={precise:'Publication located',incomplete:'Citation details pending',internal:'Uploaded student work'};
const recordURL=id=>id==='CAPSTONE'?'/capstone':id==='AI'?'/ai-declaration':id==='RESEARCH'?'/research':'/records/'+id;
const queryURL=values=>'/evidence'+(Object.values(values).some(Boolean)?'?'+new URLSearchParams(Object.entries(values).filter(([,value])=>value)).toString():'');
const dateLabel='10 November 2026';

export function evidenceModel(data){
 const available=new Map(data.documents.map(doc=>[doc.id,doc]));
 const reviewed=reviewedFiles.filter(file=>available.has(file.id));
 const works=new Map();for(const file of reviewed){const key=file.citationWorkId||file.recordId;if(!works.has(key))works.set(key,[]);works.get(key).push(file);}
 const sources=(data.evidenceSources||extractedSources).map(source=>({...source,citations:source.citations.filter(cite=>works.has(cite.work))})).filter(source=>source.citations.length);
 const pending=data.documents.filter(doc=>!reviewedFiles.some(file=>file.id===doc.id));
 return {sources,reviewed,works,pending,uniqueFiles:new Set(reviewed.map(file=>file.sha256)).size,reviewDate:evidenceReviewDate};
}

function citationLink(cite,model){
 const files=model.works.get(cite.work)||[];
 const file=files.find(file=>!file.id.startsWith('provided-'))||files[0];
 if(!file)return recordURL(cite.work);
 const page=cite.location.match(/^(?:pp?\.\s*|slide\s+)(\d+)/i)?.[1];
 return '/documents/'+file.id+(page?'?page='+page:'')+'#document-preview';
}
function sourceCard(source,model){
 const seen=new Set();const chips=source.citations.filter(cite=>{if(seen.has(cite.work))return false;seen.add(cite.work);return true;});
 return `<article class="reference-card" id="source-${e(source.id)}"><div class="reference-card-top"><span>${e(source.type)}</span><span>${e(categories.get(source.category))}</span></div><h2>${e(source.title)}</h2><p class="reference-publisher">${e(source.publisher)}</p><p class="reference-scope">${e(source.scope)}</p><div class="reference-review"><span class="reference-status reference-status-${source.status}">${e(statusText[source.status])}</span><p>${e(source.notes)}</p></div><div class="reference-used"><p class="tiny-label">REFERENCED IN</p><div class="reference-chips">${chips.map(cite=>`<a href="${e(citationLink(cite,model))}" title="${e(cite.location)}">${e(workLabel(cite.work))}</a>`).join('')}</div></div><details class="reference-citations"><summary>Original citations &amp; locations <span>${source.citations.length}</span></summary><ol>${source.citations.map(cite=>`<li><a href="${e(citationLink(cite,model))}">${e(workLabel(cite.work))} · ${e(cite.location)}</a><p>${e(cite.quote)}</p></li>`).join('')}</ol></details><div class="reference-actions">${source.url?`<a class="reference-open" href="${e(source.url)}" ${source.url.startsWith('https:')?'target="_blank" rel="noopener noreferrer"':''}>${e(source.linkLabel)}</a>`:'<span class="reference-no-link">Exact source file / URL not supplied</span>'}<button type="button" class="reference-copy" data-copy="${e(source.citations[0].quote)}" data-copy-label="Citation copied.">Copy citation</button></div></article>`;
}
function reviewTable(data,model){
 const groups=new Map();
 for(const file of model.reviewed){if(!groups.has(file.sha256))groups.set(file.sha256,[]);groups.get(file.sha256).push(file);}
 return `<section class="evidence-review-section" id="file-review"><div class="reference-section-heading"><div><p class="eyebrow">FROM FILE TO REFERENCE</p><h2>Every file, <em>accounted for.</em></h2></div><p>Reviewed ${dateLabel}. Identical copies share one review. New uploads remain marked as awaiting review until their sources are examined.</p></div><div class="evidence-review-summary"><span><strong>${model.reviewed.length}</strong> reviewed file entries</span><span><strong>${model.uniqueFiles}</strong> distinct documents</span><span><strong>${model.pending.length}</strong> awaiting review</span></div><div class="file-review-list">${[...groups.values()].map(files=>{
 const first=files[0];const workIDs=[...new Set(files.map(file=>file.citationWorkId||file.recordId))];const sourceCount=model.sources.filter(source=>source.citations.some(cite=>workIDs.includes(cite.work))).length;
 return `<article class="file-review-row"><div><p class="tiny-label">${workIDs.map(workLabel).map(e).join(' / ')}${first.pages?' · '+first.pages+' '+(first.recordId==='A1'||first.recordId==='CAPSTONE'?'slides':'pages'):''}</p><h3><a href="/documents/${e(first.id)}">${e(first.name)}</a></h3><p>${e(first.note)}</p><span class="file-review-location">${e(first.section)}${files.length>1?' · '+files.length+' identical copies':''}</span></div><div class="file-review-links"><span class="reference-status">${sourceCount?sourceCount+' linked resources':'No cited sources found'}</span>${workIDs.filter(work=>model.sources.some(source=>source.citations.some(cite=>cite.work===work))).map(work=>`<a href="${queryURL({work})}">Sources in ${e(workLabel(work))}</a>`).join('')}<a href="/documents/${e(first.id)}">View original file</a></div></article>`;
 }).join('')}${model.pending.map(file=>`<article class="file-review-row is-pending"><div><p class="tiny-label">${e(workLabel(file.record_id))}</p><h3><a href="/documents/${e(file.id)}">${e(file.name)}</a></h3><p>This file was added after the source review or is not part of the reviewed set. Its bibliography has not been extracted.</p></div><span class="reference-status">Awaiting source review</span></article>`).join('')}</div></section>`;
}
function documentLibrary(data,url,documentCards){
 const query=(url.searchParams.get('q')||'').trim().slice(0,120);
 const kinds=['all','weekly','artifact','assignment','capstone','evidence','company','declaration'];
 const category=kinds.includes(url.searchParams.get('category'))?url.searchParams.get('category'):'all';
 const recordMap=new Map(data.records.map(record=>[record.id,record]));
 const docs=data.documents.filter(file=>{const record=recordMap.get(file.record_id);return record&&(category==='all'||record.kind===category||(category==='company'&&record.kind==='company-section'))&&(!query||(file.name+' '+record.title).toLowerCase().includes(query.toLowerCase()));});
 return `<form class="reference-filters document-library-filters" method="GET" action="/evidence"><input type="hidden" name="view" value="documents"><div><label for="document-search">Search original files</label><input id="document-search" type="search" name="q" value="${e(query)}" placeholder="File name or portfolio record"></div><div><label for="document-category">Portfolio section</label><select id="document-category" name="category">${kinds.map(kind=>`<option value="${kind}" ${kind===category?'selected':''}>${kind==='all'?'All sections':kind[0].toUpperCase()+kind.slice(1)}</option>`).join('')}</select></div><button class="button button-navy" type="submit">Find files</button></form><p class="reference-results">${docs.length} original file${docs.length===1?'':'s'}${query?' matching your search':''}</p>${docs.length?documentCards(docs):'<div class="reference-empty"><h2>No matching files.</h2><p>Try a different name or portfolio section.</p><a href="/evidence?view=documents">Show all files</a></div>'}`;
}
export function evidencePage(data,url,shell,documentCards){
 const model=evidenceModel(data);const view=url.searchParams.get('view')==='documents'?'documents':'sources';
 const query=(url.searchParams.get('q')||'').trim().slice(0,120);const work=url.searchParams.get('work')||'';
 const selected=categories.has(url.searchParams.get('category'))?url.searchParams.get('category'):'';
 const citedWorks=[...new Set(model.sources.flatMap(source=>source.citations.map(cite=>cite.work)))];
 const workOrder=['W1','W2','W3','W4','W5','W6','W7','W8','W9','A1','A2','A3','A4','RESEARCH','CAPSTONE','AI'];
 citedWorks.sort((a,b)=>workOrder.indexOf(a)-workOrder.indexOf(b));
 const matching=model.sources.filter(source=>(!work||source.citations.some(cite=>cite.work===work))&&(!query||[source.title,source.publisher,source.scope,source.notes,source.url,categories.get(source.category),...source.citations.map(cite=>cite.quote)].join(' ').toLowerCase().includes(query.toLowerCase())));
 const sources=matching.filter(source=>!selected||source.category===selected);
 const activeCategories=evidenceCategories.filter(([id])=>model.sources.some(source=>source.category===id));
 const sourceContent=`<form class="reference-filters" method="GET" action="/evidence"><input type="hidden" name="category" value="${e(selected)}"><div><label for="reference-search">Search the collection</label><input id="reference-search" type="search" name="q" value="${e(query)}" placeholder="Title, publisher, topic or source URL"></div><div><label for="reference-work">References in a work</label><select id="reference-work" name="work"><option value="">All cited works</option>${citedWorks.map(id=>`<option value="${e(id)}" ${work===id?'selected':''}>${e(workLabel(id))}</option>`).join('')}</select></div><button type="submit" class="button button-navy">Search</button></form><div class="reference-layout"><aside class="reference-categories" aria-label="Resource collections"><a href="${queryURL({q:query,work})}" ${!selected?'aria-current="true"':''}><span>All sources</span><span>${matching.length}</span></a>${activeCategories.map(([id,title])=>`<a href="${queryURL({category:id,q:query,work})}" ${selected===id?'aria-current="true"':''}><span>${e(title)}</span><span>${matching.filter(source=>source.category===id).length}</span></a>`).join('')}<p>Original citations stay connected to their files. Missing editions and pages are clearly marked.</p><a class="reference-review-jump" href="#file-review">View file review</a></aside><div><div class="reference-results-row"><p class="reference-results" role="status">${sources.length} resource${sources.length===1?'':'s'} ${query||work||selected?'matching your filters':'in the collection'}</p>${query||work||selected?'<a href="/evidence">Clear filters</a>':''}</div>${sources.length?`<div class="reference-grid">${sources.map(source=>sourceCard(source,model)).join('')}</div>`:'<div class="reference-empty"><h2>No matching resources.</h2><p>Try a broader search or choose another work.</p><a href="/evidence">Show all sources</a></div>'}</div></div>`;
 return shell(data,`<section class="evidence-page"><div class="container"><header class="reference-hero"><div><p class="eyebrow">EVIDENCE FOLDER / THE REFERENCE COLLECTION</p><h1>Resources behind<br><em>every perspective.</em></h1></div><p>Explore the references found in the uploaded academic work. Each resource explains its role, records its original citation, and links back to the work that cites it.</p></header><div class="reference-stats"><span><strong>${model.sources.length}</strong> sources</span><span><strong>${activeCategories.length}</strong> collections</span><span><strong>${citedWorks.length}</strong> citing records</span><a href="${view==='documents'?'/evidence#file-review':'#file-review'}">Review of ${model.uniqueFiles} distinct documents</a></div><div class="evidence-view-tabs" aria-label="Evidence folder views"><a href="/evidence" ${view==='sources'?'aria-current="page"':''}>Reference collection</a><a href="/evidence?view=documents" ${view==='documents'?'aria-current="page"':''}>Original files <span>${data.documents.length}</span></a></div>${view==='documents'?documentLibrary(data,url,documentCards):sourceContent}${view==='sources'?reviewTable(data,model):'<p class="document-review-link"><a href="/evidence#file-review">View the file-by-file source review</a></p>'}</div></section>`,{path:'/evidence',title:'Evidence Folder',description:'Academic sources, original citations and document reviews from '+data.profile.displayName+'’s comparative banking portfolio.'});
}

export function evidenceAdmin(data){
 const sources=data.evidenceSources||extractedSources;
 return `<section class="admin-panel" id="evidence-editor"><div class="panel-heading"><h2>Evidence source catalogue</h2><a href="/evidence">View collection</a></div><p class="panel-description">Edit a resource’s presentation and destination link. Extracted quotations and file-review history remain attached to the original documents. New uploads are marked as awaiting source review.</p><form id="evidence-source-form"><div class="form-field"><label for="evidence-source-select">Select a resource</label><select id="evidence-source-select">${sources.map(source=>`<option value="${e(source.id)}">${e(source.title)}</option>`).join('')}</select></div>${[['title','Resource title'],['publisher','Publisher / author'],['scope','Role in the research'],['notes','Citation notes'],['url','Source link (HTTPS or portfolio record)'],['linkLabel','Link label']].map(([key,label])=>`<div class="form-field"><label for="evidence-${key}">${label}</label>${['scope','notes'].includes(key)?`<textarea id="evidence-${key}" name="${key}" rows="3" maxlength="4000"></textarea>`:`<input id="evidence-${key}" name="${key}" maxlength="${key==='url'?2000:300}" ${['title','publisher'].includes(key)?'required':''}>`}</div>`).join('')}<div class="form-actions"><p class="form-status" role="status" aria-live="polite"></p><button type="submit" class="button button-gold">Save resource</button></div></form><script type="application/json" id="evidence-source-data">${JSON.stringify(sources).replaceAll('<','\\u003c')}</script></section>`;
}
