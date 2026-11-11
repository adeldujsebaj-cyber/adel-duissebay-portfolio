export const videoPublicJS=String.raw`
document.querySelectorAll('video[data-portfolio-video]').forEach(video=>video.addEventListener('error',()=>{const message=video.parentElement.querySelector('.video-error');if(message)message.hidden=false;}));
`;

export const videoUploadJS=String.raw`
let activeVideoRequest=null;let videoCancelled=false;
const cancelVideoButton=document.querySelector('#cancel-video-upload');
cancelVideoButton?.addEventListener('click',()=>{videoCancelled=true;activeVideoRequest?.abort();});
function sendVideoPart(url,blob,onProgress){return new Promise((resolve,reject)=>{
 const xhr=new XMLHttpRequest();activeVideoRequest=xhr;xhr.open('PUT',url);xhr.responseType='json';xhr.timeout=180000;xhr.setRequestHeader('Content-Type','application/octet-stream');
 xhr.upload.addEventListener('progress',event=>{if(event.lengthComputable)onProgress(event.loaded);});
 xhr.addEventListener('load',()=>{activeVideoRequest=null;if(xhr.status>=200&&xhr.status<300)resolve(xhr.response);else{const error=new Error(xhr.response?.error||'Video upload failed. Please retry.');error.retryable=xhr.status>=500||xhr.status===429;reject(error);}});
 xhr.addEventListener('error',()=>{activeVideoRequest=null;const error=new Error('The connection was interrupted. Please retry.');error.retryable=true;reject(error);});
 xhr.addEventListener('timeout',()=>{activeVideoRequest=null;const error=new Error('The video upload timed out. Please retry.');error.retryable=true;reject(error);});
 xhr.addEventListener('abort',()=>{activeVideoRequest=null;reject(new Error('Video upload cancelled.'));});xhr.send(blob);
});}
async function uploadVideo(file,record,form){
 const progress=form.querySelector('.upload-progress');progress.hidden=false;progress.value=0;videoCancelled=false;cancelVideoButton.hidden=false;cancelVideoButton.disabled=false;let session;
 try{
  session=await api('/api/video-uploads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,size:file.size,recordId:record})});
  for(let offset=0,part=1;offset<file.size;offset+=session.partSize,part++){
   if(videoCancelled)throw new Error('Video upload cancelled.');const blob=file.slice(offset,Math.min(offset+session.partSize,file.size));
   for(let attempt=0;;attempt++){
    try{await sendVideoPart('/api/video-uploads/'+session.id+'/parts/'+part,blob,loaded=>{const percent=Math.min(99,Math.floor((offset+loaded)/file.size*100));progress.value=Math.max(progress.value,percent);status(form,'Uploading '+file.name+' — '+percent+'%');});break;}
    catch(error){if(videoCancelled||!error.retryable||attempt>=2)throw error;status(form,'Retrying the current video part…');await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));}
   }
  }
  if(videoCancelled)throw new Error('Video upload cancelled.');cancelVideoButton.disabled=true;status(form,'Finishing the uploaded video…');
  const result=await api('/api/video-uploads/'+session.id+'/complete',{method:'POST'});progress.value=100;return result.document;
 }catch(error){
  if(session){try{const cleanup=await api('/api/video-uploads/'+session.id,{method:'DELETE'});if(cleanup.document){progress.value=100;return cleanup.document;}if(cleanup.processing){const result=await api('/api/video-uploads/'+session.id+'/complete',{method:'POST'});progress.value=100;return result.document;}}catch{}}
  throw error;
 }finally{activeVideoRequest=null;cancelVideoButton.hidden=true;}
}
const requestedRecord=new URLSearchParams(location.search).get('record');const uploadRecordSelect=document.querySelector('#upload-record');if(requestedRecord&&Array.from(uploadRecordSelect.options).some(option=>option.value===requestedRecord))uploadRecordSelect.value=requestedRecord;
`;
