/**
 * WordPress dependencies
 */
import { select, subscribe } from '@wordpress/data';
import { Y } from '@wordpress/sync';
// @ts-ignore No exported types for block editor store selectors.
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { LOCAL_CURSOR_UPDATE_DEBOUNCE_IN_MS } from '../config';
import { CRDT_RECORD_MAP_KEY } from '../../sync';
import { SelectionType } from '../../utils/crdt-user-selections';
import { getRootMap } from '../../utils/crdt-utils';

import { SelectionDirection } from '../../types';
import type { SelectionState } from '../../types';
import type { YPostRecord } from '../../utils/crdt';

/**
 * Creates a subscription to title selection changes from the block-editor store.
 *
 * Debounces before creating Y.RelativePositions so that the Y.Text has time
 * to reflect the corresponding content change (which propagates via
 * mergeRichTextUpdate slightly after the selection change).
 *
 * @param doc               - The Yjs document for creating relative positions.
 * @param onSelectionChange - Callback invoked with the new SelectionState after debounce.
 * @return An object with an unsubscribe method to tear down the subscription.
 */
export function createTitleSelectionSubscription(
	doc: Y.Doc,
	onSelectionChange: ( selectionState: SelectionState ) => void
): { unsubscribe: () => void } {
	let prevTitleSelection: {
		start: number | null;
		end: number | null;
	} | null = null;

	let localCursorTimeout: NodeJS.Timeout | null = null;

	const unsubscribeFromStore = subscribe( () => {
		const { getTitleSelection } = select( blockEditorStore );
		const titleSelection = getTitleSelection();

		if ( titleSelection === prevTitleSelection ) {
			return;
		}
		const prev = prevTitleSelection;
		prevTitleSelection = titleSelection ?? null;

		// Cancel any pending debounce to prevent it from overwriting
		// this title selection.
		if ( localCursorTimeout ) {
			clearTimeout( localCursorTimeout );
			localCursorTimeout = null;
		}

		if (
			! titleSelection ||
			titleSelection.start === null ||
			typeof titleSelection.start !== 'number'
		) {
			// Title selection cleared or invalid — the block subscription
			// will pick up any new block selection, so do nothing here.
			return;
		}

		// Debounce: when the user types, the selection change fires
		// before the Y.Text content update (which goes through
		// mergeRichTextUpdate). Creating a Y.RelativePosition against
		// stale text produces an off-by-one. The short delay lets the
		// Y.Text update settle first.
		localCursorTimeout = setTimeout( () => {
			const ymap = getRootMap< YPostRecord >( doc, CRDT_RECORD_MAP_KEY );
			const titleYText = ymap.get( 'title' );

			if ( ! ( titleYText instanceof Y.Text ) ) {
				return;
			}

			const { start, end } = titleSelection;

			let selectionState: SelectionState;

			if ( end === null || start === end ) {
				// Cursor only.
				const relativePosition = Y.createRelativePositionFromTypeIndex(
					titleYText,
					start
				);
				selectionState = {
					type: SelectionType.Title,
					cursorPosition: {
						relativePosition,
						absoluteOffset: start,
					},
				};
			} else {
				// Text selection in title.
				const startRelPos = Y.createRelativePositionFromTypeIndex(
					titleYText,
					start
				);
				const endRelPos = Y.createRelativePositionFromTypeIndex(
					titleYText,
					end
				);

				const selectionDirection = detectTitleSelectionDirection(
					prev,
					titleSelection
				);

				selectionState = {
					type: SelectionType.Title,
					cursorPosition: {
						relativePosition: startRelPos,
						absoluteOffset: start,
					},
					cursorEndPosition: {
						relativePosition: endRelPos,
						absoluteOffset: end,
					},
					selectionDirection,
				};
			}

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
 * Detect the direction of a title selection change by comparing which edge
 * moved relative to the previous selection.
 *
 * @param prev       - The previous title selection offsets, or null.
 * @param next       - The new title selection offsets.
 * @param next.start
 * @param next.end
 * @return The detected direction, defaulting to Forward when indeterminate.
 */
function detectTitleSelectionDirection(
	prev: { start: number | null; end: number | null } | null,
	next: { start: number | null; end: number | null }
): SelectionDirection {
	if ( prev && prev.start !== null && prev.end !== null ) {
		const startMoved = prev.start !== next.start;
		const endMoved = prev.end !== next.end;

		if ( startMoved && ! endMoved ) {
			return SelectionDirection.Backward;
		}
	}

	return SelectionDirection.Forward;
}
