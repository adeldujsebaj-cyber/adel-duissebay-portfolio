# Complete artifact library

Artifacts now presents every file returned by the existing portfolio document loader, including administrator uploads and the two supplied PDFs. It does not depend on attachment record IDs starting with ART. Current files remain connected to their weekly, assignment, research, capstone or declaration records, and new uploads or deletions appear automatically.

The initial collection has 16 file entries across five portfolio sections and three formats. Repeated copies remain accessible in their original records. Titles and summaries for the reviewed files are based on their actual content; an edited record title takes precedence. New or unreviewed uploads use their own file names and do not inherit a reviewed file's description or page count. File cards include the original name, format, size, page/slide counts where known, preview and download links, and original-record context. Only the supplied capstone PDF uses the actual slide-one image as its preview.

The page provides server-rendered text search, section filters, format filters, result counts and an empty-results state. Files whose record no longer exists remain visible under Additional Documents. The original Word and PowerPoint downloads and the existing PDF/image/video preview flows are preserved. The home page's Artifacts description now reflects the complete collection.

The responsive layout follows the existing navy, royal blue, champagne gold and ivory palette. Document covers are typographic, rather than invented scans of the student work. Functional checks cover all-file inclusion, preview/download links, combined filters, automatic upload/deletion updates, original-record retention, uncategorized files and HTML escaping. The full 22-test suite passes. The stylesheet parses without warnings. Browser control is unavailable in this environment, so visual browser verification was not performed.

## Declaration update

The supplied one-page AI declaration adds one file entry to the complete collection. Its current-file badge follows the same newest-PDF selection as the declaration page. The earlier supplied form remains available. Page and slide labels use singular nouns for one-page files.
