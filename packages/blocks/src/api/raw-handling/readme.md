# Raw Handling (Paste)

This folder contains all paste specific logic (filters, converters, normalisers...). Each module is tested on their own, and in addition we have some integration tests for frequently used editors.

## Support table

| Source           | Formatting | Headings | Lists | Image | Separator | Table | Footnotes, endnotes |
| ---------------- | ---------- | -------- | ----- | ----- | --------- | ----- | ------------------- |
| Google Docs      | ✓          | ✓        | ✓     | ✓     | ✓         | ✓     | ✘ [1]               |
| Apple Pages      | ✓          | ✘ [2]    | ✓     | ✘ [2] | n/a       | ✓     | ✘ [1]               |
| MS Word          | ✓          | ✓        | ✓     | ✘ [3] | n/a       | ✓     | ✓                   |
| MS Word Online   | ✓          | ✘ [4]    | ✓     | ✓     | n/a       | ✓     | ✘ [1]               |
| LibreOffice      | ✓          | ✓        | ✓     | ✘ [3] | ✓         | ✓     | ✓                   |
| Evernote         | ✓          | ✘ [5]    | ✓     | ✓     | ✓         | ✓     | n/a                 |
| Markdown         | ✓          | ✓        | ✓     | ✓     | ✓         | ✓     | n/a                 |
| Legacy WordPress | ✓          | ✓        | ✓     | … [6] | ✓         | ✓     | n/a                 |
| Web              | ✓          | ✓        | ✓     | ✓     | ✓         | ✓     | n/a                 |

1. Google Docs, Apple Pages and MS Word online don't pass footnote nor endnote information.
2. Apple Pages does not pass heading and image information.
3. MS Word and LibreOffice only provide a local file path, which cannot be accessed in JavaScript for security reasons. Image placeholders will be provided instead. Single images, however, _can_ be copied and pasted without any problem.
4. Still to do for MS Word Online.
5. Evernote does not have headings.
6. For caption and gallery shortcodes, see #2874.

## Other notable capabilities

-   Filters out analytics trackers in the form of images.
-   Pasting a single images (if the browser provides image data).
