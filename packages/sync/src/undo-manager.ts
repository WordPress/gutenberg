/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * WordPress dependencies
 */
import type { HistoryRecord } from '@wordpress/undo-manager';
import { select, subscribe, dispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import type { WPBlockSelection, WPSelection } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { LOCAL_EDITOR_ORIGIN } from './config';
import { YMultiDocUndoManager } from './y-utilities/y-multidoc-undomanager';
import type { ObjectData, SyncUndoManager } from './types';
import { findBlockByClientIdInDoc } from './utils';

interface StackItemEvent {
	stackItem: { meta: Map< any, any > };
	origin: any;
	type: 'undo' | 'redo';
	changedParentTypes: Map< Y.AbstractType< any >, Y.YEvent< any >[] >;
	ydoc: Y.Doc;
}

/**
 * Implementation of the WordPress UndoManager interface using YMultiDocUndoManager
 * internally. This allows undo/redo operations to be transacted against multiple
 * CRDT documents (one per entity) and giving each peer their own undo/redo stack
 * without conflicts.
 */
export function createUndoManager(): SyncUndoManager {
	const selectionTracker = new SelectionTracker();

	const yUndoManager = new YMultiDocUndoManager( [], {
		// Throttle undo/redo captures.
		captureTimeout: 500,
		// Ensure that we only scope the undo/redo to the current editor.
		// The yjs document's clientID is added once it's available.
		trackedOrigins: new Set( [ LOCAL_EDITOR_ORIGIN ] ),
	} );

	function updatePositionMeta(
		event: StackItemEvent,
		lastSelection: WPSelection | null
	): void {
		if ( lastSelection === null ) {
			// If we don't have a selection, then don't save anything extra
			// to the stack.
			console.log( 'No lastSelection, doing nothing' );
			return;
		} else if ( event.type === 'redo' ) {
			// Don't modify anything when restoring a redo.
			console.log( 'Skipping redo update' );
			return;
		}

		const clientId = lastSelection.selectionStart.clientId;
		const block = findBlockByClientIdInDoc( clientId, event.ydoc );
		const attributeKey = lastSelection.selectionStart.attributeKey;
		const changedYText = block?.get( attributeKey );

		if ( ! ( changedYText instanceof Y.Text ) ) {
			// Could not find the relevant YText in the document, skip bundling position
			console.log( 'Could not find relavant YText, doing nothing' );
			return;
		}

		if ( attributeKey && clientId ) {
			const offset = lastSelection.selectionStart.offset;
			const relativePosition = Y.createRelativePositionFromTypeIndex(
				changedYText,
				offset
			);

			console.log( 'Setting position meta with:', {
				attributeKey,
				relativePosition,
				clientId,
			} );

			event.stackItem.meta.set( 'position', {
				attributeKey,
				relativePosition,
				clientId,
			} );
		} else {
			console.log( 'Could not set position meta:', {
				attributeKey,
				clientId,
			} );
		}
	}

	function restorePosition( event: StackItemEvent ): void {
		console.log( '--- restorePosition()' );
		const { relativePosition, clientId, attributeKey } =
			event.stackItem.meta.get( 'position' ) ?? {};

		if ( relativePosition && clientId && attributeKey ) {
			const absolutePosition =
				Y.createAbsolutePositionFromRelativePosition(
					relativePosition,
					event.ydoc
				);

			console.log( 'Got absolutePosition:', absolutePosition );

			if ( absolutePosition ) {
				const { selectionChange } = dispatch( blockEditorStore ) as {
					selectionChange: (
						clientId: string | WPSelection,
						attributeKey: string,
						startOffset: number,
						endOffset: number
					) => void;
				};

				console.log( 'Restoring selection:', {
					clientId,
					attributeKey,
					index: absolutePosition.index,
				} );

				selectionChange(
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
		updatePositionMeta( event, selectionTracker.getLastSelection() );
	} );

	yUndoManager.on( 'stack-item-updated', ( event: StackItemEvent ) => {
		updatePositionMeta( event, selectionTracker.getLastSelection() );
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
			console.log( '--- addRecord():', {
				_record,
				_isStaged,
				lastSelection: selectionTracker.getLastSelection(),
			} );
			// This is a no-op for Yjs since it automatically tracks changes.
			// If needed, we could implement custom logic to handle specific records.
		},

		/**
		 * Add a Yjs map to the scope of the undo manager.
		 *
		 * @param {Y.Map< any >} ymap The Yjs map to add to the scope.
		 */
		addToScope( ymap: Y.Map< any > ): void {
			yUndoManager.addToScope( ymap );
		},

		/**
		 * Undo the last recorded changes.
		 *
		 */
		undo(): HistoryRecord< ObjectData > | undefined {
			if ( ! yUndoManager.canUndo() ) {
				return;
			}

			// Perform the undo operation
			yUndoManager.undo();

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

/**
 * When a change is made to the document, we don't know the starting
 * position of the user before the change. That's because the 'stack-item-added'
 * event and addRecord() method are called after the selection has updated to
 * the new cursor position after the change has occurred.
 *
 * We need the position of the cursor before the change in order to restore the
 * selection position with an undo. To do so, keep the current and prior
 * selection position. Each time position changes, update the last selection
 * position and use this value to store on the undo stack.
 */
class SelectionTracker {
	private lastSelection: WPSelection | null = null;
	private currentSelection: WPSelection | null = null;
	private unsubscribe: ( () => void ) | null = null;

	constructor() {
		const { getSelectionStart, getSelectionEnd } = select(
			blockEditorStore
		) as {
			getSelectionStart: () => WPBlockSelection;
			getSelectionEnd: () => WPBlockSelection;
		};

		// Initialize with current selection
		this.currentSelection = {
			selectionStart: getSelectionStart(),
			selectionEnd: getSelectionEnd(),
		};

		// Subscribe to selection changes
		this.unsubscribe = subscribe( () => {
			const newSelection = {
				selectionStart: getSelectionStart(),
				selectionEnd: getSelectionEnd(),
			};

			// Only update if selection actually changed
			if ( newSelection !== this.currentSelection ) {
				this.lastSelection = this.currentSelection;
				this.currentSelection = newSelection;
			}
		}, blockEditorStore );
	}

	/**
	 * Get the last selection position (before the current one).
	 */
	getLastSelection(): WPSelection | null {
		return this.lastSelection;
	}

	/**
	 * Clean up the subscription.
	 */
	destroy(): void {
		if ( this.unsubscribe ) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
	}
}
