/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { findBlockByClientIdInDoc } from './crdt-utils';
import type { WPBlockSelection, WPSelection } from '../types';

// Default size for selection history (not including current selection)
const SELECTION_HISTORY_DEFAULT_SIZE = 5;

export enum YSelectionType {
	RelativeSelection = 'RelativeSelection',
	BlockSelection = 'BlockSelection',
}

export interface YRelativeSelection {
	type: YSelectionType.RelativeSelection;
	attributeKey: string;
	relativePosition: Y.RelativePosition;
	clientId: string;
	offset: number;
}

export interface YBlockSelection {
	type: YSelectionType.BlockSelection;
	clientId: string;
}

export type YSelection = YRelativeSelection | YBlockSelection;

export type YFullSelection = {
	start: YSelection;
	end: YSelection;
};

export interface YSelectionHistory {
	selection: YFullSelection;
	backupSelections?: YFullSelection[];
}

export interface BlockSelectionHistory {
	getSelectionHistory: () => YFullSelection[];
	updateSelection: ( newSelection: WPSelection ) => void;
}

/**
 * This function is used to track recent block selections to help in restoring
 * a user's selection after an undo or redo operation.
 *
 * Maintains a history array for previous selections, which can be used for
 * backup restoration locations.
 * @param ydoc
 * @param historySize
 */
export function createBlockSelectionHistory(
	ydoc: Y.Doc,
	historySize: number = SELECTION_HISTORY_DEFAULT_SIZE
): BlockSelectionHistory {
	let history: YFullSelection[] = [];

	/**
	 * Get the block history including current selection.
	 */
	const getSelectionHistory = (): YFullSelection[] => {
		return history.slice( 0 );
	};

	/**
	 * Update the selection history with a new selection.
	 * @param newSelection
	 */
	const updateSelection = ( newSelection: WPSelection ): void => {
		if (
			! newSelection?.selectionStart?.clientId ||
			! newSelection?.selectionEnd?.clientId
		) {
			return;
		}

		const { selectionStart, selectionEnd } = newSelection;
		const start = convertWPBlockSelectionToSelection(
			selectionStart,
			ydoc
		);
		const end = convertWPBlockSelectionToSelection( selectionEnd, ydoc );

		addToHistory( { start, end } );
	};

	/**
	 * Add a selection to the history, maintaining only the last `historySize` unique selections.
	 * New selections are added to the front.
	 * Removes any existing entries with the same start and end block combination.
	 * @param yFullSelection
	 */
	const addToHistory = ( yFullSelection: YFullSelection ): void => {
		// Remove any existing entries with the same start and end block combination
		const startClientId = yFullSelection.start.clientId;
		const endClientId = yFullSelection.end.clientId;

		history = history.filter( ( entry ) => {
			const isSameBlockCombination =
				entry.start.clientId === startClientId &&
				entry.end.clientId === endClientId;

			return ! isSameBlockCombination;
		} );

		// Add the new selection to the front
		history.unshift( yFullSelection );

		// Trim to max size (remove oldest entries from the back)
		if ( history.length > historySize + 1 ) {
			history = history.slice( 0, historySize + 1 );
		}
	};

	return {
		getSelectionHistory,
		updateSelection,
	};
}

/**
 * Convert a WPBlockSelection to a YSelection.
 * @param selection
 * @param ydoc
 * @return A YSelection object.
 */
function convertWPBlockSelectionToSelection(
	selection: WPBlockSelection,
	ydoc: Y.Doc
): YSelection {
	const clientId = selection.clientId;
	const block = findBlockByClientIdInDoc( clientId, ydoc );
	const attributes = block?.get( 'attributes' );
	const attributeKey = selection.attributeKey;

	const changedYText = attributeKey
		? attributes?.get( attributeKey )
		: undefined;

	const isYText = changedYText instanceof Y.Text;
	const isFullyDefinedSelection = attributeKey && clientId;

	if ( ! isYText || ! isFullyDefinedSelection ) {
		// We either don't have a valid YText (it's been deleted) or we've
		// been passed a selection that's just a block clientId.
		// Store as BlockSelection.
		return {
			type: YSelectionType.BlockSelection,
			clientId,
		};
	}

	const offset = selection.offset ?? 0;
	const relativePosition = Y.createRelativePositionFromTypeIndex(
		changedYText,
		offset
	);

	return {
		type: YSelectionType.RelativeSelection,
		attributeKey,
		relativePosition,
		clientId,
		offset,
	};
}
