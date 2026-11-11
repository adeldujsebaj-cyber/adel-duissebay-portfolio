# Evidence reference collection

Source review completed on 10 November 2026. The live D1 document table contained 14 uploads; the two supplied, preserved PDF assets also remain available. There are 16 file placements, 13 distinct document byte sequences and 15 portfolio records represented. Fourteen records contain explicit external citations or named internal evidence references. W2 contains no bibliography.

The collection contains **29 resource entries**, including incomplete source groups, exact publications and named student works. This is not a count of independently verified publications. There are 56 citation placements; repeated use of a resource does not create another resource card. No source from the visual reference has been imported.

## Extraction and provenance

PDF text was reviewed page by page with `pdftotext -layout`; PDF URL annotations were inspected with `pdfinfo -url` (none present). Word paragraphs, tables and external relationships were read from the DOCX archive. All nine PowerPoint slides and external relationships were read from the PPTX archive. Word and PowerPoint contained no additional external hyperlink relationships. Original file bytes are retained.

The current uploaded AI form has the same SHA-256 as the supplied PDF. The W7 and A3 files are identical, as are W6 and the Research attachment. Each distinct file was reviewed once and connected to every place where it is uploaded.

| Record | File | Reference location |
| --- | --- | --- |
| AI | AI-Use_Declaration_Form.pdf | pp. 1–2, sections B–E (no end bibliography) |
| W4 | Freedom_Bank_Week_4.pdf | p. 1, introductory status note (A1, W2) |
| A4 | DUYSEBAY_2603_BA2026_A4_Essay_UPDATED.pdf | p. 3 [1]–[7], plus in-text W4/W8/W9 |
| W5 | Freedom_Bank_Week_5.pdf | p. 1, Evidence and verification notes (A1, W2) |
| W6 | Freedom_Bank_Week6_Updated_Segmentation_NPD(1).docx | section E [1]–[2] |
| W8 | DUYSEBAY_2603_Week8_Financial_Audit(1).pdf | p. 2, section G [1]–[3] |
| W7 | A3_Week7_AI_Workflow_Risk_Register.pdf | p. 2, section 6 (two sources) |
| A3 | A3_Week7_AI_Workflow_Risk_Register.pdf | identical to W7 |
| W9 | DUYSEBAY_2603_Week9_Capability_Portfolio.pdf | p. 3, section G (five items) |
| W3 | Weekly_Report_3_Ownership_Entrepreneurship_Bank_of_America_Freedom.pdf | p. 1, III. References [1]–[4] |
| A1 | Assignment_1_Banks_FIXED.pptx | slide 9 (four broad source groups) |
| W1 | Weekly_Report_1_Economic_Systems_Bank_of_America_Freedom_Bank_.pdf | p. 2, V. Evidence [1]–[4] |
| W2 | Duisebay%20Adel%20weekly%20report%202.pdf | No bibliography or source URL |
| RESEARCH | Freedom_Bank_Week6_Updated_Segmentation_NPD(1).docx | identical to W6 |
| CAPSTONE | Freedom_Bank_AI_Capstone_Clean_Adel_Duissebay.pdf | slide 16 [1]–[8] and numbered in-slide references |

## Unresolved citation details

- W1 credits NBK for a statistics source but prints stat.gov.kz, the Bureau of National Statistics domain. Its Freedom digital-services source prints freedom-bank.kz, rather than the verified bankffin.kz domain. Both original citations are preserved with notes.
- OpenStax is labelled “2e, 2018” in the early reports and “2nd ed., 2026” in A4. The publisher lists Introduction to Business with a 19 September 2018 publication date. Assigned edition still requires confirmation.
- The W7/A3 Erica link ends in `.html.html`. The official 20 August 2025 release was located by title/date; a working publisher destination is shown alongside the untouched original citation text.
- Several annual-report entries provide only company homepages, unspecified years or placeholders. The 2024–2025 Freedom/KASE entry and 2025 Bank of America/Erica entry combine different publications. No exact report pages or financial figures have been certified by this extraction.
- W8 contains pending numerical inputs, while the capstone/declaration describe figures as verified. The collection records that provenance gap; it does not resolve it by inventing a missing report.
- The AI form attributes a −20% target to Week 5 Design; the uploaded W5 file defines the KPI but does not contain that numerical target.
- A1 course materials and the A4 brief are named but not supplied. W4/W5 name an A1 comparative report/defence; the available A1 upload is a related slide deck, not proof that every named component exists.

## Publisher destinations

Direct records for WEF 2025, OECD Employment Outlook 2023 and ILO Working Paper 96 were located on their publishers' websites. OpenStax chapters 4 and 5 were checked against the named chapters. Official company/institution homepages and the Bank of America report archive are explicitly labelled as starting points when the original reference lacks a specific document. These links do not imply a completed financial or regulatory audit.

## Runtime behavior

`worker/evidence-data.js` preserves the extracted citations, locations and SHA-256 review manifest. `worker/evidence.js` joins citations only to reviewed file IDs still present in the document library. New uploads are marked awaiting source review; file-name similarity is never treated as proof of having reviewed their contents. Replacing/deleting a document cannot silently carry its reviewed status to new bytes under a new ID.

The reference collection supports server-rendered search, category counts, work filters, original-citation details, citation copying and page-aware PDF links. The Original files tab preserves preview/download and document-category search. The owner dashboard edits resource titles, publisher labels, descriptions, notes and destination links via authenticated, same-origin PUT requests; original extracted quotations and provenance remain attached. Existing identity, declaration, uploads, MOV support and deletion remain available.

Verification: Worker integration tests cover extraction mappings/counts, duplicate review accounting, category/work/text filtering, empty results, pending uploads, removed-file behavior, protected persisted resource edits, HTML escaping and bounded PDF-page links. Styles were parsed with esbuild without warnings. The shared browser-control tool is unavailable, so visual browser QA was not performed.

## Latest declaration revision

The newly supplied one-page PDF is now included in the reviewed manifest. The reviewed set therefore contains 17 file placements and 14 distinct document byte sequences. Additional uploads remain marked as awaiting review. It has no bibliography or source URLs, so the 29-resource catalogue and its 56 historical citation placements are unchanged. Its review uses a separate citation work key, preventing the earlier AI form's references from being attributed to this revision. See declaration-pdf-update.md for the document checksum and PDF-only presentation.
