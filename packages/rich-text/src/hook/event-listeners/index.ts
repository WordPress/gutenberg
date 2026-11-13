import { useRef, useInsertionEffect } from '@wordpress/element';
import * as copyHandler from './copy-handler';
import * as selectObject from './select-object';
import * as formatBoundaries from './format-boundaries';
import * as deleteHandler from './delete';
import * as inputAndSelection from './input-and-selection';
import * as selectionChangeCompat from './selection-change-compat';
import type { EventListenerProps } from '../types';

// Run before any other handler (window capture), so the handlers after them
// see a record in sync with the DOM, and so they can stop those handlers.
const first = {
	// The native `selectionchange` event is asynchronous and coalesced: the
	// record and the store selection can be one selection behind the DOM when
	// an event that acts on them arrives, regardless of how the selection got
	// there. When a focused editing host owns the element's selection, there
	// are not even focus events to catch up on entry, and handlers that act
	// on the selected block only attach once the store selects it.
	// Synchronize on capture of the events that consume the record,
	// the store selection, or a value rendered from them, before any other
	// handler runs. The snapshot comparison in `handleSelectionChange` skips
	// selections that have already been processed.
	keydown: {
		selection: [
			inputAndSelection.handleSelectionChange,
			formatBoundaries.onKeyDown,
		],
		target: [ selectionChangeCompat.onDown ],
	},
	beforeinput: { selection: [ inputAndSelection.handleSelectionChange ] },
	copy: { selection: [ inputAndSelection.handleSelectionChange ] },
	cut: { selection: [ inputAndSelection.handleSelectionChange ] },
	paste: { selection: [ inputAndSelection.handleSelectionChange ] },
	// `input` and `compositionend` must run before block-editor's
	// `input-rules.js` element-level listeners, which call `getValue()`
	// reading `record.current` updated by our `onInput`. Use capture phase
	// so we fire before any ancestor bubble handlers.
	input: { selection: [ inputAndSelection.onInput ] },
	compositionstart: { selection: [ inputAndSelection.onCompositionStart ] },
	compositionend: { selection: [ inputAndSelection.onCompositionEnd ] },
	selectionchange: { selection: [ inputAndSelection.handleSelectionChange ] },
	focusin: { target: [ inputAndSelection.onFocus, selectObject.onFocusIn ] },
	pointerdown: {
		target: [
			inputAndSelection.onPointerDown,
			selectionChangeCompat.onDown,
		],
	},
};

// Run after all other handlers (window bubble), like the browser's default
// action, so any other handler can prevent them.
const defaults = {
	beforeinput: { selection: [ deleteHandler.onBeforeInput ] },
	copy: { selection: [ copyHandler.onCopy ] },
	cut: { selection: [ copyHandler.onCopy ] },
	click: { target: [ selectObject.onClick ] },
};

// Each mounted field adds these handlers instead of its own listeners.
export const listeners = { first, default: defaults };

// The latest props, for the listeners to read when an event arrives.
export function useEventListenerProps( props: EventListenerProps ) {
	const propsRef = useRef( props );
	useInsertionEffect( () => {
		propsRef.current = props;
	} );
	return propsRef;
}
