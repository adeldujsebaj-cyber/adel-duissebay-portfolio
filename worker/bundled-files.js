import declarationPdf,{declarationPdfSize} from './declaration-pdf.js';
import capstone from './capstone-assets.js';
import currentDeclarationPdf,{currentDeclarationPdfSize} from './declaration-current-pdf.js';
export const bundledDocumentMetadata=[
 {id:'provided-ai-declaration-signed-2026-11-10',record_id:'AI',name:'AI_Use_Declaration_-_Adel_Duissebay.pdf',mime:'application/pdf',size:currentDeclarationPdfSize,created_at:'2026-11-10T15:10:49.919Z',bundled:true,current:true},
 {id:'provided-ai-declaration',record_id:'AI',name:'AI-Use_Declaration_Form.pdf',mime:'application/pdf',size:declarationPdfSize,created_at:'2026-11-10T00:00:00.000Z',bundled:true},
 {id:'provided-capstone-presentation',record_id:'CAPSTONE',name:'Freedom_Bank_AI_Capstone_Clean_Adel_Duissebay.pdf',mime:'application/pdf',size:capstone.pdfSize,created_at:'2026-11-10T00:00:00.000Z',bundled:true},
];
export function bundledFile(id){const metadata=bundledDocumentMetadata.find(file=>file.id===id);return metadata?{...metadata,base64:id==='provided-ai-declaration-signed-2026-11-10'?currentDeclarationPdf:id==='provided-ai-declaration'?declarationPdf:capstone.pdf}:null;}
export function serveBundledFile(request,url,file,response){
 const headers={'Content-Disposition':(url.searchParams.get('download')==='1'?'attachment':'inline')+`; filename*=UTF-8''${encodeURIComponent(file.name)}`,'Content-Length':String(file.size),'Accept-Ranges':'bytes','Content-Security-Policy':'sandbox'};
 if(request.method==='HEAD')return response(null,file.mime,200,headers);
 let bytes=Uint8Array.from(atob(file.base64),char=>char.charCodeAt(0));const rangeHeader=request.headers.get('Range');
 if(rangeHeader){
  const invalid=()=>response(null,file.mime,416,{'Content-Range':'bytes */'+file.size});const match=rangeHeader.match(/^bytes=(\d*)-(\d*)$/);if(!match||(!match[1]&&!match[2]))return invalid();
  let start,end;if(!match[1]){const suffix=Number(match[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)return invalid();start=Math.max(0,file.size-suffix);end=file.size-1;}else{start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),file.size-1):file.size-1;}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=file.size||end<start)return invalid();
  bytes=bytes.slice(start,end+1);headers['Content-Length']=String(bytes.length);headers['Content-Range']=`bytes ${start}-${end}/${file.size}`;return response(bytes,file.mime,206,headers);
 }
 return response(bytes,file.mime,200,headers);
}
