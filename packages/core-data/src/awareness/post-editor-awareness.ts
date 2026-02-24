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
import { getBlockPathInYdoc, resolveBlockClientIdByPath } from './block-lookup';
import {
	AWARENESS_CURSOR_UPDATE_THROTTLE_IN_MS,
	LOCAL_CURSOR_UPDATE_DEBOUNCE_IN_MS,
} from './config';
import { STORE_NAME as coreStore } from '../name';
import {
	areSelectionsStatesEqual,
	getSelectionState,
	SelectionType,
} from '../utils/crdt-user-selections';

import type { SelectionState, WPBlockSelection } from '../types';
import type { YBlocks } from '../utils/crdt-blocks';
import type {
	DebugCollaboratorData,
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

		this.subscribeToCollaboratorSelectionChanges();
	}

	/**
	 * Subscribe to collaborator selection changes and update the selection state.
	 */
	private subscribeToCollaboratorSelectionChanges(): void {
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
	 * Update the entity record with the current collaborator's selection.
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
	 * Resolve a selection state to a text index and block client ID.
	 *
	 * For text-based selections, navigates up from the resolved Y.Text via
	 * AbstractType.parent to find the containing block, then resolves the
	 * local clientId via the block's tree path.
	 * For WholeBlock selections, resolves the block's relative position and
	 * then finds the local clientId via tree path.
	 *
	 * Tree-path resolution is used instead of reading the clientId directly
	 * from the Yjs block because the local block-editor store may use different
	 * clientIds (e.g. in "Show Template" mode where blocks are cloned).
	 *
	 * @param selection - The selection state.
	 * @return The text index and block client ID, or nulls if not resolvable.
	 */
	public convertSelectionStateToAbsolute( selection: SelectionState ): {
		textIndex: number | null;
		localClientId: string | null;
	} {
		if ( selection.type === SelectionType.None ) {
			return { textIndex: null, localClientId: null };
		}

		if ( selection.type === SelectionType.WholeBlock ) {
			const absolutePos = Y.createAbsolutePositionFromRelativePosition(
				selection.blockPosition,
				this.doc
			);

			let localClientId: string | null = null;

			if ( absolutePos && absolutePos.type instanceof Y.Array ) {
				const parentArray = absolutePos.type as YBlocks;
				const block = parentArray.get( absolutePos.index );

				if ( block instanceof Y.Map ) {
					const path = getBlockPathInYdoc( block );
					localClientId = path
						? resolveBlockClientIdByPath( path )
						: null;
				}
			}

			return { textIndex: null, localClientId };
		}

		// Text-based selections: resolve cursor position and navigate up.
		const cursorPos =
			'cursorPosition' in selection
				? selection.cursorPosition
				: selection.cursorStartPosition;

		const absolutePosition = Y.createAbsolutePositionFromRelativePosition(
			cursorPos.relativePosition,
			this.doc
		);

		if ( ! absolutePosition ) {
			return { textIndex: null, localClientId: null };
		}

		// Navigate up: Y.Text -> attributes Y.Map -> block Y.Map
		const yType = absolutePosition.type.parent?.parent;
		const path =
			yType instanceof Y.Map ? getBlockPathInYdoc( yType ) : null;
		const localClientId = path ? resolveBlockClientIdByPath( path ) : null;

		return { textIndex: absolutePosition.index, localClientId };
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

		// Build collaboratorMap from awareness store (all collaborators seen this session)
		const collaboratorMapData = new Map< string, DebugCollaboratorData >(
			Array.from( this.getSeenStates().entries() ).map(
				( [ clientId, collaboratorState ] ) => [
					String( clientId ),
					{
						name: collaboratorState.collaboratorInfo.name,
						wpUserId: collaboratorState.collaboratorInfo.id,
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
			collaboratorMap: Object.fromEntries( collaboratorMapData ),
		};
	}
}
