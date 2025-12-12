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
import { findBlockByClientIdInDoc } from './crdt';
import type { WPBlockSelection, WPSelection } from '../types';

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

/**
 * This class is used to track recent block selections to help in restoring
 * a user's selection after an undo or redo operation.
 *
 * Maintains a history array for previous selections, which can be used for
 * backup restoration locations.
 */
export class BlockSelectionHistory {
	private historySize: number;
	private history: YFullSelection[] = [];
	private ydoc: Y.Doc;

	constructor(
		ydoc: Y.Doc,
		historySize: number = SELECTION_HISTORY_DEFAULT_SIZE
	) {
		this.ydoc = ydoc;
		this.historySize = historySize;
		this.history = [];
	}

	/**
	 * Update the selection history with a new selection.
	 * @param newSelection
	 */
	public updateSelection( newSelection: WPSelection ): void {
		if (
			! newSelection?.selectionStart?.clientId ||
			! newSelection?.selectionEnd?.clientId
		) {
			return;
		}

		const { selectionStart, selectionEnd } = newSelection;
		const start = this.convertWPBlockSelectionToSelection( selectionStart );
		const end = this.convertWPBlockSelectionToSelection( selectionEnd );

		this.addToHistory( { start, end } );
	}

	/**
	 * Get the current selection (most recent selection in the current block).
	 */
	public getCurrentSelection(): YFullSelection | null {
		return this.history[ 0 ] ?? null;
	}

	/**
	 * Get the block history (previous blocks only, not current or last selection).
	 */
	public getSelectionHistory(): YFullSelection[] {
		return this.history.slice( 1, this.historySize + 1 );
	}

	/**
	 * Add a selection to the history, maintaining only the last `historySize` unique selections.
	 * New selections are added to the front.
	 * Removes any existing entries with the same start and end block combination.
	 * @param yFullSelection
	 */
	private addToHistory( yFullSelection: YFullSelection ): void {
		// Remove any existing entries with the same start and end block combination
		const startClientId = yFullSelection.start.clientId;
		const endClientId = yFullSelection.end.clientId;

		this.history = this.history.filter( ( entry ) => {
			const isSameBlockCombination =
				entry.start.clientId === startClientId &&
				entry.end.clientId === endClientId;

			return ! isSameBlockCombination;
		} );

		// Add the new selection to the front
		this.history.unshift( yFullSelection );

		// Trim to max size (remove oldest entries from the back)
		if ( this.history.length > this.historySize + 1 ) {
			this.history = this.history.slice( 0, this.historySize + 1 );
		}
	}

	/**
	 * Convert a WPBlockSelection to a YSelection.
	 * @param selection
	 * @return A YSelection object.
	 */
	private convertWPBlockSelectionToSelection(
		selection: WPBlockSelection
	): YSelection {
		const clientId = selection.clientId;
		const block = findBlockByClientIdInDoc( clientId, this.ydoc );
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
}
