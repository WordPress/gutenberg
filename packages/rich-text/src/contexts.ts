import { createContext } from '@wordpress/element';
import type { EventCallbacksSet } from './event-listeners';

/**
 * Holds a Set of keyboard shortcut callbacks registered by format types (via
 * `RichTextShortcut`). The rich text field that owns the editable element
 * provides the Set and dispatches the callbacks on `keydown`.
 */
export const KeyboardShortcutContext = createContext<
	EventCallbacksSet< KeyboardEvent > | undefined
>( undefined );
KeyboardShortcutContext.displayName = 'KeyboardShortcutContext';

/**
 * Holds a Set of `InputEvent` callbacks registered by format types (via
 * `RichTextInputEvent`). The rich text field that owns the editable element
 * provides the Set and dispatches the callbacks on `input`.
 */
export const InputEventContext = createContext<
	EventCallbacksSet< InputEvent > | undefined
>( undefined );
InputEventContext.displayName = 'InputEventContext';
