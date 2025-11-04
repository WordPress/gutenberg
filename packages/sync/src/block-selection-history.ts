/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * WordPress dependencies
 */
import type { WPSelection } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import type { Position } from './types';
import { PositionType } from './types';
import { findBlockByClientIdInDoc } from './utils';

/**
 * This class is used to track recent block selections to help in restoring
 * a user's selection after an undo or redo operation.
 *
 * Tracks the last N unique block selections. When a user moves between blocks,
 * this class maintains a history of relative positions (or just clientIds for block selections)
 * for each unique block visited, keeping only the most recent selection per block.
 */
export class BlockSelectionHistory {
	private historySize: number;
	private history: Position[] = [];
	private ydoc: Y.Doc | null = null;

	constructor( historySize: number = 5 ) {
		this.historySize = historySize;
		this.history = [];
	}

	/**
	 * Set the Y.Doc to use for converting selections to relative positions.
	 * @param ydoc
	 */
	public setYDoc( ydoc: Y.Doc ): void {
		this.ydoc = ydoc;
	}

	/**
	 * Convert a WPSelection to a Position (relative position or block position).
	 * @param selection
	 * @return Position or null if conversion fails
	 */
	private convertSelectionToPosition(
		selection: WPSelection
	): Position | null {
		if ( ! this.ydoc ) {
			return null;
		}

		const clientId = selection.selectionStart.clientId;
		const block = findBlockByClientIdInDoc( clientId, this.ydoc );

		const attributes = block?.get( 'attributes' ) as
			| Y.Map< Y.Text >
			| undefined;

		const attributeKey = selection.selectionStart.attributeKey;

		const changedYText = attributeKey
			? attributes?.get( attributeKey )
			: undefined;

		if ( ! ( changedYText instanceof Y.Text ) ) {
			// Could not find the relevant YText in the document, store as block selection
			return {
				type: PositionType.BlockSelection,
				clientId,
			};
		}

		if ( attributeKey && clientId ) {
			const offset = selection.selectionStart?.offset ?? 0;
			const relativePosition = Y.createRelativePositionFromTypeIndex(
				changedYText,
				offset
			);

			return {
				type: PositionType.RelativeSelection,
				attributeKey,
				relativePosition,
				clientId,
				offset,
			};
		}

		return {
			type: PositionType.BlockSelection,
			clientId,
		};
	}

	/**
	 * Update the selection history with a new selection.
	 * If the selection is in the same block as the most recent one, it updates that entry.
	 * If it's in a new block, it adds a new entry to the history.
	 * @param newSelection
	 */
	public updateSelection( newSelection: WPSelection ): void {
		if ( ! newSelection || ! newSelection.selectionStart?.clientId ) {
			return;
		}

		const position = this.convertSelectionToPosition( newSelection );
		if ( ! position ) {
			return;
		}

		const newClientId = newSelection.selectionStart.clientId;
		const currentPosition = this.getCurrentPosition();
		const isNewBlock = currentPosition?.clientId !== newClientId;

		if ( isNewBlock ) {
			this.addToHistory( position );
		} else {
			this.updateMostRecent( position );
		}

		console.log( '--- Selection history:' );
		for ( const pos of this.history ) {
			console.log( pos );
		}
		console.log( '---' );
	}

	/**
	 * Get the most recent position (at the front of the history).
	 */
	public getCurrentPosition(): Position | null {
		return this.history.length > 0 ? this.history[ 0 ] : null;
	}

	/**
	 * Get the last N positions from history, excluding the current one.
	 * @param count Number of positions to retrieve
	 */
	public getPreviousPositions( count: number ): Position[] {
		return this.history.slice( 1, count + 1 );
	}

	/**
	 * Add a position to the history, maintaining only the last N unique blocks.
	 * New positions are added to the front, and if a block already exists, it's removed first.
	 * @param position
	 */
	private addToHistory( position: Position ): void {
		const clientId = position.clientId;

		// Remove any existing entry for this block
		this.history = this.history.filter( ( p ) => p.clientId !== clientId );

		// Add the new position to the front
		this.history.unshift( position );

		// Trim to max size (remove oldest entries from the back)
		if ( this.history.length > this.historySize ) {
			this.history = this.history.slice( 0, this.historySize );
		}
	}

	/**
	 * Update the most recent position in the history.
	 * @param position
	 */
	private updateMostRecent( position: Position ): void {
		if ( this.history.length > 0 ) {
			this.history[ 0 ] = position;
		} else {
			this.history.unshift( position );
		}
	}
}
