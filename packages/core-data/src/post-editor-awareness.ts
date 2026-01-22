/**
 * WordPress dependencies
 */
import { select, subscribe } from '@wordpress/data';
import {
	LOCAL_CURSOR_UPDATE_DEBOUNCE_IN_MS,
	AWARENESS_CURSOR_UPDATE_THROTTLE_IN_MS,
	type RecordHandlers,
	AwarenessState,
	type UserInfo,
	areUserInfosEqual,
} from '@wordpress/sync';
// @ts-ignore No exported types for block editor store selectors.
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	areSelectionsStatesEqual,
	getSelectionState,
} from './utils/crdt-user-selections';
import type { WPBlockSelection, PostEditorState, EditorState } from './types';

export class PostEditorAwareness extends AwarenessState< PostEditorState > {
	protected equalityFieldChecks = {
		editorState: this.areEditorStatesEqual,
		userInfo: areUserInfosEqual,
	};

	public setUp( recordHandlers: RecordHandlers, userInfo: UserInfo ): void {
		super.setUp( recordHandlers, userInfo );

		this.subscribeToUserSelectionChanges( recordHandlers );
	}

	/**
	 * Subscribe to user selection changes and update the selection state.
	 *
	 * @param recordHandlers - The record handlers.
	 */
	private subscribeToUserSelectionChanges(
		recordHandlers: RecordHandlers
	): void {
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
				recordHandlers,
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
	 * @param recordHandlers
	 * @param selectionStart  - The start position of the selection.
	 * @param selectionEnd    - The end position of the selection.
	 * @param initialPosition - The initial position of the selection.
	 */
	private async updateSelectionInEntityRecord(
		recordHandlers: RecordHandlers,
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

		recordHandlers.editRecord( edits, options );
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
}
