/**
 * External dependencies
 */
import type * as Y from 'yjs';

/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { select, subscribe } from '@wordpress/data';
// @ts-expect-error No exported types for block editor store selectors.
import { type BlockEditorStoreSelectors } from '@wordpress/block-editor/build-types/store/selectors';

/**
 * Internal dependencies
 */
import type {
	PostEditorState,
	UserInfo,
	WPBlockSelection,
} from './awareness-types';
import type { RecordHandlers } from '../types';
import { AwarenessState } from './awareness-state';
import { areUserInfosEqual } from '../user-utils';
import {
	LOCAL_CURSOR_UPDATE_DEBOUNCE_IN_MS,
	AWARENESS_CURSOR_UPDATE_THROTTLE_IN_MS,
	CRDT_RECORD_MAP_KEY,
} from '../config';
import type { SelectableBlock } from '../selection-utils';
import {
	updateSelectionInEntityRecord,
	getSelectionState,
	areEditorStatesEqual,
} from '../selection-utils';

export class PostEditorAwarenessState extends AwarenessState< PostEditorState > {
	protected equalityFieldChecks = {
		editorState: areEditorStatesEqual,
		userInfo: areUserInfosEqual,
	};

	public setUp( recordHandlers: RecordHandlers, userInfo: UserInfo ): void {
		super.setUp( recordHandlers, userInfo );

		this.subscribeToSelectionChanges( recordHandlers );
	}

	private subscribeToSelectionChanges( handlers: RecordHandlers ): void {
		const {
			getSelectionStart,
			getSelectionEnd,
			getSelectedBlocksInitialCaretPosition,
		} = select( blockEditorStore ) as BlockEditorStoreSelectors;

		// Keep track of the current selection in the outer scope so we can compare
		// in the subscription.
		let selectionStart = getSelectionStart();
		let selectionEnd = getSelectionEnd();
		let localCursorTimeout: NodeJS.Timeout | null = null;

		// Provided type is generic `Function`.

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
			void updateSelectionInEntityRecord(
				handlers,
				selectionStart,
				selectionEnd,
				getSelectedBlocksInitialCaretPosition()
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
				this.updateSelectionState( selectionStart, selectionEnd );
			}, LOCAL_CURSOR_UPDATE_DEBOUNCE_IN_MS );
		} );
	}

	private updateSelectionState(
		selectionStart: WPBlockSelection,
		selectionEnd: WPBlockSelection
	): void {
		const ydoc = this.doc.getMap( CRDT_RECORD_MAP_KEY );
		const yBlocks = ydoc.get( 'blocks' ) as Y.Array< SelectableBlock >;
		const selection = getSelectionState(
			selectionStart,
			selectionEnd,
			yBlocks
		);

		// Throttle remote awareness updates.
		this.setThrottledLocalStateField(
			'editorState',
			{ selection },
			AWARENESS_CURSOR_UPDATE_THROTTLE_IN_MS
		);
	}
}
