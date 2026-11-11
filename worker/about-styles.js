export default String.raw`
.about-heading{padding:28px 0 69px;background:var(--navy)}
.about-heading .eyebrow{font-size:8px;letter-spacing:2px;margin-bottom:26px}
.about-heading-row{display:flex;align-items:baseline;justify-content:space-between;gap:50px}
.about-heading h1{font-size:clamp(66px,6vw,96px);letter-spacing:-2.5px;line-height:1.1;margin:0}
.about-heading-row>p{font-family:var(--serif);font-size:12px;color:var(--gold);margin:0 14% 0 0}
.about-story-section{padding:80px 0 70px}
.about-story-layout{width:min(1120px,calc(100% - 112px));display:grid;grid-template-columns:.94fr 1fr;gap:100px;align-items:start}
.about-story-photo{min-width:0;padding-top:5px}
.about-portrait{margin:0;position:relative}
.about-photo-frame{padding:10px;border:1px solid rgba(197,164,109,.55);background:rgba(197,164,109,.06);position:relative}
.about-photo-frame>img{display:block;width:100%;height:auto;aspect-ratio:874/1280;object-fit:contain;object-position:center;background:rgba(197,164,109,.04)}
.about-photo-frame .portrait-placeholder{aspect-ratio:874/1280;min-height:0;padding-block:42px}
.about-photo-frame .frame-diamond{font-size:30px;right:-11px;bottom:25px}
.about-portrait>figcaption{font-family:var(--serif);font-size:8px;letter-spacing:1.8px;text-transform:uppercase;color:var(--blue);margin-top:22px;line-height:1.8}
.about-story-copy{padding-top:28px;min-width:0}
.about-story-copy>.eyebrow{font-size:8px;letter-spacing:2.3px;margin-bottom:25px;color:var(--blue)}
.about-story-name{font-family:var(--serif);font-size:clamp(45px,4.2vw,66px);font-weight:400;line-height:1.06;letter-spacing:-1.8px;margin:0 0 23px;color:var(--navy)}
.about-story-group{font-family:var(--serif);font-size:10px;text-transform:uppercase;letter-spacing:2.2px;color:var(--blue);margin-bottom:29px}
.about-story-text{font-family:var(--serif);font-size:15px;line-height:1.95;color:var(--ink-muted)}
.about-story-text>p{line-height:inherit;margin-bottom:23px}
.about-story-text>p:last-child{margin-bottom:0}
.about-academic-section{padding-bottom:65px}
.about-academic-layout{width:min(1120px,calc(100% - 112px));display:grid;grid-template-columns:1fr 1fr;gap:100px;border-top:1px solid var(--light-line);padding-top:36px}
.about-academic-layout .academic-details{margin:0;border-top:0;padding-top:0}
.about-academic-layout .education-block{margin:0}
.about-academic-layout .education-block>.button{margin-top:12px}
.portrait-previews{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-bottom:23px}
.portrait-preview{display:flex;align-items:center;gap:18px}
.portrait-preview .preview-label{font-size:11px;line-height:1.7;color:var(--ivory)}
.portrait-preview-image{width:75px;height:95px;flex:none}
.portrait-preview-image>img{width:100%;height:100%;object-fit:cover;display:block}
.portrait-preview-image .small-monogram{width:100%;height:100%;font-size:32px}
@media(min-width:1800px){.about-heading{padding-top:27px;padding-bottom:70px}.about-heading h1{font-size:100px}.about-story-layout,.about-academic-layout{width:min(1200px,calc(100% - 180px));gap:125px}.about-story-section{padding-top:75px}.about-story-name{font-size:69px}.about-story-text{font-size:16px;line-height:1.9}.about-story-copy{padding-top:38px}}
@media(max-width:1100px){.about-story-layout,.about-academic-layout{width:calc(100% - 80px);gap:65px}.about-story-section{padding-top:65px}.about-story-name{font-size:53px}.about-story-copy{padding-top:21px}.about-story-text{font-size:14px;line-height:1.9}.about-heading-row>p{margin-right:8%}}
@media(max-width:800px){.about-heading{padding-top:26px;padding-bottom:48px}.about-heading h1{font-size:65px}.about-heading-row>p{font-size:11px;margin-right:0}.about-story-layout,.about-academic-layout{width:calc(100% - 48px);gap:38px}.about-story-section{padding:52px 0}.about-story-copy{padding-top:13px}.about-story-copy>.eyebrow{font-size:7px;letter-spacing:1.4px;margin-bottom:20px}.about-story-name{font-size:45px;letter-spacing:-1.2px}.about-story-group{font-size:9px;letter-spacing:1.5px;margin-bottom:22px}.about-story-text{font-size:13px;line-height:1.85}.about-story-text>p{margin-bottom:19px}.about-academic-layout{padding-top:30px}.about-academic-section{padding-bottom:50px}.about-academic-layout .academic-details dl>div{grid-template-columns:105px 1fr;gap:12px}.about-portrait>figcaption{font-size:7px;letter-spacing:1.2px}.portrait-preview{gap:12px}.portrait-preview .preview-label{font-size:10px}}
@media(max-width:600px){.about-heading{padding-top:22px;padding-bottom:37px}.about-heading .eyebrow{font-size:7px;letter-spacing:1.7px;margin-bottom:24px}.about-heading-row{display:block}.about-heading h1{font-size:62px;letter-spacing:-1.7px}.about-heading-row>p{font-size:11px;margin-top:18px}.about-story-layout,.about-academic-layout{width:calc(100% - 40px);grid-template-columns:1fr;gap:35px}.about-story-section{padding:38px 0 37px}.about-story-photo{width:min(100%,400px);justify-self:center;padding-top:0}.about-photo-frame{padding:8px}.about-photo-frame .frame-diamond{right:-9px;bottom:22px;font-size:25px}.about-portrait>figcaption{font-size:7px;margin-top:18px}.about-story-copy{padding-top:0}.about-story-copy>.eyebrow{font-size:8px;letter-spacing:1.8px;margin-bottom:20px}.about-story-name{font-size:51px;letter-spacing:-1.3px;margin-bottom:19px}.about-story-group{font-size:9px;letter-spacing:2px;margin-bottom:26px}.about-story-text{font-size:15px;line-height:1.9}.about-story-text>p{margin-bottom:22px}.about-academic-layout{gap:32px;padding-top:29px}.about-academic-layout .academic-details dl>div{grid-template-columns:125px 1fr;gap:15px}.about-academic-layout .academic-details h3{font-size:27px}.about-academic-section{padding-bottom:42px}.portrait-previews{gap:18px}.portrait-preview{flex-direction:column;align-items:flex-start;gap:10px}.portrait-preview .preview-label{font-size:10px}}
`;
