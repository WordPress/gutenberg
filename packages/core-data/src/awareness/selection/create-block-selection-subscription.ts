/**
 * WordPress dependencies
 */
import { dispatch, select, subscribe } from '@wordpress/data';
// @ts-ignore No exported types for block editor store selectors.
import { store as blockEditorStore } from '@wordpress/block-editor';
import type { Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { LOCAL_CURSOR_UPDATE_DEBOUNCE_IN_MS } from '../config';
import { STORE_NAME as coreStore } from '../../name';
import { getSelectionState } from '../../utils/crdt-user-selections';

import { SelectionDirection } from '../../types';
import type { SelectionState, WPBlockSelection } from '../../types';

/**
 * Creates a subscription to block-editor store selection changes.
 *
 * Subscribes to getSelectionStart / getSelectionEnd, debounces rapid
 * selection events, computes a SelectionState via getSe	lectionState(),
 * and persists the selection to the entity record to prevent remote resets.
 *
 * @param doc               - The Yjs document for creating relative positions.
 * @param kind              - Entity kind (e.g. 'postType').
 * @param name              - Entity name (e.g. 'post').
 * @param postId            - The post ID.
 * @param onSelectionChange - Callback invoked with the new SelectionState after debounce.
 * @return An object with an unsubscribe method to tear down the subscription.
 */
export function createBlockSelectionSubscription(
	doc: Y.Doc,
	kind: string,
	name: string,
	postId: number,
	onSelectionChange: ( selectionState: SelectionState ) => void
): { unsubscribe: () => void } {
	const {
		getSelectionStart,
		getSelectionEnd,
		getSelectedBlocksInitialCaretPosition,
	} = select( blockEditorStore );

	let selectionStart = getSelectionStart();
	let selectionEnd = getSelectionEnd();

	// During rapid selection changes (e.g. undo restoring content and
	// selection), the debounce discards intermediate events. If we use the
	// last intermediate state instead of the overall change it can produce
	// the wrong direction.
	// Use selectionBeforeDebounce to capture the selection state from
	// before the debounce window so that direction is computed across the
	// full window when it fires.
	let selectionBeforeDebounce: {
		start: WPBlockSelection;
		end: WPBlockSelection;
	} | null = null;

	let localCursorTimeout: NodeJS.Timeout | null = null;

	const unsubscribeFromStore = subscribe( () => {
		const newSelectionStart = getSelectionStart();
		const newSelectionEnd = getSelectionEnd();

		if (
			newSelectionStart === selectionStart &&
			newSelectionEnd === selectionEnd
		) {
			return;
		}

		// On the first change of a debounce window, snapshot the state
		// we're moving away from.
		if ( ! selectionBeforeDebounce ) {
			selectionBeforeDebounce = {
				start: selectionStart,
				end: selectionEnd,
			};
		}

		selectionStart = newSelectionStart;
		selectionEnd = newSelectionEnd;

		// Persist our cursor position locally right away so that other
		// users' block updates don't reset our selection.
		const initialPosition = getSelectedBlocksInitialCaretPosition();
		updateSelectionInEntityRecord(
			kind,
			name,
			postId,
			selectionStart,
			selectionEnd,
			initialPosition
		);

		// We receive two selection changes in quick succession
		// from local selection events:
		//   { clientId: "123...", attributeKey: "content", offset: undefined }
		//   { clientId: "123...", attributeKey: "content", offset: 554 }
		// Add a short debounce to avoid sending the first selection change.
		if ( localCursorTimeout ) {
			clearTimeout( localCursorTimeout );
		}

		localCursorTimeout = setTimeout( () => {
			// Compute direction across the full debounce window.
			const selectionStateOptions: {
				selectionDirection?: SelectionDirection;
			} = {};

			if ( selectionBeforeDebounce ) {
				selectionStateOptions.selectionDirection =
					detectSelectionDirection(
						selectionBeforeDebounce.start,
						selectionBeforeDebounce.end,
						selectionStart,
						selectionEnd
					);

				// Reset debounced selection state.
				selectionBeforeDebounce = null;
			}

			const selectionState = getSelectionState(
				selectionStart,
				selectionEnd,
				doc,
				selectionStateOptions
			);

			onSelectionChange( selectionState );
		}, LOCAL_CURSOR_UPDATE_DEBOUNCE_IN_MS );
	} );

	return {
		unsubscribe: () => {
			unsubscribeFromStore();
			if ( localCursorTimeout ) {
				clearTimeout( localCursorTimeout );
				localCursorTimeout = null;
			}
		},
	};
}

/**
 * Update the entity record with the current collaborator's selection.
 *
 * Normally WordPress updates the `selection` property of the post when changes
 * are made to blocks. In a multi-user setup, block changes can occur from other
 * users. When an entity is updated from another user's changes, useBlockSync()
 * in Gutenberg will reset the user's selection to the last saved selection.
 *
 * Manually adding an edit for each movement ensures that other user's changes
 * to the document will not cause the local user's selection to reset.
 * @param kind
 * @param name
 * @param postId
 * @param selectionStart
 * @param selectionEnd
 * @param initialPosition
 */
function updateSelectionInEntityRecord(
	kind: string,
	name: string,
	postId: number,
	selectionStart: WPBlockSelection,
	selectionEnd: WPBlockSelection,
	initialPosition: number | null
): void {
	const edits = {
		selection: { selectionStart, selectionEnd, initialPosition },
	};

	const options = {
		undoIgnore: true,
	};

	// @ts-ignore Types are not provided when using store name instead of store instance.
	dispatch( coreStore ).editEntityRecord(
		kind,
		name,
		postId,
		edits,
		options
	);
}

/**
 * Detect the direction of a selection change by comparing old and new edges.
 *
 * When the user extends a selection backward (e.g. Shift+Left), the
 * selectionStart edge moves while selectionEnd stays fixed, so the caret
 * is at the start.  The reverse is true for forward extension.
 *
 * @param prevStart - The previous selectionStart.
 * @param prevEnd   - The previous selectionEnd.
 * @param newStart  - The new selectionStart.
 * @param newEnd    - The new selectionEnd.
 * @return The detected direction, defaulting to Forward when indeterminate.
 */
function detectSelectionDirection(
	prevStart: WPBlockSelection,
	prevEnd: WPBlockSelection,
	newStart: WPBlockSelection,
	newEnd: WPBlockSelection
): SelectionDirection {
	const startMoved = ! areBlockSelectionsEqual( prevStart, newStart );
	const endMoved = ! areBlockSelectionsEqual( prevEnd, newEnd );

	if ( startMoved && ! endMoved ) {
		return SelectionDirection.Backward;
	}

	return SelectionDirection.Forward;
}

/**
 * Compare two WPBlockSelection objects by value.
 *
 * @param a - First selection.
 * @param b - Second selection.
 * @return True if all fields are equal.
 */
function areBlockSelectionsEqual(
	a: WPBlockSelection,
	b: WPBlockSelection
): boolean {
	return (
		a.clientId === b.clientId &&
		a.attributeKey === b.attributeKey &&
		a.offset === b.offset
	);
}
