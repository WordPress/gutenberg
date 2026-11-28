# Media Editor Session

The media editor's session owns its undo and redo history. The image editor's state from `@wordpress/image-editor` is one slice of the session's state, next to the sidebar crop options and named edits, kept through `useImageEditor( { state, onChange } )`, so one history covers them all.

`useMediaEditorState()` creates a media editor session; `<MediaEditorStateProvider>` calls it, and `useMediaEditor()` reads the one it made. Calling `useMediaEditorState()` again inside the provider makes a second session that shares nothing with the first, so components use `useMediaEditor()`. The session owns the source image, every editing slice, the shared undo/redo history, gesture boundaries, and whether the edits change the saved image (`hasOutputEdits`). The image editor is one participant: `session.imageEditor` is a geometry-only `ImageEditorController` that an `<ImageEditorCanvas>` takes via its `controller` prop, and its `isDirty` covers geometry alone. Replacing the source image (`setSourceImage`, which the image editor's `setImage` also calls) starts a fresh session with default geometry and crop options, a clean baseline, and no history. Save code asks the session, not the image editor, whether image output needs saving.

The session also holds named edits other than crop: `session.edits`, set with `session.setEdit( name, value )` and removed by passing `undefined`. They share the crop history, so undo, redo and gestures treat them like any crop change, and a different source image clears them. Values are plain data (`EditValue`: strings, numbers, booleans, `null`, and arrays and objects of those), because the session compares them by content to tell a real change from a no-op. Edits do not yet count towards `hasOutputEdits`; nothing saves them.

`session.reset()` puts every slice back to its starting state in one undo entry: default geometry and crop options, no edits, same image. The Reset button calls it; it does not compose per-slice resets itself.

## Use the Session With the Canvas

Use the media editor session when image editor state must share history with controls such as aspect ratio. The session owns history and gesture boundaries; pass its `imageEditor` controller to `<ImageEditorCanvas>`.

```tsx
import { ImageEditorCanvas } from '@wordpress/image-editor';
import { useMediaEditor } from '../state';

function MediaEditorCanvas( { src }: { src: string } ) {
	const session = useMediaEditor();

	return (
		<ImageEditorCanvas
			src={ src }
			controller={ session.imageEditor }
			freeformCrop
			onGestureStart={ session.beginGesture }
			onGestureEnd={ session.endGesture }
		/>
	);
}
```
