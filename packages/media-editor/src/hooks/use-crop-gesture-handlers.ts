import { useCallback, useEffect, useRef } from '@wordpress/element';
import { useMediaEditor } from '../state';

/**
 * Data attribute applied to crop control wrappers, marking the region a
 * pointer or keyboard gesture belongs to so repeated input inside it
 * coalesces into one history entry.
 */
export const CROP_CONTROL_ATTR = 'data-crop-control';

/**
 * Input types the browser keeps its own undo stack for.
 *
 * A range slider is an `<input>` too, but there is no typed text to
 * restore, so Ctrl/Cmd+Z on one should undo the image edit it drives.
 */
const TEXT_ENTRY_INPUT_TYPES = new Set( [
	'email',
	'number',
	'password',
	'search',
	'tel',
	'text',
	'url',
] );

/**
 * Whether Ctrl/Cmd+Z on this element means "undo my typing".
 *
 * The editor's undo shortcut moves through the image edit history, which
 * is right everywhere except a field someone is typing into — there, the
 * browser's own undo has to win, or a keystroke correction silently
 * reverts a crop instead.
 *
 * Being inside a crop control region makes no difference: the Crop
 * panel's scale fields are text entry and sit inside one, while the fine
 * rotation slider is not text entry and also sits inside one. The
 * element decides, not where it lives.
 *
 * @param target The element the key event fired on.
 * @return Whether the browser's undo should handle the shortcut.
 */
export function isTextEntryField( target: HTMLElement ): boolean {
	if ( target.isContentEditable || target.tagName === 'TEXTAREA' ) {
		return true;
	}
	return (
		target.tagName === 'INPUT' &&
		TEXT_ENTRY_INPUT_TYPES.has( ( target as HTMLInputElement ).type )
	);
}

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
