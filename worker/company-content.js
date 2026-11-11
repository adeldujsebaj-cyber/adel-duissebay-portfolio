import {escapeHtml as e} from './data.js';
import media from './company-media.js';

const suffix=id=>id==='COMPANY-A'?'A':'B';
const section=(data,id)=>data.records.find(r=>r.id===id);
const paragraphs=text=>(text||'').split(/\n\s*\n/).filter(Boolean).map(p=>`<p>${e(p).replaceAll('\n','<br>')}</p>`).join('');
function sources(record){return record.sources?.length?`<p class="company-section-sources">Sources: ${record.sources.map((url,i)=>`<a href="${e(url)}" target="_blank" rel="noopener noreferrer">[${i+1}] ${e(new URL(url).hostname.replace(/^www\./,''))}</a>`).join(' ')}</p>`:'';}
function picture(data,recordId,key,kind){
 const original=media[key];const uploaded=data.documents.find(d=>d.record_id===recordId&&d.mime.startsWith('image/'));const record=section(data,recordId);
 const src=uploaded?'/files/'+uploaded.id:'/company-media/'+key;
 const alt=uploaded?'Portfolio image for '+record.title:original.alt;
 return `<figure class="company-figure ${kind}"><a href="${src}" target="_blank" rel="noopener" aria-label="View ${e(alt)}"><img src="${src}" alt="${e(alt)}" loading="lazy" decoding="async"></a><figcaption>${e(uploaded?'Portfolio image':original.caption)}${uploaded?'':`<a href="${e(original.source)}" target="_blank" rel="noopener noreferrer">${e(original.credit)}</a>`}</figcaption></figure>`;
}
export function companyMediaFigure(data,id){return picture(data,id,id==='COMPANY-A'?'bofa-building':'freedom-brand','company-building '+(id==='COMPANY-A'?'company-building-bofa':'company-building-freedom'));}
export function founderBlock(data,id){
 const r=section(data,'FOUNDER-'+suffix(id));if(!r)return '';
 return `<section class="company-founder" aria-labelledby="founder-${r.id}"><p class="eyebrow">FOUNDER &amp; ORIGINS</p><div class="founder-intro">${picture(data,r.id,id==='COMPANY-A'?'giannini':'turlov','founder-portrait')}<div><h3 id="founder-${r.id}">${e(r.title)}</h3><p class="founder-role">${e(r.summary)}</p></div></div><div class="founder-description">${paragraphs(r.content)}</div>${sources(r)}</section>`;
}
export function companyResearch(data,id,expanded=false){
 const history=section(data,'HISTORY-'+suffix(id));const services=section(data,'SERVICES-'+suffix(id));
 const historyBody=history?`<ol class="company-timeline">${history.content.split(/\n\s*\n/).filter(Boolean).map(line=>{const match=line.match(/^(\d{4})\s+—\s+([\s\S]+)$/);return match?`<li><span class="timeline-year">${match[1]}</span><p>${e(match[2])}</p></li>`:`<li><p>${e(line)}</p></li>`;}).join('')}</ol>${sources(history)}`:'';
 const servicesBody=services?`<p class="company-service-audience">${e(services.summary)}</p><div class="company-services">${services.content.split(/\n\s*\n/).filter(Boolean).map(line=>{const divider=line.indexOf(' — ');return divider>=0?`<div><h4>${e(line.slice(0,divider))}</h4><p>${e(line.slice(divider+3))}</p></div>`:`<p>${e(line)}</p>`;}).join('')}</div>${sources(services)}`:'';
 return `<div class="company-research-blocks">${[[history,historyBody],[services,servicesBody]].filter(([r])=>r).map(([r,body])=>expanded?`<section class="company-research-expanded"><h3>${e(r.title)}</h3>${body}</section>`:`<details class="company-research-accordion"><summary>${e(r.title)}<span aria-hidden="true">+</span></summary><div>${body}</div></details>`).join('')}</div>`;
}
