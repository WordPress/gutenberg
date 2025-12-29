# Raw Handling (Paste)

This folder contains all paste specific logic (filters, converters, normalisers...). Each module is tested on their own, and in addition we have some integration tests for frequently used editors.

## Support table

| Source           | Formatting | Headings | Lists | Image | Separator | Table | Footnotes, endnotes |
| ---------------- | ---------- | -------- | ----- | ----- | --------- | ----- | ------------------- |
| Google Docs      | ✓          | ✓        | ✓     | ✓     | ✓         | ✓     | ✘ [1]               |
| Apple Pages      | ✓          | ✘ [2]    | ✓     | ✘ [2] | n/a       | ✓     | ✘ [1]               |
| MS Word          | ✓          | ✓        | ✓     | ✓     | n/a       | ✓     | ✓                   |
| MS Word Online   | ✓          | ✓        | ✓     | ✓     | n/a       | ✓     | ✘ [1]               |
| LibreOffice      | ✓          | ✓        | ✓     | ✘ [3] | ✓         | ✓     | ✓                   |
| Evernote         | ✓          | ✘ [4]    | ✓     | ✓     | ✓         | ✓     | n/a                 |
| Markdown         | ✓          | ✓        | ✓     | ✓     | ✓         | ✓     | n/a                 |
| Legacy WordPress | ✓          | ✓        | ✓     | … [5] | ✓         | ✓     | n/a                 |
| Web              | ✓          | ✓        | ✓     | ✓     | ✓         | ✓     | n/a                 |

1. Google Docs, Apple Pages and MS Word online don't pass footnote nor endnote information.
2. Apple Pages does not pass heading and image information.
3. LibreOffice only provide a local file path, which cannot be accessed in JavaScript for security reasons. Image placeholders will be provided instead. Single images, however, _can_ be copied and pasted without any problem.
4. Evernote does not have headings.
5. For caption and gallery shortcodes, see #2874.

## Other notable capabilities

-   Filters out analytics trackers in the form of images.
-   Pasting a single images (if the browser provides image data).
