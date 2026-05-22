/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useMediaEditor } from '../state';

/**
 * Data attribute applied to crop control wrappers. The modal's keyboard
 * shortcut handler uses this to distinguish crop controls (where custom
 * undo/redo should fire) from metadata text fields (where the browser's
 * native undo should be preserved).
 */
export const CROP_CONTROL_ATTR = 'data-crop-control';

/** Idle window used to group repeated keyboard input into one gesture. */
const KEYBOARD_GESTURE_IDLE_MS = 300;

export interface UseCropGestureHandlersOptions {
	/**
	 * When `true` (default), key-up closes the gesture so each
	 * discrete keypress becomes its own undo step. Set to `false` for
	 * continuous-input controls (e.g. the rotation ruler) where rapid
	 * keypresses should coalesce into a single history entry across
	 * the whole gesture.
	 */
	commitOnKeyUp?: boolean;
}

/**
 * Event handler props to spread onto a wrapper element around a crop
 * control. Marks the wrapper as a crop control (via `data-crop-control`)
 * so the modal's Cmd+Z handler can identify it, and wires gesture
 * boundaries on the composite store so a slider drag becomes a single
 * undo entry rather than one per tick.
 *
 * Usage:
 *   const gestureHandlers = useCropGestureHandlers();
 *   <div role="presentation" { ...gestureHandlers }>
 *     <RangeControl ... />
 *   </div>
 *
 * @param options Optional behavior flags.
 */
export function useCropGestureHandlers(
	options: UseCropGestureHandlersOptions = {}
) {
	const { commitOnKeyUp = true } = options;
	const { beginGesture, endGesture } = useMediaEditor();
	const keyboardTimerRef = useRef< ReturnType< typeof setTimeout > >();

	const clearKeyboardTimer = useCallback( () => {
		clearTimeout( keyboardTimerRef.current );
	}, [] );

	const scheduleKeyboardEnd = useCallback( () => {
		clearKeyboardTimer();
		keyboardTimerRef.current = setTimeout( () => {
			endGesture();
		}, KEYBOARD_GESTURE_IDLE_MS );
	}, [ clearKeyboardTimer, endGesture ] );

	useEffect( () => clearKeyboardTimer, [ clearKeyboardTimer ] );

	const handlePointerDownCapture = useCallback( () => {
		clearKeyboardTimer();
		beginGesture();
	}, [ beginGesture, clearKeyboardTimer ] );

	const handlePointerEnd = useCallback( () => {
		clearKeyboardTimer();
		endGesture();
	}, [ clearKeyboardTimer, endGesture ] );

	const handleKeyDownCapture = useCallback( () => {
		beginGesture();
		if ( ! commitOnKeyUp ) {
			scheduleKeyboardEnd();
		}
	}, [ beginGesture, commitOnKeyUp, scheduleKeyboardEnd ] );

	const handleKeyUp = useCallback( () => {
		if ( commitOnKeyUp ) {
			endGesture();
			return;
		}
		scheduleKeyboardEnd();
	}, [ commitOnKeyUp, endGesture, scheduleKeyboardEnd ] );

	return {
		[ CROP_CONTROL_ATTR ]: true,
		onPointerDownCapture: handlePointerDownCapture,
		onPointerUp: handlePointerEnd,
		onPointerCancel: handlePointerEnd,
		onKeyDownCapture: handleKeyDownCapture,
		onKeyUp: handleKeyUp,
	};
}
