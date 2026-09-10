# UploadProgressSnackbar

`UploadProgressSnackbar` manages a snackbar notice that shows media upload progress. It creates and updates a notice via the notices store, so the snackbar positions and stacks with every other snackbar in the editor.

The component reads from two sources so it works for both upload paths:

-   **`@wordpress/upload-media`** — the client-side media processing (CSM) path. Only counts original user-uploaded files, ignoring generated subsizes and thumbnails (items with a `parentId`).
-   **Editor-local tracker** — populated by the editor's `mediaUpload` wrapper for the traditional (non-CSM) upload path (e.g. Safari, or when a filter disables CSM).

While uploads are in progress the snackbar shows a spinner to the left of the text. When the last upload finishes, the spinner is replaced with a green checkmark for a brief moment before the snackbar dismisses.

Files leave both sources the same way whether they uploaded or failed, so each source also tallies its failures — `getFailureCount` on the upload-media store, and `getFailureCount` on the tracker. The snackbar records their sum when a batch starts and subtracts it when the batch ends, which tells it what to report:

-   Everything uploaded — "Upload complete", with the checkmark.
-   Some of it uploaded — "Uploaded 3 of 5", without the checkmark.
-   Nothing uploaded — no completion snackbar at all. The per-file errors already say what happened, so the progress notice is removed rather than replaced.

The component renders nothing itself — it is a controller that manages a notice.

## Usage

```jsx
import { UploadProgressSnackbar } from '@wordpress/editor';

// Mount anywhere in the editor — it doesn't render DOM, just manages a notice.
<UploadProgressSnackbar />
```

## Accessibility

-   The component calls `wp.a11y.speak()` once when uploads start and once when they end, avoiding per-tick chatter. What it announces at the end follows the same three cases as the snackbar text, so a batch that failed outright is announced as a failure rather than a completion.
-   The snackbar is created with `speak: false` to prevent the notices store from re-announcing on every text update.
