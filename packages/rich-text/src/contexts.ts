import { createContext } from '@wordpress/element';
import type { EventCallbacksSet } from './event-listeners';
import type { FormatType } from './types';

/**
 * Holds a Set of keyboard shortcut callbacks registered by format types (via
 * `RichTextShortcut`). The rich text field that owns the editable element
 * provides the Set and dispatches the callbacks on `keydown`. Outside a field,
 * callbacks go to a default Set that nothing dispatches.
 */
export const KeyboardShortcutContext = createContext<
	EventCallbacksSet< KeyboardEvent >
>( new Set() );
KeyboardShortcutContext.displayName = 'KeyboardShortcutContext';

/**
 * Holds a Set of `InputEvent` callbacks registered by format types (via
 * `RichTextInputEvent`). The rich text field that owns the editable element
 * provides the Set and dispatches the callbacks on `input`. Outside a field,
 * callbacks go to a default Set that nothing dispatches.
 */
export const InputEventContext = createContext<
	EventCallbacksSet< InputEvent >
>( new Set() );
InputEventContext.displayName = 'InputEventContext';

/**
 * Holds the format types an editor offers its fields, so the editor selects
 * them once instead of every field subscribing. Without a provider, a field
 * reads the registered format types when it renders.
 */
export const FormatTypesContext = createContext< FormatType[] | undefined >(
	undefined
);
FormatTypesContext.displayName = 'FormatTypesContext';
