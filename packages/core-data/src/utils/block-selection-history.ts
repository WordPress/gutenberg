/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */
import { CRDT_RECORD_MAP_KEY, Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { getRootMap } from './crdt-utils';
import type { YPostRecord } from './crdt';
import type { WPSelection } from '../types';
import type { YBlock, YBlocks } from './crdt-blocks';

export enum PositionType {
	RelativeSelection = 'RelativeSelection',
	BlockSelection = 'BlockSelection',
}

export interface RelativePosition {
	type: PositionType.RelativeSelection;
	attributeKey: string;
	relativePosition: Y.RelativePosition;
	clientId: string;
	offset: number;
}

export interface BlockPosition {
	type: PositionType.BlockSelection;
	clientId: string;
}

export type Position = RelativePosition | BlockPosition;

// Convenience types to manage block values with a clientId, attributes, and innerBlocks.
type BlockClientId = string;
type BlockAttributes = Y.Map< Y.Text >;
type BlockInnerBlocks = Y.Array< SelectableBlock >;
export type SelectableBlock = Y.Map<
	BlockClientId | BlockAttributes | BlockInnerBlocks
>;

function findBlockByClientIdInDoc(
	blockId: string,
	ydoc: Y.Doc
): YBlock | null {
	const ymap = getRootMap< YPostRecord >( ydoc, CRDT_RECORD_MAP_KEY );
	const blocks = ymap.get( 'blocks' );

	if ( ! ( blocks instanceof Y.Array ) ) {
		return null;
	}

	return findBlockByClientIdInBlocks( blockId, blocks );
}

function findBlockByClientIdInBlocks(
	blockId: string,
	blocks: YBlocks
): YBlock | null {
	for ( const block of blocks ) {
		if ( block.get( 'clientId' ) === blockId ) {
			return block;
		}

		const innerBlocks = block.get( 'innerBlocks' );

		if ( innerBlocks && innerBlocks.length > 0 ) {
			const innerBlock = findBlockByClientIdInBlocks(
				blockId,
				innerBlocks
			);

			if ( innerBlock ) {
				return innerBlock;
			}
		}
	}

	return null;
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
	private history: Position[] = [];
	private currentSelection: Position | null = null;
	private ydoc: Y.Doc;

	constructor( ydoc: Y.Doc, historySize: number = 10 ) {
		this.ydoc = ydoc;
		this.historySize = historySize;
		this.history = [];
	}

	/**
	 * Convert a WPSelection to a Position (relative position or block position).
	 * @param selection
	 * @return Position or null if conversion fails
	 */
	private convertSelectionToPosition(
		selection: WPSelection
	): Position | null {
		const clientId = selection.selectionStart.clientId;
		const block = findBlockByClientIdInDoc( clientId, this.ydoc );

		const attributes = block?.get( 'attributes' ) as
			| Y.Map< Y.Text >
			| undefined;

		const attributeKey = selection.selectionStart.attributeKey;

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
				type: PositionType.BlockSelection,
				clientId,
			};
		}

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

	/**
	 * Update the selection history with a new selection.
	 * If selection is in a new block, move currentSelection to history.
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
		const isNewBlock = this.currentSelection?.clientId !== newClientId;

		if ( isNewBlock ) {
			// Remove the new block from history if it already exists (we're revisiting it)
			this.history = this.history.filter(
				( p ) => p.clientId !== newClientId
			);

			// Moving to a new block: push current selection to history
			if ( this.currentSelection ) {
				this.addToHistory( this.currentSelection );
			}
		}

		this.currentSelection = position;
	}

	/**
	 * Get the current position (most recent selection in the current block).
	 */
	public getCurrentPosition(): Position | null {
		return this.currentSelection;
	}

	/**
	 * Get the block history (previous blocks only, not current or last selection).
	 * @param count Number of positions to retrieve
	 */
	public getBlockHistory( count: number ): Position[] {
		return this.history.slice( 0, count );
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
}
