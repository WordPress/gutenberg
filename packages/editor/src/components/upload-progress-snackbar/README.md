# UploadProgressSnackbar

`UploadProgressSnackbar` manages a snackbar notice that shows media upload progress. It creates and updates a notice via the notices store, so the snackbar positions and stacks with every other snackbar in the editor.

Only counts original user-uploaded files (items without a `parentId`), ignoring generated subsizes and thumbnails.

The component renders nothing itself — it is a controller that manages a notice. It is gated by the `window.__clientSideMediaProcessing` runtime flag.

## Usage

```jsx
import { UploadProgressSnackbar } from '@wordpress/editor';

// Mount anywhere in the editor — it doesn't render DOM, just manages a notice.
<UploadProgressSnackbar />
```

## Accessibility

-   The component calls `wp.a11y.speak()` once when uploads start and once when they complete, avoiding per-tick chatter.
-   The snackbar is created with `speak: false` to prevent the notices store from re-announcing on every text update.
