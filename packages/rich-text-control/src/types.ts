/**
 * External dependencies
 */
import type { MutableRefObject } from 'react';

/*
 * Format types register their keyboard shortcut and input event callbacks
 * into these Sets via the contexts the control provides (see
 * `KeyboardShortcutContext` / `InputEventContext` in `@wordpress/rich-text`).
 * The control dispatches them from its own element event listeners.
 */
export type EventListenersProps = {
	keyboardShortcuts: MutableRefObject<
		Set< ( event: KeyboardEvent ) => void >
	>;
	inputEvents: MutableRefObject< Set< ( event: Event ) => void > >;
};
