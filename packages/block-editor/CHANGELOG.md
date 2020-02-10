## Master

### New Features

- Add new `__experimentalEditorSkeleton` component. This has been moved over from the `@wordpress/edit-post` package, where it was an internal component called `EditorRegions`. Its class names have thus been renamed from `edit-post-editor-regions` to `block-editor-editor-skeleton`.

## 3.3.0 (2019-11-14)

### New Features

- Added a `label` prop to `URLInput`. This allows the label to be set without needing to wrap the `URLInput` in a `BaseControl`.

### Deprecation

- `dropZoneUIOnly` prop in `MediaPlaceholder` component has been deprecated in favor of `disableMediaButtons` prop.

## 3.0.0 (2019-08-05)

### New Features

- Added a new `allowedFormats` prop to `RichText` to fine tune allowed formats. Deprecated the `formattingControls` prop in favour of this. Also added a `withoutInteractiveFormatting` to specifically disable format types that would insert interactive elements, which can not be nested.

### Breaking Changes

- `BlockEditorProvider` no longer renders a wrapping `SlotFillProvider` or `DropZoneProvider` (from `@wordpress/components`). For custom block editors, you should render your own as wrapping the `BlockEditorProvider`. A future release will include a new `BlockEditor` component for simple, standard usage. `BlockEditorProvider` will serve the simple purpose of establishing its own context for block editors.

## 2.2.0 (2019-06-12)

### Internal

- Refactored `BlockSettingsMenu` to use `DropdownMenu` from `@wordpress/components`.

## 2.0.0 (2019-04-16)

### New Features

- Added the `addToGallery` property to the `MediaUpload` interface. The property allows users to open the media modal in the `gallery-library`instead of `gallery-edit` state.
- Added the `addToGallery` property to the `MediaPlaceholder` component. The component passes the property to the `MediaUpload` component used inside the placeholder.
- Added the `isAppender` property to the `MediaPlaceholder` component. The property changes the look of the placeholder to be adequate to scenarios where new files are added to an already existing set of files, e.g., adding files to a gallery.
- Added the `dropZoneUIOnly` property to the `MediaPlaceholder` component. The property makes the `MediaPlaceholder` only render a dropzone without any other additional UI.
- Added a cancel link to the list of buttons in the `MediaPlaceholder` component which appears if an `onCancel` handler exists.
- Added the usage of `mediaPreview` for the `Placeholder` component to the `MediaPlaceholder` component.
- Added a an `onDoubleClick` event handler to the `MediaPlaceholder` component.
- Added a way to pass special `ref` property to the `PlainText` component.
- The `URLPopover` component now passes through all unhandled props to the underlying Popover component.

### Breaking Changes

- `CopyHandler` will now only catch cut/copy events coming from its `props.children`, instead of from anywhere in the `document`.

### Internal

- Improved handling of blocks state references for unchanging states.
- Updated handling of blocks state to effectively ignored programmatically-received blocks data (e.g. reusable blocks received from editor).

## 1.0.0 (2019-03-06)

### New Features

- Initial version.
