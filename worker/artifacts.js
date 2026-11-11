import {escapeHtml as e,knownRecord} from './data.js';
import {reviewedFiles} from './evidence-data.js';
import {selectDeclarationPdf} from './declaration.js';

const reviewed=new Map(reviewedFiles.map(file=>[file.id,file]));
const presentations={
 W1:['Economic Systems & Business Introduction','Economic systems, competition and the banking business environment.'],
 W2:['Bank of America & Freedom Bank','A comparison of banking services, customers and digital channels.'],
 W3:['Business Ownership & Entrepreneurship','Ownership structures, business plans and entrepreneurial development.'],
 W4:['Human–AI Task Allocation','A proposed matrix for automation, human review and decision authority.'],
 W5:['AS-IS & TO-BE Process Maps','An illustrative service workflow, pilot measures and escalation controls.'],
 W6:['Marketing, Segmentation & New Products','A proposed marketing workflow, customer segments and product-development exercise.'],
 W7:['AI Workflow & Governance Risk Register','A proposed workflow with privacy, accuracy and human-approval controls.'],
 W8:['Financial Ratios & AI Discrepancy Audit','A preparatory financial audit with formulas, verification notes and pending inputs.'],
 W9:['Career Capability Portfolio','Human, business, digital and meta-capabilities in an AI-supported banking context.'],
 A1:['Comparative Banking Analysis','The Assignment 1 slide deck comparing Bank of America and Freedom Bank Kazakhstan.'],
 A3:['AI Workflow & Governance Risk Register','The Assignment 3 submission on a proposed workflow and its governance risks.'],
 A4:['AI & the Value of Business Graduates','An essay on financial verification, professional judgment and the changing role of graduates.'],
 RESEARCH:['Marketing Research & Segmentation','The research attachment on marketing comparison, segmentation and new product development.'],
 CAPSTONE:['AI-Supported Customer Service','The final presentation proposing a human-in-the-loop pilot for Freedom Bank Kazakhstan.'],
 AI:['AI-Use Declaration','The supplied declaration of AI assistance, verification and academic responsibility.'],
};
const sections=[
 {id:'weekly',title:'Weekly Records',subtitle:'The research journey, week by week.',href:'/weekly-records'},
 {id:'assignment',title:'Assignments',subtitle:'The submitted assignment files, brought together.',href:'/attestations'},
 {id:'research',title:'Research Materials',subtitle:'Documents supporting the comparative banking study.',href:'/research'},
 {id:'capstone',title:'Capstone Project',subtitle:'The final presentation and its original files.',href:'/capstone'},
 {id:'declaration',title:'AI Declaration',subtitle:'AI-use disclosures and supporting declaration files.',href:'/ai-declaration'},
 {id:'artifact',title:'Supporting Artifacts',subtitle:'Additional academic work and weekly supporting materials.'},
 {id:'company',title:'Company Materials',subtitle:'Files attached to the company and founder profiles.',href:'/companies'},
 {id:'other',title:'Additional Documents',subtitle:'Further files from across the portfolio.'},
];
const formats=[['pdf','PDF'],['word','Word'],['slides','PowerPoint'],['spreadsheet','Excel'],['video','Video'],['image','Images'],['other','Other files']];
const formatNames=new Map(formats);
function formatOf(doc){
 if(doc.mime==='application/pdf')return 'pdf';
 if(doc.mime?.includes('wordprocessingml'))return 'word';
 if(doc.mime?.includes('presentationml'))return 'slides';
 if(doc.mime?.includes('spreadsheetml'))return 'spreadsheet';
 if(doc.mime?.startsWith('video/'))return 'video';
 if(doc.mime?.startsWith('image/'))return 'image';
 return 'other';
}
function sectionOf(record){
 if(['company','company-section'].includes(record?.kind))return 'company';
 return sections.some(section=>section.id===record?.kind)?record.kind:'other';
}
function contextLabel(id,record){
 if(/^W\d+$/.test(id))return 'Weekly Record '+id.slice(1);
 if(/^ART\d+$/.test(id))return 'Weekly Artifact '+id.slice(3);
 if(/^A\d+$/.test(id))return 'Assignment '+id.slice(1);
 return id==='AI'?'AI Declaration':id==='CAPSTONE'?'Capstone Project':id==='RESEARCH'?'Research':record?.title||'Portfolio document';
}
function recordURL(record){
 if(record.id==='CAPSTONE')return '/capstone';
 if(record.id==='AI')return '/ai-declaration';
 if(record.id==='RESEARCH')return '/research';
 if(record.kind==='company')return '/companies/'+(record.id==='COMPANY-A'?'bank-of-america':'freedom-bank-kazakhstan');
 return '/records/'+encodeURIComponent(record.id);
}
function sizeLabel(size){return size>=1024*1024?(size/1024/1024).toFixed(2)+' MB':size>=1024?Math.ceil(size/1024)+' KB':size+' B';}
function fileTitle(name){let title=name;try{title=decodeURIComponent(title);}catch{}return title.replace(/\.[^.]+$/,'').replaceAll('_',' ');}
const urlFor=values=>'/artifacts'+(Object.values(values).some(Boolean)?'?'+new URLSearchParams(Object.entries(values).filter(([,value])=>value)).toString():'');

export function artifactsModel(data){
 const recordMap=new Map(data.records.map(record=>[record.id,record]));
 const currentDeclaration=selectDeclarationPdf(data.documents);
 const files=data.documents.map(doc=>{
  const record=recordMap.get(doc.record_id);const review=reviewed.get(doc.id);const presentation=review?presentations[doc.record_id]:null;
  const customTitle=record&&record.title!==knownRecord(record.id)?.title?record.title:null;
  return {...doc,current:doc.id===currentDeclaration?.id,record,section:sectionOf(record),format:formatOf(doc),label:contextLabel(doc.record_id,record),title:customTitle||presentation?.[0]||fileTitle(doc.name),description:record?.summary||presentation?.[1]||'An original file from the academic portfolio.',pages:review?.pages||null};
 });
 files.sort((a,b)=>{
  const sectionOrder=sections.findIndex(section=>section.id===a.section)-sections.findIndex(section=>section.id===b.section);
  if(sectionOrder)return sectionOrder;
  const recordOrder=(Number(a.record_id.match(/\d+$/)?.[0])||0)-(Number(b.record_id.match(/\d+$/)?.[0])||0);
  return recordOrder||a.record_id.localeCompare(b.record_id)||(b.created_at||'').localeCompare(a.created_at||'')||a.id.localeCompare(b.id);
 });
 return {files,sections:sections.filter(section=>files.some(file=>file.section===section.id)),formats:formats.filter(([id])=>files.some(file=>file.format===id))};
}
function cover(file){
 const code=/^(W\d+|A\d+|ART\d+)$/.test(file.record_id)?file.record_id:file.record_id==='CAPSTONE'?'FINAL':file.record_id==='AI'?'AI':'WORK';
 if(file.id==='provided-capstone-presentation')return `<div class="artifact-cover artifact-cover-slide"><img src="/capstone/slides/1.jpg" alt="First slide of the supplied capstone presentation" width="1400" height="788" loading="lazy"><span class="artifact-preview-label">16-SLIDE PRESENTATION</span></div>`;
 return `<div class="artifact-cover artifact-cover-${file.format}" aria-hidden="true"><div class="artifact-cover-frame"><div class="artifact-cover-top"><span>${e(file.label)}</span><span>${e(file.name.split('.').pop().toUpperCase())}</span></div><span class="artifact-cover-code">${e(code)}</span><div class="artifact-cover-title">${e(file.title)}</div><div class="artifact-cover-rule"></div></div></div>`;
}
function card(file){
 const path='/documents/'+encodeURIComponent(file.id);const download='/files/'+encodeURIComponent(file.id)+'?download=1';
 const pageType=file.format==='slides'||file.record_id==='CAPSTONE'?(file.pages===1?'slide':'slides'):(file.pages===1?'page':'pages');
 return `<article class="artifact-card" data-artifact-id="${e(file.id)}"><a href="${path}" class="artifact-cover-link" tabindex="-1" aria-hidden="true">${cover(file)}</a><div class="artifact-card-body"><div class="artifact-card-meta"><span>${e(file.label)}</span><span>${e(formatNames.get(file.format))}</span></div><h3><a href="${path}">${e(file.title)}</a></h3><p class="artifact-description">${e(file.description)}</p><div class="artifact-file-info"><span>${file.pages?file.pages+' '+pageType+' · ':''}${sizeLabel(file.size)}</span>${file.current?'<span class="artifact-original">Current declaration</span>':file.bundled?'<span class="artifact-original">Supplied original</span>':''}</div><p class="artifact-filename" title="${e(file.name)}">${e(file.name)}</p><div class="artifact-card-actions"><a class="artifact-open" href="${path}">Open file</a><a class="artifact-download" href="${download}" aria-label="Download ${e(file.name)}">Download</a></div>${file.record?`<a class="artifact-context" href="${e(recordURL(file.record))}">View ${e(file.label)}</a>`:''}</div></article>`;
}
export function artifactsPage(data,url,shell){
 const model=artifactsModel(data);const query=(url.searchParams.get('q')||'').trim().slice(0,120);
 const selected=model.sections.some(section=>section.id===url.searchParams.get('section'))?url.searchParams.get('section'):'';
 const format=model.formats.some(([id])=>id===url.searchParams.get('format'))?url.searchParams.get('format'):'';
 const matching=model.files.filter(file=>(!format||file.format===format)&&(!query||[file.title,file.description,file.name,file.label,file.record?.title,file.record_id].join(' ').toLowerCase().includes(query.toLowerCase())));
 const files=matching.filter(file=>!selected||file.section===selected);
 const active=model.sections.filter(section=>files.some(file=>file.section===section.id));
 const filters=query||selected||format;
 return shell(data,`<section class="artifacts-hero"><div class="container"><div class="artifacts-hero-grid"><div><p class="eyebrow">THE COMPLETE ACADEMIC COLLECTION</p><h1>Academic<br><em>Artifacts.</em></h1></div><div class="artifacts-hero-intro"><span class="artifacts-hero-label">DOCUMENTING THE JOURNEY</span><p>Every report, assignment and supporting document. One collection connecting the research process to the final presentation.</p><a href="/evidence">Explore the reference collection</a></div></div><div class="artifacts-stats"><div><strong>${model.files.length}</strong><span>original files</span></div><div><strong>${model.sections.length}</strong><span>portfolio sections</span></div><div><strong>${model.formats.length}</strong><span>file formats</span></div><p>${e(data.profile.universityShort)} · ${e(data.profile.program)}<br>Group ${e(data.profile.group)}</p></div></div></section><section class="artifacts-main"><div class="container"><form class="artifacts-search" method="GET" action="/artifacts"><input type="hidden" name="section" value="${e(selected)}"><div><label for="artifact-search">Find a document</label><input id="artifact-search" type="search" name="q" value="${e(query)}" placeholder="Search by title, file name, week or assignment"></div><div><label for="artifact-format">File format</label><select id="artifact-format" name="format"><option value="">All formats</option>${model.formats.map(([id,label])=>`<option value="${id}" ${format===id?'selected':''}>${e(label)}</option>`).join('')}</select></div><button class="button button-navy" type="submit">Search files</button></form><div class="artifacts-layout"><aside class="artifacts-sidebar" aria-label="Artifact sections"><p class="eyebrow">THE COLLECTION</p><a href="${e(urlFor({q:query,format}))}" ${!selected?'aria-current="true"':''}><span>All documents</span><span>${matching.length}</span></a>${model.sections.map(section=>`<a href="${e(urlFor({section:section.id,q:query,format}))}" ${selected===section.id?'aria-current="true"':''}><span>${e(section.title)}</span><span>${matching.filter(file=>file.section===section.id).length}</span></a>`).join('')}<div class="artifacts-sidebar-note"><span>CONNECTED TO THE PORTFOLIO</span><p>Each file links to its original academic record.</p><a href="/evidence">Sources &amp; citations</a></div></aside><div class="artifacts-results"><div class="artifacts-results-heading"><p role="status">${files.length} ${filters?'of '+model.files.length+' ':''}file${files.length===1?'':'s'} ${filters?'matching your filters':'in the collection'}</p>${filters?'<a href="/artifacts">Clear filters</a>':'<span>Original documents · Ready to explore</span>'}</div>${active.length?active.map((section,index)=>`<section class="artifact-group" id="artifacts-${section.id}"><div class="artifact-group-heading"><div><span class="artifact-group-index">${String(index+1).padStart(2,'0')}</span><div><h2>${e(section.title)}</h2><p>${e(section.subtitle)}</p></div></div><span class="artifact-group-count">${files.filter(file=>file.section===section.id).length} file${files.filter(file=>file.section===section.id).length===1?'':'s'}</span></div><div class="artifacts-grid">${files.filter(file=>file.section===section.id).map(card).join('')}</div></section>`).join(''):`<div class="artifacts-empty"><span class="eyebrow">THE DOCUMENT COLLECTION</span><h2>${model.files.length?'No matching files.':'Ready for your work.'}</h2><p>${model.files.length?'Try a different title, portfolio section or file format.':'Documents uploaded to any portfolio record will appear here.'}</p>${model.files.length?'<a class="button button-navy" href="/artifacts">Show all documents</a>':'<a class="button button-navy" href="/admin#uploads">Upload documents</a>'}</div>`}</div></div><div class="artifacts-endnote"><div><p class="eyebrow">THE WORK &amp; ITS SOURCES</p><h2>Follow the <em>evidence.</em></h2><p>Explore the bibliography extracted from the portfolio documents, with original citations and links to the works that use them.</p></div><a class="button button-navy" href="/evidence">Open Evidence Folder</a></div></div></section>`,{path:'/artifacts',title:'Academic Artifacts',description:'All academic documents from '+data.profile.displayName+'’s portfolio: weekly reports, assignments, research materials, the capstone presentation and AI declaration.'});
}
