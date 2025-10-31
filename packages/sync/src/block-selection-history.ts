/**
 * WordPress dependencies
 */
import type { WPBlockSelection, WPSelection } from '@wordpress/block-editor';

/**
 * This class is used to track recent block selections to help in restoring
 * a user's selection after an undo or redo operation.
 *
 * Tracks the last N unique block selections. When a user moves between blocks,
 * this class maintains a history of fully-qualified selections (clientId, attributeKey, offset)
 * for each unique block visited, keeping only the most recent selection per block.
 */
export class BlockSelectionHistory {
	private historySize: number;
	private history: WPSelection[] = [];

	constructor( historySize: number = 5 ) {
		this.historySize = historySize;
		this.history = [];
	}

	/**
	 * Update the selection history with a new selection.
	 * If the selection is in the same block as the most recent one, it updates that entry.
	 * If it's in a new block, it adds a new entry to the history.
	 * @param newSelection
	 */
	public updateSelection( newSelection: WPSelection ): void {
		console.log( 'BlockSelectionHistory updateSelection():', newSelection );

		// Only track fully qualified selections
		if ( ! this.isFullSelection( newSelection ) ) {
			console.log( 'New selection is not qualified, skipping' );
			return;
		}

		const newClientId = newSelection.selectionStart.clientId;
		const currentSelection = this.getCurrentSelection();
		const isNewBlock =
			currentSelection?.selectionStart.clientId !== newClientId;

		if ( isNewBlock ) {
			console.log( 'New selection is in new block, adding to history' );
			this.addToHistory( newSelection );
		} else {
			console.log(
				'New selection is in same block, updating most recent'
			);
			this.updateMostRecent( newSelection );
		}

		console.log( '--- Selection history:' );
		console.log( 'newSelection:', newSelection?.selectionStart );
		for ( const selection of this.history ) {
			console.log( selection.selectionStart );
		}
		console.log( '---' );
	}

	/**
	 * Get the most recent selection (at the front of the history).
	 */
	public getCurrentSelection(): WPSelection | null {
		return this.history.length > 0 ? this.history[ 0 ] : null;
	}

	/**
	 * Get the second most recent selection from history
	 * (the last block before the current one).
	 */
	public getLastSelection(): WPSelection | null {
		return this.history.length > 1 ? this.history[ 1 ] : null;
	}

	/**
	 * Get the last N selections from history, excluding the current one.
	 * @param count Number of selections to retrieve
	 */
	public getLastSelections( count: number ): WPSelection[] {
		return this.history.slice( 1, count + 1 );
	}

	/**
	 * Check if a block selection has a defined clientID, attribute key, and offset.
	 * Used to ignore less-specific selections, like just a clientId.
	 * @param selection
	 */
	private isFullBlockSelection( selection?: WPBlockSelection ): boolean {
		return Boolean(
			selection &&
				selection.clientId &&
				selection.attributeKey &&
				selection.offset !== undefined
		);
	}

	/**
	 * Check if a selection has both start and end properly defined.
	 * @param selection
	 */
	private isFullSelection( selection?: WPSelection ): boolean {
		return Boolean(
			selection &&
				this.isFullBlockSelection( selection.selectionStart ) &&
				this.isFullBlockSelection( selection.selectionEnd )
		);
	}

	/**
	 * Add a selection to the history, maintaining only the last N unique blocks.
	 * New selections are added to the front, and if a block already exists, it's removed first.
	 * @param selection
	 */
	private addToHistory( selection: WPSelection ): void {
		const clientId = selection.selectionStart.clientId;

		// Remove any existing entry for this block
		this.history = this.history.filter(
			( s ) => s.selectionStart.clientId !== clientId
		);

		// Add the new selection to the front
		this.history.unshift( selection );

		// Trim to max size (remove oldest entries from the back)
		if ( this.history.length > this.historySize ) {
			this.history = this.history.slice( 0, this.historySize );
		}
	}

	/**
	 * Update the most recent selection in the history.
	 * @param selection
	 */
	private updateMostRecent( selection: WPSelection ): void {
		if ( this.history.length > 0 ) {
			this.history[ 0 ] = selection;
		} else {
			this.history.unshift( selection );
		}
	}
}
