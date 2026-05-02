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
 * so the modal's Cmd+Z handler can identify it, and wires up immediate-flush
 * signals on pointer-up and key-up so history is committed as soon as the
 * user releases rather than waiting for the debounce window to expire.
 *
 * The history entry itself is recorded by the state-change debounce in
 * `useCropperState` — no explicit gesture-start signal is needed.
 *
 * Usage:
 *   const gestureHandlers = useCropGestureHandlers();
 *   <div role="presentation" { ...gestureHandlers }>
 *     <RangeControl ... />
 *   </div>
 */
export function useCropGestureHandlers() {
	const { commitHistory } = useCropper();
	return {
		[ CROP_CONTROL_ATTR ]: true,
		onPointerUp: commitHistory,
		onKeyUp: commitHistory,
	};
}
