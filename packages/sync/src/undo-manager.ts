/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * WordPress dependencies
 */
import type { HistoryRecord } from '@wordpress/undo-manager';
import type { WPSelection } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { LOCAL_EDITOR_ORIGIN } from './config';
import { YMultiDocUndoManager } from './y-utilities/y-multidoc-undomanager';
import type { ObjectData, SyncUndoManager } from './types';
import { findBlockByClientIdInDoc } from './utils';
import { BlockSelectionHistory } from './block-selection-history';

interface StackItemEvent {
	stackItem: { meta: Map< any, any > };
	origin: any;
	type: 'undo' | 'redo';
	changedParentTypes: Map< Y.AbstractType< any >, Y.YEvent< any >[] >;
	ydoc: Y.Doc;
}

interface PositionMeta {
	attributeKey: string;
	relativePosition: Y.RelativePosition;
	clientId: string;
	offset: number;
	backupPositions?: PositionMeta[];
}

/**
 * Implementation of the WordPress UndoManager interface using YMultiDocUndoManager
 * internally. This allows undo/redo operations to be transacted against multiple
 * CRDT documents (one per entity) and giving each peer their own undo/redo stack
 * without conflicts.
 */
export function createUndoManager(): SyncUndoManager {
	let setSelection: (
		clientId: string,
		attributeKey: string,
		startOffset: number,
		endOffset: number
	) => void = () => {};
	const selectionHistory = new BlockSelectionHistory( 5 );

	const yUndoManager = new YMultiDocUndoManager( [], {
		// Throttle undo/redo captures.
		captureTimeout: 500,
		// Ensure that we only scope the undo/redo to the current editor.
		// The yjs document's clientID is added once it's available.
		trackedOrigins: new Set( [ LOCAL_EDITOR_ORIGIN ] ),
	} );

	const logStacks = ( message: string ) => {
		console.log( `--- [${ message }] logStacks():` );

		console.log( 'undoStack:' );
		const undoStack = yUndoManager.undoStack[ 0 ]?.undoStack;
		if ( undoStack ) {
			for ( const item of undoStack ) {
				console.log( item.meta.get( 'position' ), {
					item,
				} );
			}
		} else {
			console.log( '(none)' );
		}

		console.log( 'redoStack:' );
		const redoStack = yUndoManager.redoStack[ 0 ]?.redoStack;
		if ( redoStack ) {
			for ( const item of redoStack ) {
				console.log( item.meta.get( 'position' ), {
					item,
				} );
			}
		} else {
			console.log( '(none)' );
		}

		console.log( '---' );
	};

	// @ts-ignore
	window.logStacks = logStacks;

	function getPositionMetaForSelection(
		selection: WPSelection,
		ydoc: Y.Doc
	): PositionMeta | null {
		const clientId = selection.selectionStart.clientId;
		const block = findBlockByClientIdInDoc( clientId, ydoc );

		const attributes = block?.get( 'attributes' ) as
			| Y.Map< Y.Text >
			| undefined;

		let attributeKey = selection.selectionStart.attributeKey;

		if ( attributeKey === undefined ) {
			// When a new paragraph block is inserted via <Enter>, selectionStart
			// will only have a clientId but no attributeKey (like 'content').
			// In the event that we're unsure about the selected Y.Text, look in
			// block attributes for a 'content' key or Y.Text attribute.

			if ( attributes?.get( 'content' ) instanceof Y.Text ) {
				attributeKey = 'content';
			} else {
				attributes?.forEach( ( value, key ) => {
					if ( value instanceof Y.Text ) {
						attributeKey = key;
					}
				} );
			}
		}

		const changedYText = attributes?.get( attributeKey );

		if ( ! ( changedYText instanceof Y.Text ) ) {
			// Could not find the relevant YText in the document, skip bundling position
			console.log( 'Could not find relavant YText, doing nothing' );
			return null;
		}

		if ( attributeKey && clientId ) {
			const offset = selection.selectionStart?.offset ?? 0;
			const relativePosition = Y.createRelativePositionFromTypeIndex(
				changedYText,
				offset
			);

			return { attributeKey, relativePosition, clientId, offset };
		}

		return null;
	}

	function updatePositionMeta( event: StackItemEvent ): void {
		console.log( '--- updatePositionMeta()' );
		const currentSelection = selectionHistory.getCurrentSelection();

		if ( currentSelection === null ) {
			// If we don't have a selection, then don't save anything extra
			// to the stack.
			console.log( 'No currentSelection, doing nothing' );
			return;
		}

		if ( event.type === 'redo' ) {
			console.log( 'Procccesing redo event' );
		}

		const positionMeta = getPositionMetaForSelection(
			currentSelection,
			event.ydoc
		);

		if ( positionMeta ) {
			// Also store the last 3 selections as backup positions.
			positionMeta.backupPositions = [];
			for ( const selection of selectionHistory.getLastSelections( 3 ) ) {
				const backupPositionMeta = getPositionMetaForSelection(
					selection,
					event.ydoc
				);

				if ( backupPositionMeta ) {
					positionMeta.backupPositions?.push( backupPositionMeta );
				}
			}

			console.log( 'Setting relativePosition meta with:', positionMeta );
			event.stackItem.meta.set( 'position', positionMeta );
		} else {
			console.log( 'Could not set position meta:', {
				currentSelection,
			} );
		}
	}

	function restorePosition( event: StackItemEvent ): void {
		const { relativePosition, clientId, attributeKey } =
			event.stackItem.meta.get( 'position' ) ?? {};

		const yDocBlock = findBlockByClientIdInDoc( clientId, event.ydoc );

		if ( ! yDocBlock ) {
			const lastHistoricalSelection = selectionHistory.getLastSelection();
			if ( lastHistoricalSelection ) {
				const lastClientId =
					lastHistoricalSelection.selectionStart.clientId;
				const lastAttributeKey =
					lastHistoricalSelection.selectionStart.attributeKey;
				const lastOffset =
					lastHistoricalSelection.selectionStart.offset;

				console.log(
					'Restoring selection from last historical selection:',
					{
						lastClientId,
						lastAttributeKey,
						lastOffset,
					}
				);
				setSelection( clientId, attributeKey, lastOffset, lastOffset );
			} else {
				console.log( 'No historical selection, doing nothing' );
			}

			return;
		}

		if ( relativePosition && clientId && attributeKey ) {
			const absolutePosition =
				Y.createAbsolutePositionFromRelativePosition(
					relativePosition,
					event.ydoc
				);

			console.log( 'Got absolutePosition:', absolutePosition );

			if ( absolutePosition ) {
				console.log( 'Restoring selection:', {
					clientId,
					attributeKey,
					offset: absolutePosition.index,
				} );

				setSelection(
					clientId,
					attributeKey,
					absolutePosition.index,
					absolutePosition.index
				);
			}
		} else {
			console.log( 'Could not restore position:', {
				relativePosition,
				clientId,
				attributeKey,
			} );
		}
	}

	yUndoManager.on( 'stack-item-added', ( event: StackItemEvent ) => {
		updatePositionMeta( event );
	} );

	yUndoManager.on( 'stack-item-updated', ( event: StackItemEvent ) => {
		updatePositionMeta( event );
	} );

	yUndoManager.on( 'stack-item-popped', ( event: StackItemEvent ) => {
		restorePosition( event );
	} );

	return {
		/**
		 * Record changes into the history.
		 * Since Yjs automatically tracks changes, this method translates the WordPress
		 * HistoryRecord format into Yjs operations.
		 *
		 * @param _record   A record of changes to record.
		 * @param _isStaged Whether to immediately create an undo point or not.
		 */
		addRecord(
			_record?: HistoryRecord< ObjectData >,
			_isStaged = false // eslint-disable-line @typescript-eslint/no-unused-vars
		): void {
			// console.log( '--- addRecord():', {
			// 	_record,
			// 	_isStaged,
			// 	changes: _record?.[ 0 ]?.changes,
			// } );
			// This is a no-op for Yjs since it automatically tracks changes.
			// If needed, we could implement custom logic to handle specific records.
		},

		/**
		 * Add a Yjs map to the scope of the undo manager.
		 *
		 * @param {Y.Map< any >} ymap                                The Yjs map to add to the scope.
		 * @param                handlers
		 * @param                handlers.getSelection
		 * @param                handlers.setSelection
		 * @param                handlers.subscribeToSelectionChange
		 */
		addToScope(
			ymap: Y.Map< any >,
			handlers: {
				subscribeToSelectionChange: (
					callback: ( selection: WPSelection ) => void
				) => void;
				setSelection: (
					clientId: string,
					attributeKey: string,
					startOffset: number,
					endOffset: number
				) => void;
			}
		): void {
			yUndoManager.addToScope( ymap );

			handlers.subscribeToSelectionChange( ( newSelection ) => {
				selectionHistory.updateSelection( newSelection );
			} );

			setSelection = handlers.setSelection;
		},

		/**
		 * Undo the last recorded changes.
		 *
		 */
		undo(): HistoryRecord< ObjectData > | undefined {
			if ( ! yUndoManager.canUndo() ) {
				return;
			}

			logStacks( 'before undo' );

			// Perform the undo operation
			yUndoManager.undo();

			logStacks( 'after undo' );

			// Intentionally return an empty array, because the SyncProvider will update
			// the entity record based on the Yjs document changes.
			return [];
		},

		/**
		 * Redo the last undone changes.
		 */
		redo(): HistoryRecord< ObjectData > | undefined {
			if ( ! yUndoManager.canRedo() ) {
				return;
			}

			// Perform the redo operation
			yUndoManager.redo();

			// Intentionally return an empty array, because the SyncProvider will update
			// the entity record based on the Yjs document changes.
			return [];
		},

		/**
		 * Check if there are changes that can be undone.
		 *
		 * @return {boolean} Whether there are changes to undo.
		 */
		hasUndo(): boolean {
			return yUndoManager.canUndo();
		},

		/**
		 * Check if there are changes that can be redone.
		 *
		 * @return {boolean} Whether there are changes to redo.
		 */
		hasRedo(): boolean {
			return yUndoManager.canRedo();
		},
	};
}
