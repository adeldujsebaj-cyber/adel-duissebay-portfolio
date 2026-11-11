export default String.raw`
button,.button,.text-link,.small-link,.underlined-link,.email-link,.copy-button,.top-link,
nav>a,.utility a,.hero-foot>a,.footer-nav>a,.footer-bottom>a,.viewer-toolbar a,
.detail-sidebar>a,.collection-index>a,.research-flow>a,.admin-sidebar>a,.admin-document a,
.company-official>a,.source-list a,.company-section-sources>a,.company-figure figcaption>a,
.document-card h3>a,.record-card h2>a,.path-card h3,.path-card .tiny-label,.company-card h3,
.company-research-accordion>summary,.upload-zone>strong{font-weight:700}
input[type=file]::file-selector-button{font-weight:700}
.path-grid>.path-card{padding-bottom:30px}
.document-open{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:auto;padding:9px 13px;border:1px solid var(--blue);color:var(--blue);font-family:var(--serif);font-size:12px;font-weight:700;line-height:1.5;transition:background .2s,color .2s}
.document-open:hover,.document-open:focus-visible{background:var(--blue);color:var(--ivory)}
.text-link:hover,.small-link:hover,.top-link:hover,.hero-foot>a:hover,.footer-nav>a:hover,
.footer-bottom>a:hover,.viewer-toolbar>a:hover,.detail-sidebar>a:hover,.admin-sidebar>a:hover,
.collection-index>a:hover,.admin-document a:hover{ text-decoration:underline;text-underline-offset:5px;text-decoration-thickness:1.5px }
.path-card:hover h3,.path-card:focus-visible h3,.company-card:hover h3,.company-card:focus-visible h3{text-decoration:underline;text-underline-offset:6px;text-decoration-thickness:1.5px}
@media(max-width:600px){.document-open{font-size:11px;padding:8px 11px}}
`;
