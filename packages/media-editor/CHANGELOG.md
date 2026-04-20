<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Experimental

-   Added a `MediaEditorModal` component (private) and a `core/media-editor` data store (private) for in-place attachment editing via a modal. Gated behind the `gutenberg-media-editor-modal` experiment. Consumers wire into the modal via a new `onEditMedia` block editor setting rather than importing from this package directly.
