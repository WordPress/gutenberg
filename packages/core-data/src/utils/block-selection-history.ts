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

export const SELECTION_HISTORY_DEFAULT_SIZE = 5;

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
 * Maintains currentSelection for the current block, and a history array for
 * previous blocks. These properties are useful for different things:
 *
 * - currentSelection: The most recent selection in the current block. This is updated
 *                     before any undo stack operations are processed.
 * - history: An array of previous blocks. Use this as a backup for restoration
 *            locations.
 */
export class BlockSelectionHistory {
	private historySize: number;
	private history: YFullSelection[] = [];
	private currentSelection: YFullSelection | null = null;
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
	 * Convert a WPSelection to a Position (relative position or block position).
	 * @param selection
	 * @return Position or null if conversion fails
	 */
	private convertSelectionToPositionPart(
		selection: WPBlockSelection
	): YSelection {
		const clientId = selection.clientId;
		const block = findBlockByClientIdInDoc( clientId, this.ydoc );

		const attributes = block?.get( 'attributes' ) as
			| Y.Map< Y.Text >
			| undefined;

		const attributeKey = selection.attributeKey;

		const changedYText = attributeKey
			? attributes?.get( attributeKey )
			: undefined;

		const isYText = changedYText instanceof Y.Text;
		const isFullyDefinedPosition = attributeKey && clientId;

		if ( ! isYText || ! isFullyDefinedPosition ) {
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

	/**
	 * Update the selection history with a new selection.
	 * @param newSelection
	 */
	public updateSelection( newSelection: WPSelection ): void {
		if (
			! newSelection ||
			! newSelection.selectionStart?.clientId ||
			! newSelection.selectionEnd?.clientId
		) {
			return;
		}

		const { selectionStart, selectionEnd } = newSelection;
		const start = this.convertSelectionToPositionPart( selectionStart );
		const end = this.convertSelectionToPositionPart( selectionEnd );

		const ySelection: YFullSelection = {
			start,
			end,
		};

		// Check if the new selection has the same start and end block combination as current
		const isSameBlockCombination =
			this.currentSelection &&
			start.clientId === this.currentSelection.start.clientId &&
			end.clientId === this.currentSelection.end.clientId;

		if ( this.currentSelection && ! isSameBlockCombination ) {
			// Only add to history if we're moving to a different block combination
			this.addToHistory( this.currentSelection );
		}

		this.currentSelection = ySelection;

		console.log( '--- Updated selection history:' );
		const currentSelection = this.getCurrentSelection();
		const selectionHistory = this.getSelectionHistory(
			SELECTION_HISTORY_DEFAULT_SIZE
		);

		console.log( 'Current selection:', currentSelection );
		console.log( 'Selection history:', selectionHistory );
	}

	/**
	 * Get the current position (most recent selection in the current block).
	 */
	public getCurrentSelection(): YFullSelection | null {
		return this.currentSelection;
	}

	/**
	 * Get the block history (previous blocks only, not current or last selection).
	 * @param count Number of positions to retrieve
	 */
	public getSelectionHistory( count: number ): YFullSelection[] {
		return this.history.slice( 0, count );
	}

	/**
	 * Add a position to the history, maintaining only the last `historySize` unique selections.
	 * New positions are added to the front.
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

		// Add the new position to the front
		this.history.unshift( yFullSelection );

		// Trim to max size (remove oldest entries from the back)
		if ( this.history.length > this.historySize ) {
			this.history = this.history.slice( 0, this.historySize );
		}
	}
}
