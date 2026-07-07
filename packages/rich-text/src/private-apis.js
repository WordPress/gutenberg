/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { useRichText } from './hook';
import { RichTextEventsProvider } from './events';
import { useRichTextShortcut } from './use-rich-text-shortcut';
import { useRichTextInputEvent } from './use-rich-text-input-event';

/**
 * Private @wordpress/rich-text APIs.
 */
export const privateApis = {};
lock( privateApis, {
	useRichText,
	RichTextEventsProvider,
	useRichTextShortcut,
	useRichTextInputEvent,
} );
