import {bundledDocumentMetadata} from './bundled-files.js';

export const defaults = Object.freeze({
  legalName: 'Duissebay Adel', displayName: 'Adel Duissebay',
  university: 'Astana IT University', universityShort: 'AITU',
  program: 'AI Business', group: '2603 AIB',
  personalEmail: 'adeldujsebaj@gmail.com', universityEmail: '262603@astanait.edu.kz',
  tagline: 'Exploring Business, Innovation & the Future of Finance.',
});
export const profileFields = [
  ['legalName','Full legal name','text',100],['displayName','Display name','text',100],
  ['university','University','text',140],['universityShort','University abbreviation','text',20],
  ['program','Academic program','text',120],['group','Academic group','text',40],
  ['personalEmail','Personal email','email',254],['universityEmail','Official university email','email',254],
  ['tagline','Homepage statement','text',220],
];
const base = (id, kind, title, summary = '', content = '', sources = []) => ({id,kind,title,summary,content,sources});
export const recordDefaults = [
  base('RESEARCH','research','Banking across markets.','A comparative business research portfolio exploring Bank of America and Freedom Bank Kazakhstan.'),
  base('ABOUT','about','About Me','A personal perspective.',
    'I am interested in business development, finance, strategic management, and the integration of technology into modern business practices. Throughout my studies, I have been developing my analytical, communication, and problem-solving skills through academic projects and practical assignments.\n\nI am particularly interested in how innovation and digital technologies can improve business performance and create new opportunities.\n\nMy goal is to build a strong professional foundation in business and finance, gain practical experience, and develop into a knowledgeable and responsible business professional.'),
  base('COMPANIES','overview','Company Profiles',
    'This section examines two financial institutions operating in different markets: Bank of America and Freedom Bank Kazakhstan. Their comparison provides an opportunity to explore different banking environments, business strategies, customer segments, and approaches to digital transformation.',
    'Bank of America and Freedom Bank Kazakhstan operate in different economic and regulatory environments. Comparing them helps identify how market conditions, organisational capabilities, customer expectations, and digital strategies influence business performance.\n\nBank of America provides an example of an established international banking model, while Freedom Bank Kazakhstan offers insight into the development of digital financial services in a regional market.'),
  base('COMPANY-A','company','Bank of America',
    'Bank of America is a major American financial institution headquartered in Charlotte, North Carolina. It provides a wide range of financial services, including consumer banking, corporate banking, investment services, lending, and wealth management.',
    'The company operates in a highly competitive financial market and uses digital technologies to improve customer experience, service accessibility, and operational efficiency.',
    ['https://www.bankofamerica.com/','https://investor.bankofamerica.com/profile']),
  base('COMPANY-B','company','Freedom Bank Kazakhstan',
    'Freedom Bank Kazakhstan is a financial institution operating within the Kazakhstani banking sector and is part of the Freedom financial ecosystem.',
    'Its activities include retail and business banking services, digital financial products, payment solutions, and lending. The bank operates in a developing digital financial environment where innovation, customer experience, and technological integration are increasingly important.',
    ['https://bankffin.kz/','https://www.bankffin.kz/en/about']),
  base('FOUNDER-A','company-section','Amadeo P. Giannini','Historical predecessor founder · Bank of Italy, 1904',
    'Giannini founded Bank of Italy in San Francisco in 1904 to widen access to banking. The institution later adopted the Bank of America name. His role belongs to the bank’s historical origins; the present corporation also reflects later mergers, including the 1998 combination of NationsBank and BankAmerica.',
    ['https://about.bankofamerica.com/en/our-company/celebrating250']),
  base('HISTORY-A','company-section','Origins & development','Bank of America',
    '1904 — A. P. Giannini establishes Bank of Italy in San Francisco.\n\n1930 — The institution adopts the Bank of America National Trust & Savings Association name.\n\n1998 — NationsBank and BankAmerica merge, bringing together the Charlotte- and San Francisco-based groups.\n\n2008 — Bank of America launches its mobile banking app.\n\n2018 — Erica, its AI-driven virtual assistant, is introduced.',
    ['https://about.bankofamerica.com/en/our-company/celebrating250']),
  base('SERVICES-A','company-section','Business model & services','Consumers, business owners and institutional clients',
    'Consumer banking — Accounts, savings, payment cards and lending support everyday financial needs.\n\nWealth & investment services — Wealth management and investment solutions serve clients with different financial goals.\n\nBusiness & institutional banking — Banking, financing and financial risk-management services support businesses and larger institutions.\n\nDigital channels — Online and mobile banking complement the branch network. Erica adds a virtual-assistance channel within the digital banking experience.',
    ['https://investor.bankofamerica.com/profile','https://about.bankofamerica.com/en/our-company/celebrating250']),
  base('FOUNDER-B','company-section','Timur Turlov','Founder of Freedom Finance and the Freedom financial group',
    'Turlov founded Freedom Finance in 2008 and is identified by Freedom Holding Corp. as the founder of the wider financial group. Freedom Bank Kazakhstan traces its own banking origins to Kassa Nova, established in 2009 and acquired by Freedom Finance in 2020.',
    ['https://ir.freedomholdingcorp.com/faq','https://www.sec.gov/Archives/edgar/data/924805/000165495420008328/frhc_ex991.htm']),
  base('HISTORY-B','company-section','Origins & development','Freedom Bank Kazakhstan',
    '2009 — Bank Kassa Nova is established in Kazakhstan.\n\n2020 — Freedom Finance acquires the bank; the transaction closes in December.\n\n2021 — The bank is renamed Bank Freedom Finance Kazakhstan on 1 February.\n\n2024 — Following re-registration in May, it adopts the name Freedom Bank Kazakhstan.',
    ['https://www.sec.gov/Archives/edgar/data/924805/000165495420008328/frhc_ex991.htm','https://bankffin.kz/storage/files/docs/351/doc-ru-351-1660558327.pdf','https://bankffin.kz/ru/articles/739-ao-bank-fridom-finans-kazaxstan-smenilo-nazvanie']),
  base('SERVICES-B','company-section','Business model & services','Individuals, sole proprietors and companies in Kazakhstan',
    'Retail banking — Cards and accounts, deposits, payments, currency exchange, mortgages, vehicle loans and consumer lending.\n\nBusiness banking — Accounts and lending for sole proprietors and companies, acquiring, guarantees, corporate cards and payroll services.\n\nDigital access — Mobile and online services support routine banking, while digital mortgage and vehicle-financing products extend remote access to lending.\n\nGroup context — The bank operates within the wider Freedom financial ecosystem. The banking entity and its parent group have distinct histories and activities.',
    ['https://bankffin.kz/en/about','https://ir.freedomholdingcorp.com/faq']),
  ...Array.from({length:9},(_,i)=>base('W'+(i+1),'weekly','Week '+(i+1))),
  ...Array.from({length:9},(_,i)=>base('ART'+(i+1),'artifact','Week '+(i+1)+' artifacts')),
  ...Array.from({length:4},(_,i)=>base('A'+(i+1),'assignment','Assignment '+(i+1))),
  base('CAPSTONE','capstone','Final capstone presentation','AI-Supported Customer Service Process Improvement at Freedom Bank Kazakhstan'),
  base('EVIDENCE','evidence','Supporting research materials'),
  base('AI','declaration','AI Use Declaration'),
];
export const knownRecord = id => recordDefaults.find(r=>r.id===id);
export async function profileRow(env) { return env.DB.prepare("SELECT data, owner_id, updated_at FROM site_profile WHERE id = 'primary'").first(); }
export async function loadProfile(env) {
 let row=await profileRow(env);
 if(!row)return {...defaults};
 const saved=JSON.parse(row.data);
 // Apply the owner's program-name update to the existing profile outside schema
 // migrations. Later edits remain editable; the snapshot guard preserves any
 // concurrent changes to the profile or its ownership.
 if(saved.program==='Business Administration'&&row.updated_at<'2026-11-10T14:57:42.000Z'){
  await env.DB.prepare("UPDATE site_profile SET data=json_set(data,'$.program',?), updated_at=? WHERE id='primary' AND owner_id=? AND data=? AND updated_at=?")
   .bind(defaults.program,new Date().toISOString(),row.owner_id,row.data,row.updated_at).run();
  row=await profileRow(env);
 }
 return row?{...defaults,...JSON.parse(row.data)}:{...defaults};
}
export async function loadRecords(env) {
  const result=await env.DB.prepare('SELECT id, data FROM portfolio_record').all();
  const saved=new Map(result.results.map(r=>[r.id,JSON.parse(r.data)]));
  return recordDefaults.map(r=>({...r,...(saved.get(r.id)||{})}));
}
export async function loadDocuments(env) {
  const result=await env.DB.prepare('SELECT id, record_id, name, mime, size, created_at FROM portfolio_document ORDER BY created_at DESC').all();
  return [...result.results,...bundledDocumentMetadata];
}
export async function loadPortfolio(env) {
  const [profile,records,documents]=await Promise.all([loadProfile(env),loadRecords(env),loadDocuments(env)]);
  const [portrait,aboutPortrait]=env.BUCKET?await Promise.all([env.BUCKET.head('site/portrait'),env.BUCKET.head('site/about-portrait')]):[null,null];
  return {profile,records,documents,portrait:!!portrait,aboutPortrait:!!aboutPortrait};
}
export class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
export async function administrator(request,env,claim=false) {
  const userId=request.headers.get('oai-authenticated-user-id');
  if(!userId)throw new HttpError(401,'Sign in with the ChatGPT account that owns this website.');
  let row=await profileRow(env);
  if(row&&row.owner_id!==userId)throw new HttpError(403,'This action is reserved for the website administrator.');
  if(claim&&!row){
    await env.DB.prepare("INSERT INTO site_profile (id,data,owner_id,updated_at) VALUES ('primary',?,?,?) ON CONFLICT(id) DO NOTHING").bind(JSON.stringify(defaults),userId,new Date().toISOString()).run();
    row=await profileRow(env);
    if(row.owner_id!==userId)throw new HttpError(403,'This action is reserved for the website administrator.');
  }
  return userId;
}
export const escapeHtml = value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const initials = name=>name.trim().split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase();
export function validate(data) {
  if(!data||typeof data!=='object'||Array.isArray(data))throw new HttpError(400,'Enter valid profile details.');
  const result={};
  for(const [key,label,type,max] of profileFields){
    const value=typeof data[key]==='string'?data[key].trim():'';
    if(!value||value.length>max||/[\u0000-\u001f\u007f]/.test(value))throw new HttpError(400,`${label} must contain between 1 and ${max} characters.`);
    if(type==='email'&&!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(value))throw new HttpError(400,`Enter a valid ${label.toLowerCase()}.`);
    result[key]=value;
  }
  return result;
}
export function validateRecord(id,data){
  const original=knownRecord(id);if(!original)throw new HttpError(404,'Record not found.');
  const result={id,kind:original.kind};
  for(const [key,max]of [['title',180],['summary',700],['content',25000]]){
    if(typeof data[key]!=='string'||data[key].length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(data[key]))throw new HttpError(400,`Enter valid ${key} text (up to ${max} characters).`);
    result[key]=data[key].trim();
  }
  if(!result.title)throw new HttpError(400,'A title is required.');
  if(!Array.isArray(data.sources)||data.sources.length>30)throw new HttpError(400,'Use up to 30 source links.');
  result.sources=data.sources.map(source=>{
    if(typeof source!=='string'||source.length>2000)throw new HttpError(400,'Enter valid source links.');
    let url;try{url=new URL(source);}catch{throw new HttpError(400,'Source links must be complete HTTPS URLs.');}
    if(url.protocol!=='https:'||url.username||url.password)throw new HttpError(400,'Source links must use HTTPS without credentials.');
    return url.href;
  });return result;
}
