import { privateApis as composePrivateApis } from '@wordpress/compose';
import * as beforeInputRules from './before-input-rules';
import * as inputRules from './input-rules';
import * as insertReplacementText from './insert-replacement-text';
import * as removeBrowserShortcuts from './remove-browser-shortcuts';
import * as shortcuts from './shortcuts';
import * as inputEvents from './input-events';
import * as pasteHandler from './paste-handler';
import * as dragAndDrop from './drag-and-drop';
import * as deleteHandler from './delete';
import * as enter from './enter';
import * as firefoxCompat from './firefox-compat';
import { unlock } from '../../../lock-unlock';
import type { RichTextEventListenerProps } from '../types';

const { useDelegatedListeners } = unlock( composePrivateApis );

// Text can be dropped on any field. After the writing flow's drop handler on
// document capture, which inserts dropped blocks, and before the block drop
// zones.
const root = {
	dragenter: { target: [ pasteHandler.onDragOver ] },
	dragover: { target: [ pasteHandler.onDragOver ] },
	drop: { target: [ pasteHandler.onDrop ] },
};

// Only the selected field handles editing events.
const selectedListeners = {
	// After the rich text package's handlers, which are added first and sync
	// the record with the DOM, and before any other handler, so the writing
	// flow and the block handlers that skip prevented events give way to them.
	first: {
		keydown: {
			selection: [
				removeBrowserShortcuts.onKeyDown,
				shortcuts.onKeyDown,
			],
		},
		beforeinput: {
			selection: [ beforeInputRules.onBeforeInput, enter.onBeforeInput ],
		},
		input: { selection: [ inputRules.onInput ] },
		compositionend: { selection: [ inputRules.onInput ] },
		// Before the block's own drag start handler, which cancels the drags
		// it does not carry.
		dragstart: { selection: [ dragAndDrop.onDragStart ] },
		focus: { target: [ firefoxCompat.onFocus ] },
	},
	default: {
		keydown: { selection: [ deleteHandler.onKeyDown ] },
		beforeinput: {
			selection: [
				insertReplacementText.onBeforeInput,
				enter.onDefaultBeforeInput,
			],
		},
		input: { selection: [ inputEvents.onInput ] },
		paste: { selection: [ pasteHandler.onPaste ] },
	},
	root,
};

const listeners = { root };

export function useEventListeners( props: RichTextEventListenerProps ) {
	return useDelegatedListeners(
		props.isSelected ? selectedListeners : listeners,
		props
	);
}
