import { lock } from './lock-unlock';
import { useRichText, getDomPositionKey } from './hook';
import { useFormatTypes, selectFormatTypeProps } from './hook/use-format-types';
import {
	KeyboardShortcutContext,
	InputEventContext,
	FormatTypesContext,
} from './contexts';
import { RichTextShortcut } from './keyboard-shortcut';
import { RichTextInputEvent } from './input-event';
import { shortcutsListener, inputEventsListener } from './event-listeners';
import { ownsSelection } from './owns-selection';
import { subscribeOwnedListener } from './subscribe-owned-listener';

/**
 * Private `@wordpress/rich-text` APIs.
 */
export const privateApis = {};
lock( privateApis, {
	useRichText,
	getDomPositionKey,
	useFormatTypes,
	selectFormatTypeProps,
	KeyboardShortcutContext,
	InputEventContext,
	FormatTypesContext,
	RichTextShortcut,
	RichTextInputEvent,
	shortcutsListener,
	inputEventsListener,
	ownsSelection,
	subscribeOwnedListener,
} );
