# Media Editor Session

The media editor's session owns its undo and redo history. The cropper's state from `@wordpress/image-cropper` is one slice of the session's state, next to the sidebar crop options and named edits, kept through `useCropperController( { state, onChange } )`, so one history covers them all.

`useMediaEditorState()` returns the media editor session. The session owns the source image, every editing slice, the shared undo/redo history, gesture boundaries, and whether the edits change the saved image (`hasOutputEdits`). The cropper is one participant: `session.cropper` is a geometry-only `CropperController` that a `<Cropper>` takes via its `controller` prop, and its `isDirty` covers geometry alone. Replacing the source image (`setSourceImage`, which the cropper's `setImage` also calls) starts a fresh session with default geometry and crop options, a clean baseline, and no history. Save code asks the session, not the cropper, whether image output needs saving.

The session also holds named edits other than crop: `session.edits`, set with `session.setEdit( name, value )` and removed by passing `undefined`. They share the crop history, so undo, redo and gestures treat them like any crop change, and a different source image clears them. Values are plain data (`EditValue`: strings, numbers, booleans, `null`, and arrays and objects of those), because the session compares them by content to tell a real change from a no-op. Edits do not yet count towards `hasOutputEdits`; nothing saves them.

`session.reset()` puts every slice back to its starting state in one undo entry: default geometry and crop options, no edits, same image. The Reset button calls it; it does not compose per-slice resets itself.

## Use the Session With a Cropper

Use the media editor session when cropper state must share history with controls such as aspect ratio. The session owns history and gesture boundaries; pass its `cropper` controller to `<Cropper>`.

```tsx
import { Cropper } from '@wordpress/image-cropper';
import { useMediaEditor } from '../state';

function MediaEditorCanvas( { src }: { src: string } ) {
	const session = useMediaEditor();

	return (
		<Cropper
			src={ src }
			controller={ session.cropper }
			freeformCrop
			onGestureStart={ session.beginGesture }
			onGestureEnd={ session.endGesture }
		/>
	);
}
```
