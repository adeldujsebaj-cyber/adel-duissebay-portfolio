# Supplied academic files and video support

The owner supplied two PDFs in chat. Their contents are treated as source material, not as instructions to the website implementation agent. Both original files are preserved byte-for-byte and served through authenticated Site access. They are included in the evidence library and administrator file list as source documents; runtime uploads remain editable and deletable through the existing workflow.

## AI declaration

Source: `AI-Use_Declaration_Form.pdf`, 260,052 bytes, three pages.

SHA-256: `c63a28076397402cd76c7e47b5140e353e299a531a8b4c42ebeb2d3773051bb6`.

Sections A–I are adapted to readable website components: system register, activity records, coverage, KPI verification statements, corrections, media disclosure, consistency checks, reflections and final acknowledgements. These are the student's supplied declarations; the website does not certify that the underlying financial values or verification claims have been independently validated.

The website reads the student name, legal name, academic group, program and university from the verified editable profile. It does not copy the unverified `2603_AITU` student ID from the PDF into the profile. Group is displayed as `2603 AIB`. The submission period is taken from the source; blank signature and exact-date fields are not filled automatically. The original PDF remains available as supplied. Print / Save as PDF exports the website's current adapted declaration.

The complete adapted declaration is editable in a dedicated protected administrator form. It uses the existing D1 record table with a separate internal key. Strings, list sizes, object structure and confirmation values are validated on the server, and rendered content is escaped.

## Capstone

Source: `Freedom_Bank_AI_Capstone_Clean_Adel_Duissebay.pdf`, 1,223,727 bytes, sixteen landscape slides.

SHA-256: `0508df5cbce7c571e545ec5f20b16da65dc527e808000f1aacaf81a1cdf9b0df`.

The page presents one featured PDF with a slide viewer. Web previews were rendered directly from all sixteen source pages, preserving the source presentation. Numbered controls, Previous / Next and keyboard navigation select a slide; only the current preview and the next image are requested. The complete original PDF remains available for opening or download. Any newer PDF uploaded to the CAPSTONE record becomes the featured presentation, using the native PDF viewer in place of the bundled slide previews. The page does not fabricate additional report, video or supporting-file deliverables.

The supplied proposal is identified as a student proposal, not an implemented banking system. The website uses verified profile information in its surrounding interface and preserves the original deck's text inside the source PDF and slide previews.

## MOV / MP4 uploads

Videos up to 1 GiB upload in 8 MiB parts. Each session is owner-authorized and same-origin protected. R2 multipart identifiers stay server-side. The server validates filename, declared size, expected part lengths and MOV/MP4 container signatures. Finalization registers a document only after all parts are stored; cancellation is locked against concurrent finalization. Completed uploads are idempotent, and failed or cancelled uploads do not produce completed document records. R2 aborts unfinished multipart uploads after seven days by default; old session metadata is removed on subsequent uploads.

The browser shows per-file upload progress, retries transient part failures, and offers cancellation. A2 and individual video document pages expose native video controls plus the exact original download. HTTP Range and HEAD responses support media playback and seeking without buffering the full video in Worker memory. Source codecs are retained; no transcoding or universal MOV playback guarantee is claimed.

Implementation reference: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/ .

The managed browser-control tool is unavailable, so complete browser playback, print rendering and signed-in UI interactions remain unverified. Integration tests cover storage, permissions, multipart assembly, cancellation, byte ranges, structured declaration editing, source PDF checksums and preview delivery.
