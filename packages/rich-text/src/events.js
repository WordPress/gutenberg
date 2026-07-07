/**
 * WordPress dependencies
 */
import { createContext, useMemo, useRef } from '@wordpress/element';

/**
 * Holds a ref to a Set of keyboard shortcut callbacks registered by format
 * types (via `useRichTextShortcut`). The rich text field that owns the
 * editable element dispatches the callbacks on `keydown`.
 */
export const KeyboardShortcutContext = createContext();
KeyboardShortcutContext.displayName = 'KeyboardShortcutContext';

/**
 * Holds a ref to a Set of `InputEvent` callbacks registered by format types
 * (via `useRichTextInputEvent`). The rich text field that owns the editable
 * element dispatches the callbacks on `input`.
 */
export const InputEventContext = createContext();
InputEventContext.displayName = 'InputEventContext';

/**
 * Creates the callback registries for the keyboard shortcuts and input events
 * of a rich text field. `useRichText` dispatches the registered callbacks on
 * `keydown` and `input`. Render `RichTextEventsProvider` with the returned
 * object around the UI that registers the callbacks.
 *
 * @return {Object} An `events` object to pass to `RichTextEventsProvider`.
 */
export function useEventCallbacks() {
	const keyboardShortcuts = useRef( new Set() );
	const inputEvents = useRef( new Set() );
	return useMemo( () => ( { keyboardShortcuts, inputEvents } ), [] );
}

/**
 * Provides the contexts consumed by `useRichTextShortcut` and
 * `useRichTextInputEvent` so that descendants (e.g. format type edit
 * components) can register callbacks with the rich text field that owns
 * `events`.
 *
 * @param {Object}  props
 * @param {Object}  props.events   The `events` object returned by
 *                                 `useRichText`.
 * @param {Element} props.children
 */
export function RichTextEventsProvider( { events, children } ) {
	return (
		<KeyboardShortcutContext.Provider value={ events.keyboardShortcuts }>
			<InputEventContext.Provider value={ events.inputEvents }>
				{ children }
			</InputEventContext.Provider>
		</KeyboardShortcutContext.Provider>
	);
}
