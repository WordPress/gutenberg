/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { useRichText } from './hook';
import { KeyboardShortcutContext, InputEventContext } from './contexts';
import { RichTextShortcut } from './keyboard-shortcut';
import { RichTextInputEvent } from './input-event';

/**
 * Private @wordpress/rich-text APIs.
 */
export const privateApis = {};
lock( privateApis, {
	useRichText,
	KeyboardShortcutContext,
	InputEventContext,
	RichTextShortcut,
	RichTextInputEvent,
} );
