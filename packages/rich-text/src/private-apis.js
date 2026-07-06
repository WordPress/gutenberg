/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { useRichText } from './hook';
import { keyboardShortcutContext, inputEventContext } from './contexts';
import { RichTextShortcut } from './keyboard-shortcut';
import { RichTextInputEvent } from './input-event';
import { shortcutsListener, inputEventsListener } from './event-listeners';

/**
 * Private @wordpress/rich-text APIs.
 */
export const privateApis = {};
lock( privateApis, {
	useRichText,
	keyboardShortcutContext,
	inputEventContext,
	RichTextShortcut,
	RichTextInputEvent,
	shortcutsListener,
	inputEventsListener,
} );
