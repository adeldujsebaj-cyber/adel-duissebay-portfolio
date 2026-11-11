import {escapeHtml as e} from './data.js';
import preview from './declaration-current-preview.js';

export const suppliedDeclarationId='provided-ai-declaration-signed-2026-11-10';
export function selectDeclarationPdf(documents){
 return documents.filter(file=>file.record_id==='AI'&&file.mime==='application/pdf')
  .sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||'')||a.id.localeCompare(b.id))[0]||null;
}
const sizeLabel=size=>size>=1024*1024?(size/1024/1024).toFixed(2)+' MB':Math.ceil(size/1024)+' KB';
export function declarationAdmin(data){
 const file=selectDeclarationPdf(data.documents);
 return `<section class="admin-panel" id="ai-declaration-editor"><div class="panel-heading"><h2>AI declaration PDF</h2><a href="/ai-declaration" target="_blank" rel="noopener">View page</a></div><p class="panel-description">Upload a PDF to the AI record to update the declaration. The newest PDF appears on the website.</p>${file?`<div class="declaration-admin-file"><strong>${e(file.name)}</strong><span>PDF · ${sizeLabel(file.size)}</span><a href="/documents/${e(file.id)}" target="_blank" rel="noopener">View current file</a></div>`:''}<a class="button button-gold" href="/admin?record=AI#uploads">Upload declaration PDF</a></section>`;
}
export function declarationPage(data,shell){
 const file=selectDeclarationPdf(data.documents);const supplied=file?.id===suppliedDeclarationId;
 const pdf='/ai-declaration/source.pdf';
 const page=supplied?`<figure class="declaration-paper"><img src="${preview.path}" width="${preview.width}" height="${preview.height}" alt="Page 1 of the supplied AI Use Declaration PDF" fetchpriority="high" decoding="async"></figure>`:file?`<div class="declaration-native"><object data="${pdf}#view=FitH&toolbar=0&navpanes=0" type="application/pdf" aria-label="AI declaration PDF"><p><a href="${pdf}" target="_blank" rel="noopener">Open the declaration PDF</a></p></object></div>`:'<div class="declaration-pdf-empty"><p>No declaration PDF has been uploaded yet.</p></div>';
 return shell(data,`<section class="page-heading declaration-pdf-heading"><div class="container"><p class="eyebrow">ACADEMIC PORTFOLIO</p><h1>AI <em>Declaration.</em></h1></div></section><section class="declaration-pdf-section"><div class="container"><div class="declaration-pdf-toolbar"><div><h2>AI-Use Declaration</h2><p>${file?'PDF · '+(supplied?'1 page · ':'')+sizeLabel(file.size):'PDF document'}</p></div>${file?`<div class="declaration-pdf-actions"><a class="button declaration-open-pdf" href="${pdf}" target="_blank" rel="noopener">Open PDF</a><a class="button button-navy" href="${pdf}?download=1">Download PDF</a></div>`:''}</div>${page}</div></section>`,{path:'/ai-declaration',title:'AI Declaration'});
}
