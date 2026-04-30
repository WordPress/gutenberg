/**
 * Internal dependencies
 */
import { useCropper } from '../image-editor';

/**
 * Data attribute applied to crop control wrappers. The modal's keyboard
 * shortcut handler uses this to distinguish crop controls (where custom
 * undo/redo should fire) from metadata text fields (where the browser's
 * native undo should be preserved).
 */
export const CROP_CONTROL_ATTR = 'data-crop-control';

/**
 * Returns event handler props to spread onto a wrapper element around a
 * crop control. Marks the wrapper as a crop control (via `data-crop-control`)
 * and wires up gesture boundaries so each interaction produces a single
 * undo history entry.
 *
 * `beginGesture` is idempotent — safe to call on every pointerdown/keydown
 * repeat without double-pushing history.
 *
 * Usage:
 *   const gestureHandlers = useCropGestureHandlers();
 *   <div role="presentation" { ...gestureHandlers }>
 *     <RangeControl ... />
 *   </div>
 */
export function useCropGestureHandlers() {
	const { beginGesture, commitHistory } = useCropper();
	return {
		[ CROP_CONTROL_ATTR ]: true,
		onPointerDown: beginGesture,
		onPointerUp: commitHistory,
		// Only begin a gesture for keys that change the control value
		// (arrow keys, etc.). Modifier-only keys and shortcuts like Cmd+Z
		// must not trigger beginGesture — doing so would push the current
		// state to history and corrupt the undo stack before the modal's
		// undo handler has a chance to fire.
		onKeyDown: ( event: React.KeyboardEvent ) => {
			if ( ! event.metaKey && ! event.ctrlKey && ! event.altKey ) {
				beginGesture();
			}
		},
		onKeyUp: commitHistory,
	};
}
