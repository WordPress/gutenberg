/**
 * WordPress dependencies
 */
import { dispatch, select, subscribe } from '@wordpress/data';
import { Y } from '@wordpress/sync';
// @ts-ignore No exported types for block editor store selectors.
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { BaseAwarenessState, baseEqualityFieldChecks } from './base-awareness';
import {
	AWARENESS_CURSOR_UPDATE_THROTTLE_IN_MS,
	LOCAL_CURSOR_UPDATE_DEBOUNCE_IN_MS,
} from './config';
import { STORE_NAME as coreStore } from '../name';
import {
	areSelectionsStatesEqual,
	getSelectionState,
} from '../utils/crdt-user-selections';

import type { SelectionCursor, WPBlockSelection } from '../types';
import type {
	DebugUserData,
	EditorState,
	PostEditorState,
	SerializableYItem,
	YDocDebugData,
} from './types';

export class PostEditorAwareness extends BaseAwarenessState< PostEditorState > {
	protected equalityFieldChecks = {
		...baseEqualityFieldChecks,
		editorState: this.areEditorStatesEqual,
	};

	public constructor(
		doc: Y.Doc,
		private kind: string,
		private name: string,
		private postId: number
	) {
		super( doc );
	}

	protected onSetUp(): void {
		super.onSetUp();

		this.subscribeToUserSelectionChanges();
	}

	/**
	 * Subscribe to user selection changes and update the selection state.
	 */
	private subscribeToUserSelectionChanges(): void {
		const {
			getSelectionStart,
			getSelectionEnd,
			getSelectedBlocksInitialCaretPosition,
		} = select( blockEditorStore );

		// Keep track of the current selection in the outer scope so we can compare
		// in the subscription.
		let selectionStart = getSelectionStart();
		let selectionEnd = getSelectionEnd();
		let localCursorTimeout: NodeJS.Timeout | null = null;

		subscribe( () => {
			const newSelectionStart = getSelectionStart();
			const newSelectionEnd = getSelectionEnd();

			if (
				newSelectionStart === selectionStart &&
				newSelectionEnd === selectionEnd
			) {
				return;
			}

			selectionStart = newSelectionStart;
			selectionEnd = newSelectionEnd;

			// Typically selection position is only persisted after typing in a block, which
			// can cause selection position to be reset by other users making block updates.
			// Ensure we update the controlled selection right away, persisting our cursor position locally.
			const initialPosition = getSelectedBlocksInitialCaretPosition();
			void this.updateSelectionInEntityRecord(
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
				const selectionState = getSelectionState(
					selectionStart,
					selectionEnd,
					this.doc
				);

				this.setThrottledLocalStateField(
					'editorState',
					{ selection: selectionState },
					AWARENESS_CURSOR_UPDATE_THROTTLE_IN_MS
				);
			}, LOCAL_CURSOR_UPDATE_DEBOUNCE_IN_MS );
		} );
	}

	/**
	 * Update the entity record with the current user's selection.
	 *
	 * @param selectionStart  - The start position of the selection.
	 * @param selectionEnd    - The end position of the selection.
	 * @param initialPosition - The initial position of the selection.
	 */
	private async updateSelectionInEntityRecord(
		selectionStart: WPBlockSelection,
		selectionEnd: WPBlockSelection,
		initialPosition: number | null
	): Promise< void > {
		// Send an entityRecord `selection` update if we have a selection.
		//
		// Normally WordPress updates the `selection` property of the post when changes are made to blocks.
		// In a multi-user setup, block changes can occur from other users. When an entity is updated from another
		// user's changes, useBlockSync() in Gutenberg will reset the user's selection to the last saved selection.
		//
		// Manually adding an edit for each movement ensures that other user's changes to the document will
		// not cause the local user's selection to reset to the last local change location.
		const edits = {
			selection: { selectionStart, selectionEnd, initialPosition },
		};

		const options = {
			undoIgnore: true,
		};

		// @ts-ignore Types are not provided when using store name instead of store instance.
		dispatch( coreStore ).editEntityRecord(
			this.kind,
			this.name,
			this.postId,
			edits,
			options
		);
	}

	/**
	 * Check if two editor states are equal.
	 *
	 * @param state1 - The first editor state.
	 * @param state2 - The second editor state.
	 * @return True if the editor states are equal, false otherwise.
	 */
	private areEditorStatesEqual(
		state1?: EditorState,
		state2?: EditorState
	): boolean {
		if ( ! state1 || ! state2 ) {
			return state1 === state2;
		}

		return areSelectionsStatesEqual( state1.selection, state2.selection );
	}

	/**
	 * Get the absolute position index from a selection cursor.
	 *
	 * @param selection - The selection cursor.
	 * @return The absolute position index, or null if not found.
	 */
	public getAbsolutePositionIndex(
		selection: SelectionCursor
	): number | null {
		return (
			Y.createAbsolutePositionFromRelativePosition(
				selection.cursorPosition.relativePosition,
				this.doc
			)?.index ?? null
		);
	}

	/**
	 * Type guard to check if a struct is a Y.Item (not Y.GC)
	 * @param struct - The struct to check.
	 * @return True if the struct is a Y.Item, false otherwise.
	 */
	private isYItem( struct: Y.Item | Y.GC ): struct is Y.Item {
		return 'content' in struct;
	}

	/**
	 * Get data for debugging, using the awareness state.
	 *
	 * @return {YDocDebugData} The debug data.
	 */
	public getDebugData(): YDocDebugData {
		const ydoc = this.doc;

		// Manually extract doc data to avoid deprecated toJSON method
		const docData: Record< string, unknown > = Object.fromEntries(
			Array.from( ydoc.share, ( [ key, value ] ) => [
				key,
				value.toJSON(),
			] )
		);

		// Build userMap from awareness store (all users seen this session)
		const userMapData = new Map< string, DebugUserData >(
			Array.from( this.getSeenStates().entries() ).map(
				( [ clientId, userState ] ) => [
					String( clientId ),
					{
						name: userState.userInfo.name,
						wpUserId: userState.userInfo.id,
					},
				]
			)
		);

		// Serialize Yjs client items to avoid deep nesting
		const serializableClientItems: Record<
			number,
			Array< SerializableYItem >
		> = {};

		ydoc.store.clients.forEach( ( structs, clientId ) => {
			// Filter for Y.Item only (skip Y.GC garbage collection structs)
			const items = structs.filter( this.isYItem );

			serializableClientItems[ clientId ] = items.map( ( item ) => {
				const { left, right, ...rest } = item;

				return {
					...rest,
					left: left
						? {
								id: left.id,
								length: left.length,
								origin: left.origin,
								content: left.content,
						  }
						: null,
					right: right
						? {
								id: right.id,
								length: right.length,
								origin: right.origin,
								content: right.content,
						  }
						: null,
				};
			} );
		} );

		return {
			doc: docData,
			clients: serializableClientItems,
			userMap: Object.fromEntries( userMapData ),
		};
	}
}
