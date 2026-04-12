# UploadProgressSnackbar

`UploadProgressSnackbar` renders a persistent snackbar in the editor chrome while media uploads are in progress. It shows a progress bar, a `completed / total` count, and either the active filename (single upload) or an "Uploading N files" label (batch). The snackbar disappears automatically when the upload queue drains.

The component subscribes directly to `@wordpress/upload-media`'s public selectors and bypasses the notices store so that it can render a live-updating `ProgressBar` as a child of `Snackbar`.

It is gated by the `window.__clientSideMediaProcessing` runtime flag. When the flag is off or the queue is empty, the component returns `null`.

## Usage

```jsx
import { UploadProgressSnackbar } from '@wordpress/editor';

// Mount as a sibling to the other snackbar notice list in the editor layout.
<>
	<SnackbarNotices className="edit-post-layout__snackbar" />
	<UploadProgressSnackbar />
</>
```

## Accessibility

-   The component calls `wp.a11y.speak()` once when uploads start and once when they complete, avoiding per-tick chatter.
-   The progress readout is wrapped in a `role="status" aria-live="polite"` live region.
-   The `ProgressBar` has a descriptive `aria-label`.
