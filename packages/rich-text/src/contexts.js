/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Holds a ref to a Set of keyboard shortcut callbacks registered by format
 * types (via `RichTextShortcut`). The rich text field that owns the editable
 * element provides the ref and dispatches the callbacks on `keydown`.
 */
export const keyboardShortcutContext = createContext();
keyboardShortcutContext.displayName = 'keyboardShortcutContext';

/**
 * Holds a ref to a Set of `InputEvent` callbacks registered by format types
 * (via `RichTextInputEvent`). The rich text field that owns the editable
 * element provides the ref and dispatches the callbacks on `input`.
 */
export const inputEventContext = createContext();
inputEventContext.displayName = 'inputEventContext';
